"""
retrieve.py
-----------
Retrieve relevant chunks from the Planify knowledge base and format them
for injection into project_workflow / report_generator prompts.

Soft-fails when RAG is disabled, Atlas Search is unavailable, or the
collection is empty — agents keep working without the knowledge base.
"""

from __future__ import annotations

import logging
import re
from typing import Any

from app.config import get_settings

logger = logging.getLogger(__name__)

_LIGHT = re.compile(
    r"^\s*(hi|hello|hey|thanks|thank you|ok|okay|yes|no|yep|nope|sure)[\s!.?]*$",
    re.IGNORECASE,
)


def should_run_rag(
    user_input: str,
    project_context: dict[str, Any] | None = None,
    *,
    force: bool = False,
) -> bool:
    """Skip retrieval on greetings / empty turns unless forced (reports)."""
    settings = get_settings()
    if not settings.rag_enabled:
        return False
    if force:
        return True
    text = (user_input or "").strip()
    if not text or _LIGHT.match(text):
        return False
    if len(text) < 12 and not (project_context or {}):
        return False
    return True


def _build_query(
    user_input: str,
    project_context: dict[str, Any] | None,
    *,
    report_type: str | None = None,
) -> str:
    ctx = project_context or {}
    parts: list[str] = []
    if report_type:
        parts.append(report_type.replace("_", " "))
    idea = (
        (ctx.get("idea") or "")
        or (ctx.get("problem_statement") or "")
        or (ctx.get("project_name") or "")
    )
    if idea:
        parts.append(str(idea)[:160])
    if user_input:
        parts.append(user_input.strip()[:200])
    industry = ctx.get("industry") or ctx.get("business_domain")
    if industry:
        parts.append(str(industry))
    return " ".join(p for p in parts if p).strip() or (user_input or "product planning")


def gather_rag_context(
    *,
    user_input: str,
    project_context: dict[str, Any] | None = None,
    k: int | None = None,
    force: bool = False,
    report_type: str | None = None,
) -> str:
    """Return formatted knowledge-base excerpts, or a stub when unavailable."""
    if not should_run_rag(user_input, project_context, force=force):
        return "(Knowledge base retrieval skipped.)"

    settings = get_settings()
    top_k = k if k is not None else settings.rag_top_k
    query = _build_query(user_input, project_context, report_type=report_type)

    try:
        from app.agent.rag.vector_store import get_vector_store

        store = get_vector_store()
        docs = store.similarity_search(query, k=max(1, top_k))
    except Exception as exc:
        logger.warning("[rag.retrieve] similarity_search failed: %s", exc)
        return "(No knowledge base results available.)"

    if not docs:
        return "(Knowledge base empty or no matches for this query.)"

    chunks: list[str] = []
    for i, doc in enumerate(docs, start=1):
        page = doc.metadata.get("page")
        source = doc.metadata.get("source") or doc.metadata.get("file_path") or "kb"
        page_bit = f", page {page}" if page is not None else ""
        body = (doc.page_content or "").strip()
        if not body:
            continue
        if len(body) > 900:
            body = body[:900] + "…"
        chunks.append(f"### Excerpt {i} ({source}{page_bit})\n{body}")

    if not chunks:
        return "(Knowledge base empty or no matches for this query.)"

    return (
        "Internal knowledge base excerpts (prefer these for framework/product facts; "
        "do not invent citations). Label speculation clearly.\n\n"
        + "\n\n".join(chunks)
    )
