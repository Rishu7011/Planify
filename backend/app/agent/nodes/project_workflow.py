"""
nodes/project_workflow.py
--------------------------
The Project Workflow Agent node — intelligent coordinator for all project
messages routed from the Conversation Understanding node.

Responsibilities
----------------
1. Read the existing project_context (single source of truth).
2. Invoke the structured-LLM chain to:
   - Classify project_action (NEW_PROJECT / CONTINUE_PROJECT / UPDATE_PROJECT /
     PROJECT_QUERY / REPORT_REQUEST / FILE_ANALYSIS / CLARIFICATION)
   - Extract / accumulate all project fields from the full conversation
   - Answer PROJECT_QUERY turns directly from context (no re-initialization)
   - Detect stale outputs when assumptions change
   - Select downstream next_workflows
   - Compose the assistant_response shown to the user
3. Deep-merge updated_context into state["project_context"] (additive, never lossy).
4. Persist project snapshot + conversation turn to MongoDB Atlas.
5. Return partial state update — LangGraph merges it automatically.

This node NEVER generates PRDs, roadmaps, ROI, market research, or
technical architecture. Those belong to downstream specialist agents.
"""

from __future__ import annotations

import json

from langchain_core.messages import AIMessage

from app.agent.db import conversation_repo, project_repo
from app.agent.llm import get_structured_llm
from app.agent.prompts import project_workflow_prompt
from app.agent.schemas import ProjectWorkflowOutput
from app.agent.state import WorkflowState

# ── build the structured-output chain once at import time ────────────────────
_chain = (
    project_workflow_prompt
    | get_structured_llm(ProjectWorkflowOutput)
)

# Fields that are lists — merged additively (union, deduped).
_LIST_FIELDS = {
    "goals", "technology_stack", "constraints", "assumptions",
    "uploaded_documents", "reports", "missing_information", "stale_outputs",
}


def _deep_merge(existing: dict, patch: dict) -> dict:
    """Merge the LLM's extracted context patch into the existing context dict.

    Rules
    -----
    - Scalar (str | None): overwrite only when the new value is non-None.
    - List fields:          union — keep existing order, append new unique items.
    - Existing keys not in patch are left unchanged (never discarded).
    """
    merged = dict(existing)
    for key, new_val in patch.items():
        if key in _LIST_FIELDS:
            old_list = merged.get(key) or []
            combined = list(old_list)
            for item in (new_val or []):
                if item and item not in combined:
                    combined.append(item)
            merged[key] = combined
        else:
            if new_val is not None:
                merged[key] = new_val
    return merged


def project_workflow_node(state: WorkflowState) -> dict:
    """Full Project Workflow Agent.

    Reads project_context → invokes LLM → merges context → persists to
    MongoDB Atlas → returns state update.
    """
    user_input      = state["user_input"]
    history         = state.get("conversation_history", [])
    project_context = state.get("project_context") or {}
    session_id      = state.get("metadata", {}).get("session_id", "default")

    # Serialize existing context as readable JSON for the prompt.
    context_str = (
        json.dumps(project_context, indent=2)
        if project_context
        else "None — no project has been initialized yet."
    )

    # ── invoke the LLM chain ─────────────────────────────────────────────────
    result: ProjectWorkflowOutput = _chain.invoke(
        {
            "user_input":           user_input,
            "conversation_history": history,
            "project_context":      context_str,
        }
    )

    # ── merge context (additive, never lossy) ────────────────────────────────
    patch         = result.updated_context.model_dump()
    merged_context = _deep_merge(project_context, patch)

    # Propagate stale_outputs from this turn into the accumulated context.
    if result.stale_outputs:
        existing_stale = merged_context.get("stale_outputs") or []
        for item in result.stale_outputs:
            if item not in existing_stale:
                existing_stale.append(item)
        merged_context["stale_outputs"] = existing_stale

    # ── persist to MongoDB Atlas ─────────────────────────────────────────────
    try:
        project_id = project_repo.upsert_by_session(
            session_id=session_id,
            context=merged_context,
            status=result.project_action.value.lower(),
        )
        # Check if we are routing to report_generator next.
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
        will_route_to_report = False
        for wf in result.next_workflows:
            if wf and wf.value != "NO_ACTION" and wf.value in report_workflows:
                if result.discovery_complete or result.project_action.value == "REPORT_REQUEST":
                    will_route_to_report = True
                    break

        if not will_route_to_report:
            conversation_repo.append_turn(
                session_id=session_id,
                user_input=user_input,
                ai_response=result.assistant_response,
                metadata={
                    "project_action":    result.project_action.value,
                    "next_workflows":    [w.value for w in result.next_workflows],
                    "stale_outputs":     result.stale_outputs,
                    "needs_clarification": result.needs_clarification,
                    "discovery_complete": result.discovery_complete,
                    "confidence":        result.confidence,
                },
            )
        else:
            print("[project_workflow] Deferring database conversation log to report_generator_node.")
    except Exception as db_err:
        # DB errors must never crash the graph.
        print(f"[project_workflow] MongoDB write warning: {db_err}")
        project_id = None

    # ── build metadata update ────────────────────────────────────────────────
    metadata_update = {
        **state.get("metadata", {}),
        "project_action":      result.project_action.value,
        "next_workflows":      [w.value for w in result.next_workflows],
        "stale_outputs":       result.stale_outputs,
        "needs_clarification": result.needs_clarification,
        "discovery_complete":  result.discovery_complete,
        "workflow_confidence": result.confidence,
        "workflow_reasoning":  result.reasoning_summary,
        "project_id":          project_id,
    }

    return {
        "conversation_history": [AIMessage(content=result.assistant_response)],
        "project_context":      merged_context,
        "metadata":             metadata_update,
    }