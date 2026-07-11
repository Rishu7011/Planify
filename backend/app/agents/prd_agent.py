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
from app.agents.state import WorkflowState
from app.schemas.agents import PRDOutput

logger = logging.getLogger(__name__)

_PROMPT = ChatPromptTemplate.from_template(
    """You are a world-class Product Manager with experience at top-tier tech companies.

Generate a comprehensive PRD for this project:

Domain: {domain}
Problem Statement: {problem}
Target Audience: {audience}
Known Facts: {known_facts}
Constraints: {constraints}

Create a full PRD. Return ONLY a valid JSON object matching this exact schema:
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


async def prd_agent(state: WorkflowState) -> Dict[str, Any]:
    """LangGraph node: generate a comprehensive Product Requirements Document."""
    llm = get_llm(temperature=0.3)
    context = state.project_context

    messages = _PROMPT.format_messages(
        domain=context.domain or "Not specified",
        problem=context.problem_statement or "Not fully defined",
        audience=context.target_audience or "TBD",
        known_facts="\n- ".join(context.known_facts) if context.known_facts else "None provided",
        constraints=json.dumps(context.constraints.model_dump()) if context.constraints else "{}",
    )

    logger.info("[prd_agent] Generating PRD for project %s", state.project_id)
    response = await llm.ainvoke(messages)

    try:
        # Strip markdown fences if present
        content = response.content.strip()
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        data = json.loads(content)
        output = PRDOutput(**data)
    except Exception as exc:
        logger.error("[prd_agent] Parse failed: %s\nRaw: %s", exc, response.content[:500])
        raise ValueError(f"PRD agent output parsing failed: {exc}") from exc

    return {
        "agent_outputs": {**state.agent_outputs, "prd": output.model_dump()},
        "agents_executed": [*state.agents_executed, "prd_agent"],
        "current_agent": "prd",
    }
