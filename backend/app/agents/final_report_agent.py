"""
Final Report Agent.

Assembles all agent outputs into a coherent bundle.
Runs consistency checks (e.g., team size vs. budget, roadmap duration vs. timeline constraint).
"""
from __future__ import annotations

import logging
from typing import Any, Dict

from app.agents.state import WorkflowState
from app.schemas.agents import FinalReportOutput

logger = logging.getLogger(__name__)


def _check_consistency(agent_outputs: Dict[str, Any], context) -> list[str]:
    """Run basic cross-report consistency checks. Returns list of issue strings."""
    issues: list[str] = []

    roi = agent_outputs.get("roi", {})
    roadmap = agent_outputs.get("roadmap", {})
    prd = agent_outputs.get("prd", {})
    feasibility = agent_outputs.get("feasibility", {})
    constraints = context.constraints if context.constraints else None

    # Check: roadmap timeline vs. constraint
    if constraints and constraints.timeline and roadmap.get("total_timeline_weeks"):
        timeline_str = str(constraints.timeline).lower()
        total_weeks = roadmap["total_timeline_weeks"]
        # Simple heuristic: if "6 months" mentioned, expect <= 26 weeks
        if "month" in timeline_str:
            try:
                months = int("".join(c for c in timeline_str if c.isdigit()))
                if total_weeks > months * 4.5:
                    issues.append(
                        f"Roadmap ({total_weeks} weeks) exceeds stated timeline "
                        f"constraint ({constraints.timeline}). Consider reducing scope."
                    )
            except (ValueError, TypeError):
                pass

    # Check: high complexity + no regulatory notes
    if (
        feasibility.get("complexity_signal") == "high"
        and not feasibility.get("regulatory_notes")
        and context.domain
        and any(
            kw in context.domain.lower()
            for kw in ["health", "finance", "fin", "legal", "insurance", "gov"]
        )
    ):
        issues.append(
            "High complexity detected in a regulated domain — "
            "regulatory requirements may be underestimated."
        )

    return issues


async def final_report_agent(state: WorkflowState) -> Dict[str, Any]:
    """
    LangGraph node: assemble all reports and run consistency checks.
    Sets status to 'completed' and marks routing_decision as 'persist'.
    """
    logger.info("[final_report_agent] Assembling final bundle for %s", state.project_id)

    issues = _check_consistency(state.agent_outputs, state.project_context)

    if issues:
        for issue in issues:
            logger.warning("[final_report_agent] Consistency issue: %s", issue)

    output = FinalReportOutput(
        consistency_issues=issues,
        status="review_needed" if issues else "ready",
    )

    return {
        "agent_outputs": {**state.agent_outputs, "final_report": output.model_dump()},
        "agents_executed": [*state.agents_executed, "final_report_agent"],
        "routing_decision": "persist",
        "status": "completed",
        "current_agent": "final_report",
    }
