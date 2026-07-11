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
from app.agents.state import WorkflowState
from app.schemas.agents import RoadmapOutput

logger = logging.getLogger(__name__)

_PROMPT = ChatPromptTemplate.from_template(
    """You are a product strategist and engineering manager.

Create a realistic, prioritized project roadmap:

MVP Definition: {mvp}
Functional Requirements: {features}
Budget: {budget}
Timeline: {timeline}
Complexity: {complexity}

Return ONLY a valid JSON object:
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


async def roadmap_agent(state: WorkflowState) -> Dict[str, Any]:
    """LangGraph node: generate prioritized project roadmap with milestones."""
    if "prd" not in state.agent_outputs or "roi" not in state.agent_outputs:
        logger.warning("[roadmap_agent] Missing PRD or ROI — skipping")
        return {}

    llm = get_llm()
    prd = state.agent_outputs["prd"]
    feasibility = state.agent_outputs["feasibility"]
    context = state.project_context
    constraints = context.constraints

    features = "\n".join(f"- {r}" for r in prd.get("functional_requirements", []))

    messages = _PROMPT.format_messages(
        mvp=prd.get("mvp_definition", "Not defined"),
        features=features or "See PRD",
        budget=constraints.budget or "Not specified",
        timeline=constraints.timeline or "Not specified",
        complexity=feasibility.get("complexity_signal", "medium"),
    )

    logger.info("[roadmap_agent] Generating project roadmap")
    response = await llm.ainvoke(messages)

    try:
        content = response.content.strip().lstrip("```json").rstrip("```").strip()
        data = json.loads(content)
        output = RoadmapOutput(**data)
    except Exception as exc:
        logger.error("[roadmap_agent] Parse failed: %s", exc)
        raise ValueError(f"Roadmap parse failed: {exc}") from exc

    return {
        "agent_outputs": {**state.agent_outputs, "roadmap": output.model_dump()},
        "agents_executed": [*state.agents_executed, "roadmap_agent"],
        "current_agent": "roadmap",
    }
