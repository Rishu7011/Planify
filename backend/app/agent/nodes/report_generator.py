"""
nodes/report_generator.py
--------------------------
Universal report generator — triggered by whatever next_workflows the
project_workflow LLM decides to queue.

Known report types get specialist instructions from prompts.py.
"""

from __future__ import annotations

import json
import re
from typing import Final

from langchain_core.messages import AIMessage

from app.agent.db import conversation_repo, project_repo
from app.agent.llm import get_base_llm
from app.agent.prompts import (
    DEFAULT_REPORT_INSTRUCTIONS,
    REPORT_INSTRUCTIONS,
    report_generator_prompt,
)
from app.agent.rag import gather_rag_context
from app.agent.router import REPORT_WORKFLOWS
from app.agent.state import WorkflowState
from app.agent.web_search import gather_web_intel

# Phrase hints to map free-text user requests onto canonical report types.
_REPORT_ALIASES: Final[list[tuple[str, tuple[str, ...]]]] = [
    ("TECHNICAL_ARCHITECTURE", ("technical architecture", "tech architecture", "architecture", "system design")),
    ("MARKET_RESEARCH", ("market research", "market analysis", "tam", "sam")),
    ("COMPETITOR_ANALYSIS", ("competitor", "competitive analysis", "competition")),
    ("ROI", ("roi", "budget", "cost estimate", "unit economics", "break-even")),
    ("HR_PLANNING", ("hr plan", "hiring plan", "team plan", "headcount")),
    ("RISK_ANALYSIS", ("risk analysis", "risk register", "risks")),
    ("ROADMAP", ("roadmap", "timeline plan", "delivery plan")),
    ("FINAL_REPORT", ("final report", "executive summary", "complete report", "full report")),
    ("PRD", ("prd", "product requirements", "requirements doc")),
]

_llm = get_base_llm(temperature=0.3)
_chain = report_generator_prompt | _llm


def _normalize(text: str) -> str:
    return re.sub(r"\s+", " ", (text or "").lower()).strip()


def _report_from_user_text(user_input: str) -> str | None:
    """Infer the primary report type from the user's message phrasing."""
    text = _normalize(user_input)
    if not text:
        return None
    for report_type, aliases in _REPORT_ALIASES:
        for alias in aliases:
            if alias in text:
                return report_type
    return None


def _select_report_type(state: WorkflowState) -> str | None:
    """Choose which report to generate this turn.

    Priority:
      1. Explicit match from the latest user message among queued reports
      2. First queued item that is a real report type (never PROJECT_INITIALIZATION)
      3. Infer from user text even if queue is messy
    """
    metadata = state.get("metadata", {}) or {}
    next_workflows = [
        wf for wf in (metadata.get("next_workflows") or []) if wf and wf != "NO_ACTION"
    ]
    report_queue = [wf for wf in next_workflows if wf in REPORT_WORKFLOWS]
    user_input = state.get("user_input") or ""
    hinted = _report_from_user_text(user_input)

    if hinted and hinted in report_queue:
        return hinted
    if report_queue:
        return report_queue[0]
    if hinted:
        return hinted
    return None


def report_generator_node(state: WorkflowState) -> dict:
    """Universal report generator — trusts whatever the project_workflow LLM queued."""
    project_context = state.get("project_context") or {}
    metadata = state.get("metadata", {})
    session_id = metadata.get("session_id", "default")
    next_workflows = metadata.get("next_workflows", [])

    report_type = _select_report_type(state)

    if not report_type:
        reply = (
            "⚠️ No report was requested. Tell me what to generate "
            "(e.g. PRD, Technical Architecture, ROI / Budget, Roadmap)."
        )
        return {"conversation_history": [AIMessage(content=reply)]}

    if not project_context:
        reply = (
            f"⚠️ I need more project information before I can generate the {report_type}. "
            "Please describe your project first."
        )
        return {"conversation_history": [AIMessage(content=reply)]}

    instructions = REPORT_INSTRUCTIONS.get(report_type, DEFAULT_REPORT_INSTRUCTIONS)
    context_str = json.dumps(project_context, indent=2)

    # Only market / competitor / ROI reports need live web search.
    _SEARCH_REPORTS = {"MARKET_RESEARCH", "COMPETITOR_ANALYSIS", "ROI", "FINAL_REPORT"}
    if report_type in _SEARCH_REPORTS:
        try:
            web_intel = gather_web_intel(
                user_input=state.get("user_input") or report_type,
                project_context=project_context,
                max_queries=1,
                force=True,
            )
        except Exception as search_err:
            print(f"[report_generator] web search skipped: {search_err}")
            web_intel = "(No web intel gathered.)"
    else:
        web_intel = "(Web search skipped for this report type.)"

    try:
        rag_context = gather_rag_context(
            user_input=state.get("user_input") or report_type,
            project_context=project_context,
            force=True,
            report_type=report_type,
        )
    except Exception as rag_err:
        print(f"[report_generator] rag skipped: {rag_err}")
        rag_context = "(No knowledge base results available.)"

    print(f"[report_generator] Generating {report_type}…")
    from app.services.chat_service import get_active_callback
    callback = get_active_callback(session_id)

    report_chunks = []
    for chunk in _chain.stream(
        {
            "report_type": report_type,
            "project_context": context_str,
            "instructions": instructions,
            "web_intel": web_intel,
            "rag_context": rag_context,
        }
    ):
        content_chunk = chunk.content
        report_chunks.append(content_chunk)
        if callback and content_chunk:
            callback(content_chunk)

    report_doc = "".join(report_chunks)

    try:
        existing = project_repo.find_by_session(session_id)
        if existing:
            ctx = dict(project_context)
            reports = list(ctx.get("reports", []))
            if report_type not in reports:
                reports.append(report_type)
            ctx["reports"] = reports
            ctx["stale_outputs"] = [
                s for s in ctx.get("stale_outputs", []) if s != report_type
            ]
            project_repo.update_context(existing["_id"], ctx)

            # Use user_display (clean typed message) for DB — never the expanded
            # blob that includes extracted file text.
            user_for_db = state.get("user_display") or state["user_input"]
            conversation_repo.append_turn(
                session_id=session_id,
                user_input=user_for_db,
                ai_response=report_doc,
                metadata={
                    "project_action": "REPORT_REQUEST",
                    "next_workflows": [wf for wf in next_workflows if wf != report_type],
                    "last_generated_report": report_type,
                },
            )
    except Exception as db_err:
        print(f"[report_generator] MongoDB write warning: {db_err}")

    metadata_update = {
        **metadata,
        "last_generated_report": report_type,
        "next_workflows": [wf for wf in next_workflows if wf != report_type],
    }

    return {
        "conversation_history": [AIMessage(content=report_doc)],
        "metadata": metadata_update,
    }
