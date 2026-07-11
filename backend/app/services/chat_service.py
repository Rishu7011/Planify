"""
Chat Service.

Orchestrates the LangGraph workflow:
1. Load chat history from MongoDB
2. Build WorkflowState
3. Create ai_workflow_run record
4. Stream the graph, yielding SSE chunks
5. Persist agent_outputs + update workflow run on completion
"""
from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from typing import AsyncGenerator

from bson import ObjectId

from app.agents.state import WorkflowState
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

    Yields strings like:
        data: {"type": "agent_start", "agent": "prd_agent"}\n\n
        data: {"type": "clarification", "questions": [...]}\n\n
        data: {"type": "agent_complete", "agent": "prd_agent"}\n\n
        data: {"type": "workflow_complete", "status": "completed"}\n\n
        data: {"type": "error", "message": "..."}\n\n
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
    ctx_doc = project_doc.get("context_object", {})
    constraint_doc = ctx_doc.get("constraints", {}) or {}
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

    initial_state = WorkflowState(
        project_id=project_id,
        raw_user_message=raw_user_message,
        chat_history=history,
        project_context=context,
    )

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
        prev_agents = set()
        final_state: WorkflowState | None = None
        
        graph = get_graph()
        config = {"configurable": {"thread_id": str(project_id)}}

        async for chunk in graph.astream(initial_state, config=config):
            # chunk is a dict of {node_name: state_update}
            for node_name, state_update in chunk.items():
                if node_name not in prev_agents:
                    prev_agents.add(node_name)
                    yield _sse({"type": "agent_start", "agent": node_name})

                # Merge update into a running state representation
                if isinstance(state_update, dict):
                    # Check for clarification pause
                    if (
                        state_update.get("routing_decision") == "awaiting_input"
                        or state_update.get("status") == "awaiting_input"
                    ):
                        questions = (
                            state_update.get("agent_outputs", {})
                            .get("clarification", {})
                            .get("clarification_questions", [])
                        )
                        yield _sse({"type": "clarification", "questions": questions})

                    # Announce agent completion with its output keys
                    outputs = state_update.get("agent_outputs", {})
                    if outputs:
                        for agent_key in outputs:
                            if agent_key not in prev_agents:
                                yield _sse({"type": "agent_complete", "agent": agent_key})

                final_state = state_update  # track latest

        # ── Persist outputs ────────────────────────────────────────────────────
        if final_state and isinstance(final_state, dict):
            agent_outputs = final_state.get("agent_outputs", {})
            workflow_status = final_state.get("status", "completed")
            agents_run = final_state.get("agents_executed", list(prev_agents))
            updated_context = final_state.get("project_context")
        else:
            agent_outputs = {}
            workflow_status = "completed"
            agents_run = list(prev_agents)
            updated_context = None

        # Save each agent output
        for agent_name, output in agent_outputs.items():
            await db.agent_outputs.insert_one(
                {
                    "workflow_run_id": run_id,
                    "agent_name": agent_name,
                    "input_assumptions": {},
                    "output_payload": output,
                    "created_at": datetime.now(UTC),
                }
            )

        # Persist reports to generated_reports + report_versions
        report_agents = ["prd", "feasibility", "roi", "roadmap"]
        for report_type in report_agents:
            if report_type in agent_outputs:
                await _upsert_report(
                    db, project_id, report_type, agent_outputs[report_type], run_id
                )

        # Update project context
        if updated_context:
            ctx = updated_context if isinstance(updated_context, dict) else updated_context.model_dump()
            await db.projects.update_one(
                {"_id": ObjectId(project_id)},
                {
                    "$set": {
                        "context_object": ctx,
                        "updated_at": datetime.now(UTC),
                    }
                },
            )

        # Update workflow run
        duration_ms = int((datetime.now(UTC) - started_at).total_seconds() * 1000)
        await db.ai_workflow_runs.update_one(
            {"_id": run_id},
            {
                "$set": {
                    "status": workflow_status,
                    "agents_executed": agents_run,
                    "duration_ms": duration_ms,
                    "updated_at": datetime.now(UTC),
                }
            },
        )

        # Persist assistant message
        completed_reports = [k for k in agent_outputs if k in report_agents]
        summary = _build_summary(agent_outputs)
        await db.chat_messages.insert_one(
            {
                "chat_session_id": (await db.chat_sessions.find_one({"project_id": ObjectId(project_id)}))["_id"],
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
                "status": workflow_status,
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
    parts: list[str] = []
    if "clarification" in agent_outputs:
        clar = agent_outputs["clarification"]
        if not clar.get("sufficient_context", True):
            questions = clar.get("clarification_questions", [])
            q_str = "\n".join(f"{i+1}. {q}" for i, q in enumerate(questions))
            return f"I need a bit more information before I can generate your reports:\n\n{q_str}"

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
