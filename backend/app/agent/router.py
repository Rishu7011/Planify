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
PROJECT_WORKFLOW_NODE = "project_workflow"
REPORT_GENERATOR_NODE = "report_generator"

# Only these queue items should invoke report_generator.
REPORT_WORKFLOWS = {
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


def route_after_conversation_understanding(state: WorkflowState) -> str:
    """Routes to project_workflow for PROJECT messages, END for general chat."""
    routing_decision = state.get("metadata", {}).get("routing_decision")
    if routing_decision == ConversationCategory.PROJECT.value:
        return PROJECT_WORKFLOW_NODE
    return END


def route_after_project_workflow(state: WorkflowState) -> str:
    """Routes to report_generator only for real report workflow names.

    Non-report queue items (PROJECT_INITIALIZATION, CLARIFICATION, etc.)
    must never invoke the report generator.

    Explicit REPORT_REQUEST always proceeds when a real report is queued
    (project_workflow guards ensure discovery is complete enough).
    """
    metadata = state.get("metadata", {})
    next_workflows = metadata.get("next_workflows", [])
    discovery_complete = metadata.get("discovery_complete", False)
    project_action = metadata.get("project_action")
    # Fallback: if context already satisfies discovery, allow reports.
    project_context = state.get("project_context") or {}
    if project_context.get("discovery_complete"):
        discovery_complete = True

    for workflow in next_workflows:
        if not workflow or workflow == "NO_ACTION":
            continue
        if workflow not in REPORT_WORKFLOWS:
            print(
                f"[router] Ignoring non-report workflow '{workflow}' "
                "(not routed to report_generator)."
            )
            continue
        if not discovery_complete and project_action != "REPORT_REQUEST":
            print(
                f"[router] Safeguard: Blocked report generation for {workflow} "
                "because discovery is incomplete."
            )
            continue
        return REPORT_GENERATOR_NODE

    return END
