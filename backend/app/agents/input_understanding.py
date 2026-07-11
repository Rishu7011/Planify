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
from app.agents.state import WorkflowState
from app.schemas.agents import InputUnderstandingOutput

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


async def input_understanding_agent(state: WorkflowState) -> Dict[str, Any]:
    """
    LangGraph node: parse raw user input into structured project understanding.
    Updates project_context with extracted domain, problem statement, known facts.
    """
    llm = get_llm()
    messages = _PROMPT.format_messages(user_message=state.raw_user_message)

    logger.info("[input_understanding] Running for project %s", state.project_id)
    response = await llm.ainvoke(messages)

    try:
        data = json.loads(response.content)
        output = InputUnderstandingOutput(**data)
    except Exception as exc:
        logger.warning("[input_understanding] Parse failed (%s) — using defaults", exc)
        output = InputUnderstandingOutput(
            domain="unknown",
            idea_summary=state.raw_user_message[:200],
            known_facts=[],
            ambiguity_flags=["Domain not clear", "Problem statement unclear", "Budget unknown", "Timeline unknown"],
            confidence=0.1,
        )

    # Merge into context
    context = state.project_context.model_copy()
    context.domain = output.domain
    context.problem_statement = output.idea_summary
    context.known_facts = list(set(context.known_facts + output.known_facts))
    context.ambiguity_flags = output.ambiguity_flags

    return {
        "project_context": context,
        "agent_outputs": {**state.agent_outputs, "input_understanding": output.model_dump()},
        "agents_executed": [*state.agents_executed, "input_understanding_agent"],
        "current_agent": "input_understanding",
    }
