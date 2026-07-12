"""
Feasibility Agent.

Assesses technical complexity, risks, and critical dependencies
based on the PRD output.
"""
from __future__ import annotations

import json
import logging
from typing import Any, Dict

from langchain_core.prompts import ChatPromptTemplate

from app.agents.llm import get_llm
from app.schemas.agents import FeasibilityOutput
from app.schemas.context import ProjectContext

logger = logging.getLogger(__name__)

_PROMPT = ChatPromptTemplate.from_template(
    """You are a seasoned Solution Architect with 15+ years of experience.

Given this Product Requirements Document, assess technical feasibility:

Domain: {domain}
Functional Requirements:
{features}

Non-Functional Requirements:
{non_functional}

Constraints: {constraints}

Return ONLY a valid JSON object — no markdown fences:
{{
  "technical_approach": "High-level technology strategy (2-3 paragraphs)",
  "complexity_signal": "low|medium|high",
  "key_risks": [
    "Risk 1: [description] — Mitigation: [mitigation approach]",
    "Risk 2: ..."
  ],
  "critical_dependencies": [
    "External service or technology required (e.g., Stripe for payments, Twilio for SMS)"
  ],
  "regulatory_notes": "Any compliance/regulatory considerations or null",
  "assumptions_stated": ["assumption 1", "assumption 2"]
}}

Rules:
- complexity_signal: low (simple CRUD), medium (moderate AI/integrations), high (novel ML/real-time/compliance)
- Be realistic — if something is hard, say it's hard
- List 4-6 risks with concrete mitigations
- Include build-vs-buy decisions in technical_approach
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


async def feasibility_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    """LangGraph node: assess technical feasibility from PRD."""
    existing_outputs = state.get("agent_outputs") or {}

    if "prd" not in existing_outputs:
        logger.warning("[feasibility] No PRD found in state — skipping")
        return {}

    llm = get_llm()
    prd = existing_outputs["prd"]

    raw_context = state.get("project_context")
    if isinstance(raw_context, dict):
        context = ProjectContext(**raw_context)
    elif raw_context is not None:
        context = raw_context
    else:
        context = ProjectContext()

    constraints = context.constraints
    constraints_dict = constraints.model_dump() if hasattr(constraints, "model_dump") else (constraints or {})

    features = "\n".join(f"- {r}" for r in prd.get("functional_requirements", []))
    non_func = "\n".join(f"- {r}" for r in prd.get("non_functional_requirements", []))

    messages = _PROMPT.format_messages(
        domain=context.domain or "unknown",
        features=features or "See PRD",
        non_functional=non_func or "Standard requirements",
        constraints=json.dumps(constraints_dict),
    )

    logger.info("[feasibility_agent] Running feasibility assessment for project %s", state.get("project_id"))
    response = await llm.ainvoke(messages)

    try:
        content = _strip_fences(response.content)
        data = json.loads(content)
        output = FeasibilityOutput(**data)
    except Exception as exc:
        logger.error("[feasibility_agent] Parse failed: %s", exc)
        raise ValueError(f"Feasibility parse failed: {exc}") from exc

    existing_executed = state.get("agents_executed") or []

    return {
        "agent_outputs": {**existing_outputs, "feasibility": output.model_dump()},
        "agents_executed": [*existing_executed, "feasibility_agent"],
        "current_agent": "feasibility",
    }
