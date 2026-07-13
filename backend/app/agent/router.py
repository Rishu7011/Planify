"""
router.py
---------
Conditional-edge routing functions. Kept separate from node logic so
routing decisions are easy to test in isolation.
"""

from __future__ import annotations

from langgraph.graph import END

from app.agent.schemas import ConversationCategory
from app.agent.state import WorkflowState

# ── node name constants ───────────────────────────────────────────────────────
PROJECT_WORKFLOW_NODE   = "project_workflow"
REPORT_GENERATOR_NODE   = "report_generator"


def route_after_conversation_understanding(state: WorkflowState) -> str:
    """Routes to project_workflow for PROJECT messages, END for general chat."""
    routing_decision = state.get("metadata", {}).get("routing_decision")
    if routing_decision == ConversationCategory.PROJECT.value:
        return PROJECT_WORKFLOW_NODE
    return END


def route_after_project_workflow(state: WorkflowState) -> str:
    """Routes based entirely on what the LLM decided in next_workflows.

    Safeguard: If project discovery is incomplete (discovery_complete is False)
    and the user has not explicitly requested a report (project_action is not
    REPORT_REQUEST), we do not allow routing to report_generator.
    """
    metadata = state.get("metadata", {})
    next_workflows = metadata.get("next_workflows", [])
    discovery_complete = metadata.get("discovery_complete", False)
    project_action = metadata.get("project_action")

    # Set of workflows that generate reports
    report_workflows = {
        "PRD",
        "TECHNICAL_ARCHITECTURE",
        "MARKET_RESEARCH",
        "COMPETITOR_ANALYSIS",
        "ROI",
        "HR_PLANNING",
        "RISK_ANALYSIS",
        "ROADMAP",
        "FINAL_REPORT",
    }

    # Route to report_generator for any meaningful workflow the LLM chose.
    for workflow in next_workflows:
        if workflow and workflow != "NO_ACTION":
            # If discovery is not complete and this is a report workflow,
            # only allow it if the user explicitly requested it.
            if workflow in report_workflows:
                if not discovery_complete and project_action != "REPORT_REQUEST":
                    print(f"[router] Safeguard: Blocked report generation for {workflow} because discovery is incomplete.")
                    continue
            return REPORT_GENERATOR_NODE

    return END