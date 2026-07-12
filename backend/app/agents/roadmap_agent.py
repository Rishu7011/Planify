"""
Roadmap Agent.

Generates a phase-by-phase project roadmap with milestones,
durations, deliverables, and critical path.
"""
from __future__ import annotations

import json
import logging
from typing import Any, Dict

from langchain_core.prompts import ChatPromptTemplate

from app.agents.llm import get_llm
from app.schemas.agents import RoadmapOutput
from app.schemas.context import ProjectContext

logger = logging.getLogger(__name__)

_PROMPT = ChatPromptTemplate.from_template(
    """You are a product strategist and engineering manager.

Create a realistic, prioritized project roadmap:

MVP Definition: {mvp}
Functional Requirements: {features}
Budget: {budget}
Timeline: {timeline}
Complexity: {complexity}

Return ONLY a valid JSON object — no markdown fences:
{{
  "phases": [
    {{
      "phase_name": "Phase 1: Foundation",
      "description": "Brief description of this phase's goal",
      "duration_weeks": 6,
      "milestones": [
        "Week 2: Auth + DB schema complete",
        "Week 4: Core API endpoints working",
        "Week 6: Internal demo ready"
      ],
      "deliverables": [
        "Working authentication system",
        "Database schema + seed data",
        "API documentation"
      ]
    }}
  ],
  "total_timeline_weeks": 24,
  "critical_path": "The sequence of tasks that determines minimum project duration",
  "priority_rationale": "Why this order was chosen (risk mitigation, dependencies, etc.)"
}}

Rules:
- 3-5 phases maximum
- Each phase builds on the previous (no circular dependencies)
- Phase 1 = Foundation + MVP-critical infrastructure
- Phase 2 = Core product (what users actually use)
- Phase 3+ = Enhancements, scaling, nice-to-haves
- Milestones must be specific and checkable (not vague like "work on feature X")
- Be realistic — include buffer weeks for testing and fixes
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


async def roadmap_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    """LangGraph node: generate prioritized project roadmap with milestones."""
    existing_outputs = state.get("agent_outputs") or {}

    if "prd" not in existing_outputs or "roi" not in existing_outputs:
        logger.warning("[roadmap_agent] Missing PRD or ROI outputs — skipping")
        return {}

    llm = get_llm()
    prd = existing_outputs["prd"]
    feasibility = existing_outputs["feasibility"] if "feasibility" in existing_outputs else {}

    raw_context = state.get("project_context")
    if isinstance(raw_context, dict):
        context = ProjectContext(**raw_context)
    elif raw_context is not None:
        context = raw_context
    else:
        context = ProjectContext()

    constraints = context.constraints
    if hasattr(constraints, "budget"):
        budget = constraints.budget or "Not specified"
        timeline = constraints.timeline or "Not specified"
    elif isinstance(constraints, dict):
        budget = constraints.get("budget") or "Not specified"
        timeline = constraints.get("timeline") or "Not specified"
    else:
        budget = timeline = "Not specified"

    features = "\n".join(f"- {r}" for r in prd.get("functional_requirements", []))

    messages = _PROMPT.format_messages(
        mvp=prd.get("mvp_definition", "Not defined"),
        features=features or "See PRD",
        budget=budget,
        timeline=timeline,
        complexity=feasibility.get("complexity_signal", "medium"),
    )

    logger.info("[roadmap_agent] Generating project roadmap for project %s", state.get("project_id"))
    response = await llm.ainvoke(messages)

    try:
        content = _strip_fences(response.content)
        data = json.loads(content)
        output = RoadmapOutput(**data)
    except Exception as exc:
        logger.error("[roadmap_agent] Parse failed: %s", exc)
        raise ValueError(f"Roadmap parse failed: {exc}") from exc

    existing_executed = state.get("agents_executed") or []

    return {
        "agent_outputs": {**existing_outputs, "roadmap": output.model_dump()},
        "agents_executed": [*existing_executed, "roadmap_agent"],
        "current_agent": "roadmap",
    }
