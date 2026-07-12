"""
Chat Service.

Orchestrates the LangGraph workflow:
1. Load chat history from MongoDB
2. Build initial WorkflowState dict
3. Create ai_workflow_run record
4. Stream the graph, yielding SSE chunks
5. Persist agent_outputs + update workflow run on completion

SSE event types emitted:
    data: {"type": "agent_start",       "agent": "prd_agent"}
    data: {"type": "agent_complete",    "agent": "prd_agent"}
    data: {"type": "clarification",     "questions": [...]}
    data: {"type": "workflow_complete", "status": "completed", "reports": [...], "run_id": "..."}
    data: {"type": "error",             "message": "..."}
"""
from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from typing import AsyncGenerator

from bson import ObjectId

from app.agents.workflow import get_graph
from app.db.mongodb import get_database
from app.schemas.context import Constraint, ProjectContext

logger = logging.getLogger(__name__)

UTC = timezone.utc
MAX_HISTORY = 15  # Last N messages included in context


async def run_workflow_and_stream(
    project_id: str,
    message_id: str,
    project_doc: dict,
) -> AsyncGenerator[str, None]:
    """
    Execute the LangGraph workflow and yield SSE data strings.
    Persists all outputs to MongoDB when done.
    """
    db = get_database()

    # ── Load recent chat history ───────────────────────────────────────────────
    chat_messages = (
        await db.chat_messages.find({"project_id": ObjectId(project_id)})
        .sort("created_at", 1)
        .to_list(None)
    )
    history = [
        {"role": m["role"], "content": m["content"]}
        for m in chat_messages[-MAX_HISTORY:]
    ]
    raw_user_message = chat_messages[-1]["content"] if chat_messages else ""

    # ── Build ProjectContext from stored doc ───────────────────────────────────
    ctx_doc = project_doc.get("context_object") or {}
    constraint_doc = ctx_doc.get("constraints") or {}
    context = ProjectContext(
        domain=ctx_doc.get("domain"),
        problem_statement=ctx_doc.get("problem_statement"),
        target_audience=ctx_doc.get("target_audience"),
        known_facts=ctx_doc.get("known_facts", []),
        constraints=Constraint(**constraint_doc),
        ambiguity_flags=ctx_doc.get("ambiguity_flags", []),
        context_version=ctx_doc.get("context_version", 1),
        stale_agents=ctx_doc.get("stale_agents", []),
    )

    # ── Build initial state dict (TypedDict style) ─────────────────────────────
    initial_state: dict = {
        "project_id": project_id,
        "raw_user_message": raw_user_message,
        "chat_history": history,
        "project_context": context,
        "uploaded_file_summaries": [],
        "current_agent": None,
        "agents_executed": [],
        "agent_outputs": {},
        "routing_decision": None,
        "status": "running",
        "error_message": None,
        "total_input_tokens": 0,
        "total_output_tokens": 0,
    }

    # ── Create workflow run record ─────────────────────────────────────────────
    run_doc = {
        "project_id": ObjectId(project_id),
        "triggered_by_message_id": ObjectId(message_id),
        "status": "running",
        "agents_executed": [],
        "token_usage": {"input_tokens": 0, "output_tokens": 0, "total_tokens": 0},
        "duration_ms": 0,
        "created_at": datetime.now(UTC),
        "updated_at": datetime.now(UTC),
    }
    run_result = await db.ai_workflow_runs.insert_one(run_doc)
    run_id = run_result.inserted_id

    started_at = datetime.now(UTC)

    try:
        # ── Stream graph execution ─────────────────────────────────────────────
        # We accumulate state across all node outputs.
        # Each chunk from astream is: {node_name: partial_state_dict}
        # LangGraph has already merged these into the running state,
        # but we track them ourselves too for SSE events and final persistence.
        accumulated_agent_outputs: dict = {}
        accumulated_agents_executed: list = []
        announced_agents: set = set()
        final_status = "completed"
        final_routing_decision = None
        final_project_context = context

        graph = get_graph()
        config = {"configurable": {"thread_id": str(project_id)}}

        async for chunk in graph.astream(initial_state, config=config):
            # chunk: {node_name: state_update_dict}
            for node_name, state_update in chunk.items():
                if not isinstance(state_update, dict):
                    continue

                # Announce agent start (first time we see a node)
                if node_name not in announced_agents:
                    announced_agents.add(node_name)
                    yield _sse({"type": "agent_start", "agent": node_name})

                # Merge agent_outputs (the key cross-node accumulation)
                if "agent_outputs" in state_update:
                    accumulated_agent_outputs.update(state_update["agent_outputs"])

                # Merge agents_executed list
                if "agents_executed" in state_update:
                    for a in state_update["agents_executed"]:
                        if a not in accumulated_agents_executed:
                            accumulated_agents_executed.append(a)

                # Track routing and status
                if "routing_decision" in state_update:
                    final_routing_decision = state_update["routing_decision"]

                if "status" in state_update:
                    final_status = state_update["status"]

                # Track latest project context
                if "project_context" in state_update and state_update["project_context"] is not None:
                    final_project_context = state_update["project_context"]

                # Announce clarification pause
                if (
                    state_update.get("routing_decision") == "awaiting_input"
                    or state_update.get("status") == "awaiting_input"
                ):
                    questions = (
                        state_update.get("agent_outputs", {})
                        .get("clarification", {})
                        .get("clarification_questions", [])
                    )
                    # Also check accumulated
                    if not questions:
                        questions = (
                            accumulated_agent_outputs
                            .get("clarification", {})
                            .get("clarification_questions", [])
                        )
                    yield _sse({"type": "clarification", "questions": questions})

                # Announce agent completion for new agent outputs
                for agent_key in state_update.get("agent_outputs", {}):
                    if agent_key not in announced_agents:
                        announced_agents.add(agent_key)
                        yield _sse({"type": "agent_complete", "agent": agent_key})

        # ── Persist outputs ────────────────────────────────────────────────────
        report_agents = ["prd", "feasibility", "roi", "roadmap"]

        # Save each agent output to agent_outputs collection
        for agent_name, output in accumulated_agent_outputs.items():
            await db.agent_outputs.insert_one(
                {
                    "workflow_run_id": run_id,
                    "agent_name": agent_name,
                    "input_assumptions": {},
                    "output_payload": output,
                    "created_at": datetime.now(UTC),
                }
            )

        # Upsert reports into generated_reports + report_versions
        completed_reports = []
        for report_type in report_agents:
            if report_type in accumulated_agent_outputs:
                await _upsert_report(
                    db, project_id, report_type, accumulated_agent_outputs[report_type], run_id
                )
                completed_reports.append(report_type)

        # Update project context in MongoDB
        if final_project_context is not None:
            if hasattr(final_project_context, "model_dump"):
                ctx_update = final_project_context.model_dump()
            elif isinstance(final_project_context, dict):
                ctx_update = final_project_context
            else:
                ctx_update = None

            if ctx_update:
                await db.projects.update_one(
                    {"_id": ObjectId(project_id)},
                    {
                        "$set": {
                            "context_object": ctx_update,
                            "updated_at": datetime.now(UTC),
                        }
                    },
                )

        # Update workflow run record
        duration_ms = int((datetime.now(UTC) - started_at).total_seconds() * 1000)
        await db.ai_workflow_runs.update_one(
            {"_id": run_id},
            {
                "$set": {
                    "status": final_status,
                    "agents_executed": accumulated_agents_executed,
                    "duration_ms": duration_ms,
                    "updated_at": datetime.now(UTC),
                }
            },
        )

        # Persist assistant summary message to chat
        summary = _build_summary(accumulated_agent_outputs)
        chat_session = await db.chat_sessions.find_one({"project_id": ObjectId(project_id)})
        if chat_session:
            await db.chat_messages.insert_one(
                {
                    "chat_session_id": chat_session["_id"],
                    "project_id": ObjectId(project_id),
                    "role": "assistant",
                    "content": summary,
                    "message_type": "agent_result",
                    "file_refs": [],
                    "metadata": {
                        "workflow_run_id": str(run_id),
                        "reports_generated": completed_reports,
                    },
                    "created_at": datetime.now(UTC),
                }
            )

        yield _sse(
            {
                "type": "workflow_complete",
                "status": final_status,
                "reports": completed_reports,
                "run_id": str(run_id),
            }
        )

    except Exception as exc:
        logger.exception("[chat_service] Workflow failed for project %s: %s", project_id, exc)
        await db.ai_workflow_runs.update_one(
            {"_id": run_id},
            {
                "$set": {
                    "status": "failed",
                    "error_details": str(exc),
                    "updated_at": datetime.now(UTC),
                }
            },
        )
        yield _sse({"type": "error", "message": str(exc)})


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _sse(payload: dict) -> str:
    """Format a dict as an SSE data line."""
    return f"data: {json.dumps(payload)}\n\n"


async def _upsert_report(db, project_id: str, report_type: str, content: dict, run_id) -> None:
    """Insert or update a generated_reports + report_versions entry."""
    existing = await db.generated_reports.find_one(
        {"project_id": ObjectId(project_id), "report_type": report_type}
    )
    version_number = (existing.get("version_number", 0) + 1) if existing else 1

    version_doc = {
        "project_id": ObjectId(project_id),
        "report_type": report_type,
        "version_number": version_number,
        "content_snapshot": content,
        "change_reason": "Auto-generated by AI workflow",
        "created_by": f"{report_type}_agent_v1",
        "edit_source": "ai",
        "workflow_run_id": run_id,
        "created_at": datetime.now(UTC),
    }
    version_result = await db.report_versions.insert_one(version_doc)

    report_update = {
        "project_id": ObjectId(project_id),
        "report_type": report_type,
        "current_version_id": version_result.inserted_id,
        "version_number": version_number,
        "updated_at": datetime.now(UTC),
    }
    if existing:
        await db.generated_reports.update_one({"_id": existing["_id"]}, {"$set": report_update})
    else:
        await db.generated_reports.insert_one(report_update)


def _build_summary(agent_outputs: dict) -> str:
    """Build a human-readable assistant message summarising what was generated."""
    if "clarification" in agent_outputs:
        clar = agent_outputs["clarification"]
        if not clar.get("sufficient_context", True):
            questions = clar.get("clarification_questions") or []
            q_str = "\n".join(f"{i+1}. {q}" for i, q in enumerate(questions))
            return f"I need a bit more information before I can generate your reports:\n\n{q_str}"

    parts: list[str] = []
    if "prd" in agent_outputs:
        parts.append("✅ **Product Requirements Document** generated")
    if "feasibility" in agent_outputs:
        complexity = agent_outputs["feasibility"].get("complexity_signal", "?")
        parts.append(f"✅ **Feasibility Assessment** complete — complexity: **{complexity}**")
    if "roi" in agent_outputs:
        parts.append("✅ **ROI & Financial Model** generated")
    if "roadmap" in agent_outputs:
        weeks = agent_outputs["roadmap"].get("total_timeline_weeks", "?")
        parts.append(f"✅ **Project Roadmap** created — estimated **{weeks} weeks**")

    if parts:
        return (
            "Your planning reports are ready! Here's a summary:\n\n"
            + "\n".join(parts)
            + "\n\nHead to the **Reports** tab to view the full details."
        )
    return "Processing complete."
