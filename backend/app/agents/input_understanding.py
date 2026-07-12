"""
Input Understanding Agent.

Extracts structured meaning from the raw user message:
domain, idea summary, known facts, ambiguity flags.
"""
from __future__ import annotations

import json
import logging
from typing import Any, Dict

from langchain_core.prompts import ChatPromptTemplate

from app.agents.llm import get_llm
from app.schemas.agents import InputUnderstandingOutput
from app.schemas.context import ProjectContext

logger = logging.getLogger(__name__)

_PROMPT = ChatPromptTemplate.from_template(
    """You are a senior product strategist.
Analyze the user's project idea and extract structured information.

User message:
{user_message}

Return ONLY a valid JSON object — no markdown fences, no extra text:
{{
  "domain": "The industry/domain (e.g. healthcare, fintech, B2B SaaS, edtech)",
  "idea_summary": "1–2 sentence summary of the core idea",
  "known_facts": ["list", "of", "concrete", "facts", "mentioned"],
  "ambiguity_flags": ["list", "of", "unclear", "or", "missing", "info"],
  "confidence": 0.0
}}

Rules:
- confidence is 0.0–1.0 (how complete the info is)
- Flag anything unclear rather than inferring it
- known_facts must be facts from the message, not inferences
"""
)


def _strip_fences(text: str) -> str:
    """Strip markdown code fences (```json ... ```) from LLM output."""
    text = text.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        # Remove opening fence line (```json or ```)
        lines = lines[1:] if lines[0].startswith("```") else lines
        # Remove closing fence line
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        text = "\n".join(lines).strip()
    return text


async def input_understanding_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    LangGraph node: parse raw user input into structured project understanding.
    Updates project_context with extracted domain, problem statement, known facts.
    """
    llm = get_llm()

    raw_user_message = state.get("raw_user_message", "")
    project_id = state.get("project_id", "unknown")

    messages = _PROMPT.format_messages(user_message=raw_user_message)

    logger.info("[input_understanding] Running for project %s", project_id)
    response = await llm.ainvoke(messages)

    try:
        content = _strip_fences(response.content)
        data = json.loads(content)
        output = InputUnderstandingOutput(**data)
    except Exception as exc:
        logger.warning("[input_understanding] Parse failed (%s) — using defaults", exc)
        output = InputUnderstandingOutput(
            domain="unknown",
            idea_summary=raw_user_message[:200],
            known_facts=[],
            ambiguity_flags=["Domain not clear", "Problem statement unclear", "Budget unknown", "Timeline unknown"],
            confidence=0.1,
        )

    # Merge into existing context (preserve existing data, overlay new extraction)
    existing_context: ProjectContext | None = state.get("project_context")
    if existing_context is None:
        existing_context = ProjectContext()

    # Handle both Pydantic model and plain dict forms
    if hasattr(existing_context, "model_copy"):
        context = existing_context.model_copy()
    elif isinstance(existing_context, dict):
        context = ProjectContext(**existing_context)
    else:
        context = ProjectContext()

    context.domain = output.domain
    context.problem_statement = output.idea_summary
    context.known_facts = list(set((context.known_facts or []) + output.known_facts))
    context.ambiguity_flags = output.ambiguity_flags

    existing_outputs = state.get("agent_outputs") or {}
    existing_executed = state.get("agents_executed") or []

    return {
        "project_context": context,
        "agent_outputs": {**existing_outputs, "input_understanding": output.model_dump()},
        "agents_executed": [*existing_executed, "input_understanding_agent"],
        "current_agent": "input_understanding",
    }
