"""
Clarification Agent.

Decides whether we have enough context to generate reports,
or needs to ask domain-specific clarification questions first.
"""
from __future__ import annotations

import json
import logging
from typing import Any, Dict

from langchain_core.prompts import ChatPromptTemplate

from app.agents.llm import get_llm
from app.schemas.agents import ClarificationOutput
from app.schemas.context import ProjectContext

logger = logging.getLogger(__name__)

_PROMPT = ChatPromptTemplate.from_template(
    """You are a product discovery expert.

A user wants to build something. You have this understanding so far:
Domain: {domain}
Problem: {problem}
Known facts: {known_facts}
Ambiguity flags: {ambiguity_flags}

Decide if the context is sufficient to generate a useful PRD, feasibility study, ROI model, and roadmap.

SUFFICIENT means:
- We know the domain
- We have a clear problem statement
- We know at least one constraint (budget OR timeline OR team size)
- The target audience is implied

Return ONLY a valid JSON object — no markdown fences:
{{
  "sufficient_context": true or false,
  "clarification_questions": []
}}

If sufficient_context is false, generate 3–5 HIGH-VALUE, domain-specific questions.
- For healthcare: ask about patient data compliance, care setting (hospital vs. clinic)
- For fintech: ask about licensing, B2B vs. consumer, transaction volume
- For B2B SaaS: ask about target company size, sales motion (PLG vs. enterprise)
- For consumer: ask about monetization model (subscription, ads, marketplace)

Do NOT ask generic questions like "Tell me more about your idea."
Every question must be specific and actionable.
"""
)


def _strip_fences(text: str) -> str:
    """Strip markdown code fences from LLM output."""
    text = text.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        lines = lines[1:] if lines[0].startswith("```") else lines
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        text = "\n".join(lines).strip()
    return text


async def clarification_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    LangGraph node: check context completeness and generate targeted questions.
    Routes to 'prd' if sufficient, or 'awaiting_input' to pause for user answers.
    """
    llm = get_llm()
    project_id = state.get("project_id", "unknown")

    # Resolve project context (may be Pydantic model or plain dict)
    raw_context = state.get("project_context")
    if isinstance(raw_context, dict):
        context = ProjectContext(**raw_context)
    elif raw_context is not None:
        context = raw_context
    else:
        context = ProjectContext()

    known_facts = context.known_facts or []
    ambiguity_flags = context.ambiguity_flags or []

    messages = _PROMPT.format_messages(
        domain=context.domain or "Unknown",
        problem=context.problem_statement or "Not stated",
        known_facts=", ".join(known_facts) if known_facts else "None",
        ambiguity_flags=", ".join(ambiguity_flags) if ambiguity_flags else "None",
    )

    logger.info("[clarification] Evaluating context completeness for project %s", project_id)
    response = await llm.ainvoke(messages)

    try:
        content = _strip_fences(response.content)
        data = json.loads(content)
        output = ClarificationOutput(**data)
    except Exception as exc:
        logger.warning("[clarification] Parse failed (%s) — defaulting to ask questions", exc)
        output = ClarificationOutput(
            sufficient_context=False,
            clarification_questions=[
                "What is the core problem you're solving, and who has this problem?",
                "What's your estimated budget or funding situation?",
                "What's your timeline to reach an MVP or first launch?",
                "What's your team size and key skill sets?",
            ],
        )

    routing = "prd" if output.sufficient_context else "awaiting_input"

    existing_outputs = state.get("agent_outputs") or {}
    existing_executed = state.get("agents_executed") or []

    return {
        "agent_outputs": {**existing_outputs, "clarification": output.model_dump()},
        "agents_executed": [*existing_executed, "clarification_agent"],
        "routing_decision": routing,
        "status": "running" if routing == "prd" else "awaiting_input",
        "current_agent": "clarification",
    }
