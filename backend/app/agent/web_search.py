"""
web_search.py
-------------
DuckDuckGo web search via LangChain Community:

  from langchain_community.tools.ddg_search.tool import DuckDuckGoSearchTool
  # https://reference.langchain.com/python/langchain-community/tools/ddg_search/tool/DuckDuckGoSearchTool

No API key required. Failures are swallowed so agent nodes never crash.

IMPORTANT: Do NOT call this on every chat turn (e.g. "hi"). Search is gated by
``should_run_web_search`` so greetings stay fast.
"""

from __future__ import annotations

import logging
import re
from functools import lru_cache
from typing import Any

logger = logging.getLogger(__name__)

# Pure small-talk / filler — never worth a web round-trip.
_LIGHT_MESSAGE = re.compile(
    r"^\s*("
    r"hi|hello|hey|yo|sup|hiya|howdy|"
    r"thanks|thank\s*you|ty|thx|"
    r"ok|okay|k|cool|nice|great|awesome|"
    r"bye|goodbye|see\s*ya|good\s*morning|good\s*evening|good\s*night|"
    r"yes|yeah|yep|no|nope|sure|alright"
    r")[\s!.?🤔👋😊]*$",
    re.IGNORECASE,
)

# Only search when the user is actually asking for external market / competitor / pricing facts.
_SEARCH_TRIGGERS = (
    "search",
    "look up",
    "competitor",
    "competition",
    "market size",
    "market trend",
    "market research",
    "latest trend",
    "pricing model",
    "cost of building",
    "funding round",
    "latest news",
    "recent news",
)


@lru_cache(maxsize=1)
def get_duckduckgo_search_tool():
    """LangChain DuckDuckGoSearchTool factory → DuckDuckGoSearchRun instance."""
    from langchain_community.tools.ddg_search.tool import DuckDuckGoSearchTool

    return DuckDuckGoSearchTool()


def is_light_message(user_input: str) -> bool:
    """True for greetings / short acks that must stay fast (no search, no heavy work)."""
    text = (user_input or "").strip()
    if not text:
        return True
    if len(text) <= 12 and _LIGHT_MESSAGE.match(text):
        return True
    return bool(_LIGHT_MESSAGE.match(text))


def clean_user_message(user_input: str) -> str:
    """Extract only the user's actual prompt, ignoring any appended file/document content blocks."""
    if not user_input:
        return ""
    marker = "The user attached the following documents this turn."
    if marker in user_input:
        return user_input.split(marker)[0].strip()
    return user_input.strip()


def should_run_web_search(
    user_input: str,
    project_context: dict[str, Any] | None = None,
    *,
    force: bool = False,
) -> bool:
    """Gate expensive DuckDuckGo calls — off for hi/ok/thanks and thin turns."""
    if force:
        return True
    
    clean_input = clean_user_message(user_input)
    if is_light_message(clean_input):
        return False

    text = clean_input.strip().lower()
    if len(text) < 20:
        # Short project fragments without research intent — skip search.
        return False

    if any(trigger in text for trigger in _SEARCH_TRIGGERS):
        return True

    # Rich idea description + explicit ask for fresh intel keywords already covered.
    # Default OFF so normal discovery/chat stays responsive.
    return False


def search_web(query: str, *, max_results: int = 5) -> str:
    """Run DuckDuckGoSearchTool and return a plain-text result string."""
    del max_results
    q = (query or "").strip()
    if not q:
        return ""

    try:
        tool = get_duckduckgo_search_tool()
        raw = tool.invoke(q)
        return str(raw or "").strip()
    except Exception as exc:
        logger.warning("[web_search] DuckDuckGoSearchTool failed for %r: %s", q, exc)
        return ""


def build_project_search_queries(
    *,
    user_input: str,
    project_context: dict[str, Any] | None,
    max_queries: int = 1,
) -> list[str]:
    """Build a small set of search queries (default 1 — keep latency low)."""
    ctx = project_context or {}
    idea = (
        (ctx.get("idea") or "")
        or (ctx.get("problem_statement") or "")
        or (ctx.get("project_name") or "")
        or user_input
    )
    idea = " ".join(str(idea).split())[:120]
    industry = (ctx.get("industry") or ctx.get("business_domain") or "").strip()
    lower = (user_input or "").lower()

    candidates: list[str] = []
    if any(k in lower for k in ("idea", "startup", "niche", "opportunity", "brainstorm")):
        candidates.append(f"{idea} startup ideas opportunities {industry}".strip())
    if any(k in lower for k in ("competitor", "competition", "alternative")):
        candidates.append(f"{idea} competitors alternatives")
    if any(k in lower for k in ("market", "trend", "research")):
        candidates.append(f"{idea} market trends {industry} 2025 2026".strip())
    if any(k in lower for k in ("budget", "cost", "funding", "pricing")):
        candidates.append(f"{idea} MVP cost budget startup")

    if not candidates:
        candidates.append(f"{idea} startup market competitors".strip())

    seen: set[str] = set()
    unique: list[str] = []
    for q in candidates:
        key = q.lower()
        if key and key not in seen:
            seen.add(key)
            unique.append(q)
    return unique[: max(1, max_queries)]


def gather_web_intel(
    *,
    user_input: str,
    project_context: dict[str, Any] | None,
    max_results_per_query: int = 4,
    max_queries: int = 1,
    force: bool = False,
) -> str:
    """Search via DuckDuckGoSearchTool when useful; otherwise return a no-op stub."""
    if not should_run_web_search(user_input, project_context, force=force):
        return "(Web search skipped — not needed for this message.)"

    queries = build_project_search_queries(
        user_input=user_input,
        project_context=project_context,
        max_queries=max_queries,
    )
    chunks: list[str] = []
    for q in queries:
        text = search_web(q, max_results=max_results_per_query)
        body = text.strip() if text else "(No web results available.)"
        chunks.append(f"### Query: {q}\n{body}")

    if not chunks:
        return "(No web intel gathered.)"
    return (
        "Fresh web research via LangChain DuckDuckGoSearchTool. "
        "Use for trends, competitors, and startup ideas. Prefer recent signals; "
        "label speculative claims.\n\n"
        + "\n\n".join(chunks)
    )
