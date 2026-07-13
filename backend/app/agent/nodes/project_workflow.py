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
4. Apply deterministic guards (discovery_complete, report request, no re-asks).
5. Persist project snapshot + conversation turn to MongoDB Atlas.
6. Return partial state update — LangGraph merges it automatically.

This node NEVER generates PRDs, roadmaps, ROI, market research, or
technical architecture. Those belong to downstream specialist agents.
"""

from __future__ import annotations

import json

from langchain_core.messages import AIMessage, BaseMessage

from app.agent.db import conversation_repo, project_repo
from app.agent.llm import get_structured_llm
from app.agent.prompts import project_workflow_prompt
from app.agent.router import REPORT_WORKFLOWS
from app.agent.schemas import ProjectWorkflowOutput
from app.agent.state import WorkflowState
from app.agent.web_search import gather_web_intel, should_run_web_search
from app.agent.workflow_guards import apply_workflow_guards

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


def _history_text(history: list) -> str:
    parts: list[str] = []
    for msg in history or []:
        if isinstance(msg, BaseMessage):
            parts.append(str(msg.content or ""))
        elif isinstance(msg, dict):
            parts.append(str(msg.get("content") or ""))
        else:
            parts.append(str(msg))
    return "\n".join(parts)


def project_workflow_node(state: WorkflowState) -> dict:
    """Full Project Workflow Agent.

    Reads project_context → invokes LLM → merges context → applies guards →
    persists to MongoDB Atlas → returns state update.
    """
    user_input = state["user_input"]
    history = state.get("conversation_history", [])
    project_context = state.get("project_context") or {}
    session_id = state.get("metadata", {}).get("session_id", "default")

    context_str = (
        json.dumps(project_context, indent=2)
        if project_context
        else "None — no project has been initialized yet."
    )

    # DuckDuckGo only when the user needs fresh market/idea intel — not for "hi".
    if should_run_web_search(user_input, project_context):
        try:
            web_intel = gather_web_intel(
                user_input=user_input,
                project_context=project_context,
                max_queries=1,
            )
        except Exception as search_err:
            print(f"[project_workflow] web search skipped: {search_err}")
            web_intel = "(No web intel gathered.)"
    else:
        web_intel = "(Web search skipped — not needed for this message.)"

    result: ProjectWorkflowOutput = _chain.invoke(
        {
            "user_input": user_input,
            "conversation_history": history,
            "project_context": context_str,
            "web_intel": web_intel,
        }
    )

    patch = result.updated_context.model_dump()
    merged_context = _deep_merge(project_context, patch)

    if result.stale_outputs:
        existing_stale = merged_context.get("stale_outputs") or []
        for item in result.stale_outputs:
            if item not in existing_stale:
                existing_stale.append(item)
        merged_context["stale_outputs"] = existing_stale

    clarification_questions = [
        q.strip() for q in (result.clarification_questions or []) if q and q.strip()
    ][:3]
    if not clarification_questions and result.needs_clarification:
        clarification_questions = [
            q.strip()
            for q in (merged_context.get("missing_information") or [])
            if q and q.strip()
        ][:3]

    guarded = apply_workflow_guards(
        user_input=user_input,
        merged_context=merged_context,
        project_action=result.project_action,
        next_workflows=result.next_workflows,
        needs_clarification=result.needs_clarification,
        clarification_questions=clarification_questions,
        discovery_complete=result.discovery_complete,
        assistant_response=result.assistant_response,
        history_text=_history_text(history),
    )

    merged_context = guarded["merged_context"]
    project_action = guarded["project_action"]
    next_workflows = guarded["next_workflows"]
    needs_clarification = guarded["needs_clarification"]
    clarification_questions = guarded["clarification_questions"]
    discovery_complete = guarded["discovery_complete"]
    assistant_response = guarded["assistant_response"]

    try:
        project_id = project_repo.upsert_by_session(
            session_id=session_id,
            context=merged_context,
            status=project_action.lower(),
        )
        will_route_to_report = any(
            wf in REPORT_WORKFLOWS
            and (discovery_complete or project_action == "REPORT_REQUEST")
            for wf in next_workflows
        )

        if not will_route_to_report:
            conversation_repo.append_turn(
                session_id=session_id,
                user_input=user_input,
                ai_response=assistant_response,
                metadata={
                    "project_action": project_action,
                    "next_workflows": next_workflows,
                    "stale_outputs": result.stale_outputs,
                    "needs_clarification": needs_clarification,
                    "discovery_complete": discovery_complete,
                    "confidence": result.confidence,
                    "requested_report": guarded.get("requested_report"),
                },
            )
        else:
            print(
                "[project_workflow] Deferring database conversation log "
                "to report_generator_node."
            )
    except Exception as db_err:
        print(f"[project_workflow] MongoDB write warning: {db_err}")
        project_id = None

    metadata_update = {
        **state.get("metadata", {}),
        "project_action": project_action,
        "next_workflows": next_workflows,
        "stale_outputs": result.stale_outputs,
        "needs_clarification": needs_clarification,
        "clarification_questions": clarification_questions,
        "discovery_complete": discovery_complete,
        "workflow_confidence": result.confidence,
        "workflow_reasoning": result.reasoning_summary,
        "project_id": project_id,
        "requested_report": guarded.get("requested_report"),
    }

    return {
        "conversation_history": [AIMessage(content=assistant_response)],
        "project_context": merged_context,
        "metadata": metadata_update,
    }
