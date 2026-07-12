"""
PRD Agent.

Generates a comprehensive Product Requirements Document from ProjectContext.
"""
from __future__ import annotations

import json
import logging
from typing import Any, Dict

from langchain_core.prompts import ChatPromptTemplate

from app.agents.llm import get_llm
from app.schemas.agents import PRDOutput
from app.schemas.context import ProjectContext

logger = logging.getLogger(__name__)

_PROMPT = ChatPromptTemplate.from_template(
    """You are a world-class Product Manager with experience at top-tier tech companies.

Generate a comprehensive PRD for this project:

Domain: {domain}
Problem Statement: {problem}
Target Audience: {audience}
Known Facts: {known_facts}
Constraints: {constraints}

Create a full PRD. Return ONLY a valid JSON object — no markdown fences, no extra text:
{{
  "overview": {{"title": "...", "content": "2-3 sentence high-level description"}},
  "problem_statement": {{"title": "...", "content": "detailed problem + why it matters"}},
  "goals": ["3-5 specific measurable goals"],
  "personas": [
    {{
      "name": "...",
      "role": "...",
      "needs": ["specific need 1", "specific need 2"],
      "pain_points": ["pain 1", "pain 2"]
    }}
  ],
  "user_stories": [
    "As a [persona], I want to [action] so that [benefit]."
  ],
  "functional_requirements": ["8-12 specific feature requirements"],
  "non_functional_requirements": ["performance, security, scalability requirements"],
  "acceptance_criteria": ["measurable criteria for MVP success"],
  "success_metrics": ["KPIs with target values"],
  "mvp_definition": "Clear description of what is IN and OUT of MVP scope",
  "assumptions_stated": ["explicit assumption 1", "explicit assumption 2"]
}}

CRITICAL rules:
- All personas must be realistic and domain-specific (not generic "user")
- User stories must follow "As a..., I want..., so that..." format exactly
- Functional requirements must be specific (avoid "the system should be fast")
- State all assumptions you're making — never infer without noting it
- Include 2-3 personas, 5-8 user stories, 8-12 functional requirements
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


async def prd_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    """LangGraph node: generate a comprehensive Product Requirements Document."""
    llm = get_llm(temperature=0.3)

    project_id = state.get("project_id", "unknown")

    raw_context = state.get("project_context")
    if isinstance(raw_context, dict):
        context = ProjectContext(**raw_context)
    elif raw_context is not None:
        context = raw_context
    else:
        context = ProjectContext()

    constraints = context.constraints
    constraints_dict = constraints.model_dump() if hasattr(constraints, "model_dump") else (constraints or {})

    known_facts = context.known_facts or []

    messages = _PROMPT.format_messages(
        domain=context.domain or "Not specified",
        problem=context.problem_statement or "Not fully defined",
        audience=context.target_audience or "TBD",
        known_facts="\n- ".join(known_facts) if known_facts else "None provided",
        constraints=json.dumps(constraints_dict),
    )

    logger.info("[prd_agent] Generating PRD for project %s", project_id)
    response = await llm.ainvoke(messages)

    try:
        content = _strip_fences(response.content)
        data = json.loads(content)
        output = PRDOutput(**data)
    except Exception as exc:
        logger.error("[prd_agent] Parse failed: %s\nRaw: %s", exc, response.content[:500])
        raise ValueError(f"PRD agent output parsing failed: {exc}") from exc

    existing_outputs = state.get("agent_outputs") or {}
    existing_executed = state.get("agents_executed") or []

    return {
        "agent_outputs": {**existing_outputs, "prd": output.model_dump()},
        "agents_executed": [*existing_executed, "prd_agent"],
        "current_agent": "prd",
    }
