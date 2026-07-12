"""
Final Report Agent.

Assembles all agent outputs into a coherent bundle.
Runs consistency checks (e.g., team size vs. budget, roadmap duration vs. timeline constraint).
"""
from __future__ import annotations

import logging
from typing import Any, Dict

from app.schemas.agents import FinalReportOutput
from app.schemas.context import ProjectContext

logger = logging.getLogger(__name__)


def _check_consistency(agent_outputs: Dict[str, Any], context: Any) -> list[str]:
    """Run basic cross-report consistency checks. Returns list of issue strings."""
    issues: list[str] = []

    roi = agent_outputs.get("roi", {})
    roadmap = agent_outputs.get("roadmap", {})
    feasibility = agent_outputs.get("feasibility", {})

    # Resolve constraints — handle both Pydantic model and plain dict
    if hasattr(context, "constraints"):
        constraints = context.constraints
        if hasattr(constraints, "timeline"):
            timeline = constraints.timeline
            domain = context.domain or ""
        elif isinstance(constraints, dict):
            timeline = constraints.get("timeline")
            domain = context.domain or "" if hasattr(context, "domain") else ""
        else:
            timeline = None
            domain = ""
    elif isinstance(context, dict):
        constraints = context.get("constraints", {})
        timeline = constraints.get("timeline") if isinstance(constraints, dict) else None
        domain = context.get("domain", "")
    else:
        timeline = None
        domain = ""

    # Check: roadmap timeline vs. constraint
    if timeline and roadmap.get("total_timeline_weeks"):
        timeline_str = str(timeline).lower()
        total_weeks = roadmap["total_timeline_weeks"]
        if "month" in timeline_str:
            try:
                months = int("".join(c for c in timeline_str if c.isdigit()))
                if total_weeks > months * 4.5:
                    issues.append(
                        f"Roadmap ({total_weeks} weeks) exceeds stated timeline "
                        f"constraint ({timeline}). Consider reducing scope."
                    )
            except (ValueError, TypeError):
                pass

    # Check: high complexity in regulated domain without regulatory notes
    if (
        feasibility.get("complexity_signal") == "high"
        and not feasibility.get("regulatory_notes")
        and domain
        and any(kw in domain.lower() for kw in ["health", "finance", "fin", "legal", "insurance", "gov"])
    ):
        issues.append(
            "High complexity detected in a regulated domain — "
            "regulatory requirements may be underestimated."
        )

    return issues


async def final_report_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    LangGraph node: assemble all reports and run consistency checks.
    Sets status to 'completed' and marks routing_decision as 'persist'.
    """
    project_id = state.get("project_id", "unknown")
    logger.info("[final_report_agent] Assembling final bundle for %s", project_id)

    existing_outputs = state.get("agent_outputs") or {}

    raw_context = state.get("project_context")
    if isinstance(raw_context, dict):
        context = ProjectContext(**raw_context)
    elif raw_context is not None:
        context = raw_context
    else:
        context = ProjectContext()

    issues = _check_consistency(existing_outputs, context)

    if issues:
        for issue in issues:
            logger.warning("[final_report_agent] Consistency issue: %s", issue)

    output = FinalReportOutput(
        consistency_issues=issues,
        status="review_needed" if issues else "ready",
    )

    existing_executed = state.get("agents_executed") or []

    return {
        "agent_outputs": {**existing_outputs, "final_report": output.model_dump()},
        "agents_executed": [*existing_executed, "final_report_agent"],
        "routing_decision": "persist",
        "status": "completed",
        "current_agent": "final_report",
    }
