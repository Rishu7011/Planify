"""
Chat service — orchestrates the LangGraph agent workflow for API requests.

Streams Server-Sent Events to the frontend and persists messages, context,
and generated reports to MongoDB.
"""

from __future__ import annotations

import asyncio
import json
import logging
import re
from datetime import datetime, timezone
from typing import Any, AsyncGenerator

from starlette.requests import Request

from bson import ObjectId
from langchain_core.messages import AIMessage, HumanMessage
from pymongo.errors import DuplicateKeyError

from app.agent.graph import app as workflow_graph
from app.agent.state import build_initial_state
from app.db.mongodb import get_database
from app.services.file_service import format_files_for_prompt
from app.utils.objectid import parse_object_id

logger = logging.getLogger(__name__)
UTC = timezone.utc
MAX_HISTORY = 20

# Serialize concurrent streams per project (shared LangGraph thread_id).
_project_locks: dict[str, asyncio.Lock] = {}


def _lock_for_project(project_id: str) -> asyncio.Lock:
    lock = _project_locks.get(project_id)
    if lock is None:
        lock = asyncio.Lock()
        _project_locks[project_id] = lock
    return lock

AGENT_TO_API_REPORT: dict[str, str] = {
    "PRD": "prd",
    "TECHNICAL_ARCHITECTURE": "technical_architecture",
    "MARKET_RESEARCH": "market_research",
    "COMPETITOR_ANALYSIS": "competitor_analysis",
    "ROI": "roi",
    "HR_PLANNING": "hr_planning",
    "RISK_ANALYSIS": "risk_analysis",
    "ROADMAP": "roadmap",
    "FINAL_REPORT": "final_report",
}

NODE_AGENT_LABELS: dict[str, str] = {
    "conversation_understanding": "conversation_understanding",
    "project_workflow": "project_workflow",
    "report_generator": "report_generator",
}

# LangGraph node names → frontend workspace agent keys (see frontend/agents.ts)
REPORT_TYPE_TO_FRONTEND_AGENT: dict[str, str] = {
    "PRD": "prd",
    "TECHNICAL_ARCHITECTURE": "technical_architecture",
    "MARKET_RESEARCH": "market_research",
    "COMPETITOR_ANALYSIS": "competitor_analysis",
    "ROI": "roi",
    "HR_PLANNING": "hr_planning",
    "RISK_ANALYSIS": "risk_analysis",
    "ROADMAP": "roadmap",
    "FINAL_REPORT": "final_report",
}


def _frontend_agent_for_node(
    node_name: str,
    metadata: dict[str, Any],
    state_update: dict[str, Any],
) -> str:
    """Map LangGraph node output to the agent key the frontend UI understands."""
    merged = {**metadata, **(state_update.get("metadata") or {})}

    if node_name == "conversation_understanding":
        return "input_understanding"

    if node_name == "project_workflow":
        if merged.get("needs_clarification"):
            return "clarification"
        if merged.get("project_action") == "REPORT_REQUEST":
            return "quality_validation"
        return "input_understanding"

    if node_name == "report_generator":
        report_type = merged.get("last_generated_report")
        if report_type:
            return REPORT_TYPE_TO_FRONTEND_AGENT.get(report_type, report_type.lower())
        return "final_report"

    return NODE_AGENT_LABELS.get(node_name, node_name)


def _sse(payload: dict[str, Any]) -> str:
    return f"data: {json.dumps(payload)}\n\n"


def _messages_to_history(docs: list[dict]) -> list:
    history = []
    for doc in docs[:-1]:
        if doc["role"] == "user":
            history.append(HumanMessage(content=doc["content"]))
        elif doc["role"] == "assistant":
            history.append(AIMessage(content=doc["content"]))
    return history


def _extract_ai_content(state_update: dict) -> str | None:
    for msg in state_update.get("conversation_history", []):
        if isinstance(msg, AIMessage):
            return msg.content
        if isinstance(msg, dict) and msg.get("type") == "ai":
            return msg.get("content")
    return None


# Field-name fallbacks used when the LLM puts labels in missing_information
# instead of real questions / multiple-choice options.
_FIELD_QUESTIONS: dict[str, str] = {
    "budget": "What budget range are you targeting for this project?",
    "timeline": "What timeline are you aiming for (MVP and launch)?",
    "technology stack": "Any preferred technology stack or platform constraints?",
    "technology_stack": "Any preferred technology stack or platform constraints?",
    "target users": "Who are the primary users of this product?",
    "target_users": "Who are the primary users of this product?",
    "problem statement": "What specific problem does this product solve?",
    "problem_statement": "What specific problem does this product solve?",
    "goals": "What are the top goals or success metrics for the first release?",
    "features": "Which core features matter most for the MVP?",
}

_FIELD_OPTIONS: dict[str, list[str]] = {
    "budget": [
        "Under $10k — bootstrap / MVP",
        "$10k–$50k — small funded build",
        "$50k–$200k — serious product team",
        "Not sure yet — help me estimate",
    ],
    "timeline": [
        "4–8 weeks for an MVP",
        "3–6 months",
        "6–12 months",
        "Flexible — prioritize quality",
    ],
    "technology stack": [
        "Mobile-first (iOS / Android / React Native / Flutter)",
        "Web app (React / Next.js)",
        "No strong preference — recommend a stack",
        "Reuse existing in-house stack",
    ],
    "technology_stack": [
        "Mobile-first (iOS / Android / React Native / Flutter)",
        "Web app (React / Next.js)",
        "No strong preference — recommend a stack",
        "Reuse existing in-house stack",
    ],
    "target users": [
        "Retail / consumer crypto users",
        "Day traders / power users",
        "Businesses / institutions",
        "Still exploring — help me define them",
    ],
    "target_users": [
        "Retail / consumer crypto users",
        "Day traders / power users",
        "Businesses / institutions",
        "Still exploring — help me define them",
    ],
    "problem statement": [
        "Fragmented tools — charts and trading are split",
        "High fees / opaque commissions",
        "Hard for beginners to get started",
        "Still refining the problem",
    ],
    "problem_statement": [
        "Fragmented tools — charts and trading are split",
        "High fees / opaque commissions",
        "Hard for beginners to get started",
        "Still refining the problem",
    ],
}


def _normalize_field_key(text: str) -> str:
    return re.sub(r"[\s_]+", " ", (text or "").strip().lower())


def _looks_like_field_label(text: str) -> bool:
    """True for short labels like 'Budget' rather than real questions."""
    cleaned = (text or "").strip()
    if not cleaned or "?" in cleaned:
        return False
    words = cleaned.split()
    return len(words) <= 4 and len(cleaned) <= 40


def _question_from_label(label: str) -> str:
    key = _normalize_field_key(label)
    return _FIELD_QUESTIONS.get(key, f"Can you share more about your {label.strip()}?")


def _default_discovery_options(question: str) -> list[str]:
    key = _normalize_field_key(question)
    # Match by known field keys contained in the question text
    for field_key, options in _FIELD_OPTIONS.items():
        if field_key in key or key in field_key:
            return list(options)
    return [
        "Early-stage idea — still exploring",
        "Have a clear problem to solve",
        "Ready to define MVP scope",
        "Need help prioritizing features",
    ]


def _extract_clarification_questions(
    assistant_content: str | None,
    project_context: dict[str, Any],
    *,
    needs_clarification: bool,
    metadata: dict[str, Any] | None = None,
) -> list[str]:
    """Derive discovery/clarification questions for the frontend options panel.

    Prefer real LLM clarification_questions. Never treat raw field labels
    (Budget / Timeline) as multiple-choice answer options.
    """
    if not needs_clarification:
        return []

    meta = metadata or {}
    from_llm = [
        q.strip()
        for q in (meta.get("clarification_questions") or [])
        if q and str(q).strip()
    ]
    if from_llm:
        return [
            _question_from_label(q) if _looks_like_field_label(q) else q
            for q in from_llm[:3]
        ]

    if assistant_content:
        numbered = re.findall(
            r"^\s*\d+[\.\)]\s+(.+\?)\s*$", assistant_content, re.MULTILINE
        )
        if numbered:
            return [q.strip() for q in numbered[:3]]

        bullet_lines = [
            ln.strip("•- ").strip()
            for ln in assistant_content.split("\n")
            if ln.strip().startswith(("•", "-")) and "?" in ln
        ]
        if bullet_lines:
            return bullet_lines[:3]

        sentences = re.findall(r"[^?\n]{10,}\?", assistant_content)
        if sentences:
            return [s.strip() for s in sentences[:3]]

    missing = [
        q.strip()
        for q in (project_context.get("missing_information") or [])
        if q and str(q).strip()
    ]
    if missing:
        return [_question_from_label(q) for q in missing[:3]]

    return []


def _discovery_options_for_question(
    question: str,
    remaining_questions: list[str],
) -> list[str]:
    """Build selectable answers for a discovery question.

    Remaining clarification items are other *questions*, not answer options —
    never dump them into the options list.
    """
    options = _default_discovery_options(question)
    if remaining_questions and all(_looks_like_field_label(q) for q in remaining_questions):
        # Field labels are not options; keep the curated defaults.
        return options
    return options


async def _persist_project_context(db, project_id: str, context: dict[str, Any]) -> None:
    await db.projects.update_one(
        {"_id": parse_object_id(project_id, field="project_id")},
        {"$set": {"context_object": context, "updated_at": datetime.now(UTC)}},
    )


def _build_report_content(report_type: str, markdown: str) -> dict[str, Any]:
    excerpt = markdown[:500] + ("…" if len(markdown) > 500 else "")
    return {
        "format": "markdown",
        "markdown": markdown,
        "overview": {"title": report_type.replace("_", " ").title(), "content": excerpt},
    }


async def _upsert_report(
    db,
    project_id: str,
    report_type: str,
    content: dict[str, Any],
    run_id: ObjectId,
) -> None:
    project_oid = parse_object_id(project_id, field="project_id")
    now = datetime.now(UTC)

    for _attempt in range(2):
        existing = await db.generated_reports.find_one(
            {"project_id": project_oid, "report_type": report_type}
        )
        version_number = (existing.get("version_number", 0) + 1) if existing else 1

        version_doc = {
            "project_id": project_oid,
            "report_type": report_type,
            "version_number": version_number,
            "content_snapshot": content,
            "change_reason": "Auto-generated by AI workflow",
            "created_by": "report_generator",
            "edit_source": "ai",
            "workflow_run_id": run_id,
            "created_at": now,
        }
        version_result = await db.report_versions.insert_one(version_doc)

        report_update = {
            "project_id": project_oid,
            "report_type": report_type,
            "current_version_id": version_result.inserted_id,
            "version_number": version_number,
            "updated_at": now,
        }
        try:
            if existing:
                await db.generated_reports.update_one(
                    {"_id": existing["_id"]},
                    {"$set": report_update},
                )
            else:
                report_update["created_at"] = now
                await db.generated_reports.insert_one(report_update)
            return
        except DuplicateKeyError:
            # Concurrent first insert — retry as update
            logger.warning(
                "[chat_service] Duplicate report race for %s/%s; retrying",
                project_id,
                report_type,
            )
            continue

    logger.error(
        "[chat_service] Failed to upsert report %s for project %s after retry",
        report_type,
        project_id,
    )


async def _emit_content_deltas(
    text: str,
    *,
    already_streamed: int,
    chunk_size: int = 24,
) -> AsyncGenerator[tuple[str, int], None]:
    """Yield SSE payloads for newly available assistant text, then the new offset."""
    if len(text) <= already_streamed:
        return

    remainder = text[already_streamed:]
    for i in range(0, len(remainder), chunk_size):
        delta = remainder[i : i + chunk_size]
        already_streamed += len(delta)
        yield _sse({"type": "content_delta", "delta": delta}), already_streamed
        await asyncio.sleep(0)


async def run_workflow_and_stream(
    project_id: str,
    message_id: str,
    project_doc: dict,
    *,
    request: Request | None = None,
    attached_files: list[dict[str, Any]] | None = None,
) -> AsyncGenerator[str, None]:
    async with _lock_for_project(project_id):
        async for event in _run_workflow_and_stream_locked(
            project_id=project_id,
            message_id=message_id,
            project_doc=project_doc,
            request=request,
            attached_files=attached_files or [],
        ):
            yield event


async def _run_workflow_and_stream_locked(
    project_id: str,
    message_id: str,
    project_doc: dict,
    *,
    request: Request | None = None,
    attached_files: list[dict[str, Any]] | None = None,
) -> AsyncGenerator[str, None]:
    db = get_database()
    project_oid = parse_object_id(project_id, field="project_id")
    attached_files = attached_files or []

    chat_messages = (
        await db.chat_messages.find({"project_id": project_oid})
        .sort("created_at", 1)
        .to_list(None)
    )
    raw_user_message = chat_messages[-1]["content"] if chat_messages else ""
    history = _messages_to_history(chat_messages[-MAX_HISTORY:])
    project_context = dict(project_doc.get("context_object") or {})

    # Merge attachment names into project context for memory / FILE_ANALYSIS
    if attached_files:
        docs = list(project_context.get("uploaded_documents") or [])
        for f in attached_files:
            name = f.get("filename")
            if name and name not in docs:
                docs.append(name)
        project_context["uploaded_documents"] = docs

    file_prompt = format_files_for_prompt(attached_files)
    effective_input = raw_user_message
    if file_prompt:
        effective_input = (
            f"{raw_user_message}\n\n{file_prompt}"
            if raw_user_message.strip()
            else file_prompt
        )

    # Clean message for DB storage — never includes extracted file blobs.
    # This is what gets written to conversations.turns[].user in MongoDB.
    user_display = raw_user_message.strip()
    if not user_display and attached_files:
        names = ", ".join(f["filename"] for f in attached_files if f.get("filename"))
        user_display = f"[Attached: {names}]"

    # Always rehydrate project_context from Mongo so follow-up turns never lose
    # active-project awareness (checkpoint alone has been unreliable here).
    # Only seed conversation_history on the first turn — later turns use the
    # LangGraph checkpointer + add_messages reducer to avoid duplicates.
    if len(chat_messages) <= 1:
        state_input: dict[str, Any] = build_initial_state(effective_input)
        state_input["user_display"] = user_display
        state_input["conversation_history"] = history
        state_input["project_context"] = project_context
        state_input["uploaded_files"] = attached_files
        state_input["metadata"] = {
            "session_id": project_id,
            "project_id": project_id,
            "has_attachments": bool(attached_files),
        }
    else:
        state_input = {
            "user_input": effective_input,
            "user_display": user_display,
            "project_context": project_context,
            "uploaded_files": attached_files,
            "metadata": {
                "session_id": project_id,
                "project_id": project_id,
                "has_attachments": bool(attached_files),
            },
        }

    run_result = await db.ai_workflow_runs.insert_one(
        {
            "project_id": project_oid,
            "triggered_by_message_id": parse_object_id(message_id, field="message_id"),
            "status": "running",
            "agents_executed": [],
            "token_usage": {"input_tokens": 0, "output_tokens": 0, "total_tokens": 0},
            "duration_ms": 0,
            "created_at": datetime.now(UTC),
            "updated_at": datetime.now(UTC),
        }
    )
    run_id = run_result.inserted_id
    started_at = datetime.now(UTC)

    yield _sse({"type": "stream_start"})

    announced_nodes: set[str] = set()
    final_metadata: dict[str, Any] = {}
    final_context = project_context
    assistant_content: str | None = None
    streamed_content_len = 0
    message_started = False
    completed_reports: list[str] = []
    agents_executed: list[str] = []
    last_frontend_agent: str | None = None
    routing_decision: str | None = None
    cancelled = False

    try:
        config = {"configurable": {"thread_id": project_id}}

        async for chunk in workflow_graph.astream(state_input, config=config):
            if request is not None and await request.is_disconnected():
                cancelled = True
                break

            for node_name, state_update in chunk.items():
                if not isinstance(state_update, dict):
                    continue

                if "metadata" in state_update:
                    final_metadata.update(state_update["metadata"])
                    routing_decision = final_metadata.get("routing_decision", routing_decision)

                if "project_context" in state_update and state_update["project_context"]:
                    final_context = dict(state_update["project_context"])

                ai_text = _extract_ai_content(state_update)
                if ai_text:
                    assistant_content = ai_text
                    if not message_started:
                        message_started = True
                        yield _sse({"type": "message_start"})
                    async for payload, streamed_content_len in _emit_content_deltas(
                        ai_text,
                        already_streamed=streamed_content_len,
                    ):
                        yield payload

                frontend_agent = _frontend_agent_for_node(
                    node_name, final_metadata, state_update
                )
                last_frontend_agent = frontend_agent

                if node_name not in announced_nodes:
                    announced_nodes.add(node_name)
                    agents_executed.append(frontend_agent)
                    yield _sse({"type": "agent_start", "agent": frontend_agent})

                if node_name == "project_workflow":
                    needs_clarification = final_metadata.get("needs_clarification", False)
                    clarification_questions = _extract_clarification_questions(
                        assistant_content,
                        final_context,
                        needs_clarification=needs_clarification,
                        metadata=final_metadata,
                    )

                    if needs_clarification and clarification_questions:
                        question = clarification_questions[0]
                        options = _discovery_options_for_question(
                            question,
                            clarification_questions[1:4],
                        )
                        pending = {"question": question, "options": options}
                        final_context["pending_discovery"] = pending
                        await _persist_project_context(db, project_id, final_context)

                        yield _sse(
                            {
                                "type": "discovery_question",
                                "question": question,
                                "options": options,
                                "acknowledgment": assistant_content,
                                "message": assistant_content,
                            }
                        )
                        yield _sse(
                            {
                                "type": "clarification",
                                "questions": clarification_questions,
                                "message": assistant_content,
                            }
                        )
                    elif not final_metadata.get("discovery_complete", False):
                        # Clear stale pending_discovery labels from earlier buggy turns.
                        if final_context.pop("pending_discovery", None) is not None:
                            await _persist_project_context(db, project_id, final_context)
                        yield _sse({"type": "discovery_turn_complete"})
                    else:
                        if final_context.pop("pending_discovery", None) is not None:
                            await _persist_project_context(db, project_id, final_context)
                        yield _sse({"type": "discovery_complete"})

                if node_name == "report_generator":
                    report_type = final_metadata.get("last_generated_report")
                    if report_type:
                        api_type = AGENT_TO_API_REPORT.get(report_type, report_type.lower())
                        if api_type not in completed_reports:
                            completed_reports.append(api_type)

                yield _sse({"type": "agent_complete", "agent": frontend_agent})

        if cancelled:
            await db.ai_workflow_runs.update_one(
                {"_id": run_id},
                {
                    "$set": {
                        "status": "cancelled",
                        "agents_executed": agents_executed,
                        "updated_at": datetime.now(UTC),
                    }
                },
            )
            yield _sse({"type": "cancelled"})
            return

        if routing_decision == "GENERAL_CONVERSATION" and assistant_content:
            await _persist_assistant_message(
                db,
                project_id,
                assistant_content,
                message_type="text",
                metadata={"routing": routing_decision},
            )
            yield _sse(
                {
                    "type": "conversation_complete",
                    "message": assistant_content,
                    "status": "completed",
                }
            )
        elif assistant_content:
            message_type = "discovery" if final_metadata.get("needs_clarification") else "text"
            if completed_reports:
                message_type = "agent_result"
                for report_key in completed_reports:
                    content = _build_report_content(report_key, assistant_content)
                    await _upsert_report(db, project_id, report_key, content, run_id)

            metadata = {
                "workflow_run_id": str(run_id),
                "project_action": final_metadata.get("project_action"),
                "discovery_complete": final_metadata.get("discovery_complete", False),
                "reports_generated": completed_reports,
                "agent": last_frontend_agent,
            }
            await _persist_assistant_message(
                db,
                project_id,
                assistant_content,
                message_type=message_type,
                metadata=metadata,
            )

            final_context["discovery_complete"] = final_metadata.get(
                "discovery_complete", final_context.get("discovery_complete", False)
            )
            if final_metadata.get("discovery_complete"):
                final_context.pop("pending_discovery", None)

            await db.projects.update_one(
                {"_id": project_oid},
                {
                    "$set": {
                        "context_object": final_context,
                        "updated_at": datetime.now(UTC),
                    }
                },
            )

            event_type = "workflow_complete" if completed_reports else "conversation_complete"
            yield _sse(
                {
                    "type": event_type,
                    "status": "completed",
                    "reports": completed_reports,
                    "run_id": str(run_id),
                    "message": assistant_content,
                }
            )
        else:
            yield _sse(
                {
                    "type": "conversation_complete",
                    "status": "completed",
                    "run_id": str(run_id),
                }
            )

        duration_ms = int((datetime.now(UTC) - started_at).total_seconds() * 1000)
        await db.ai_workflow_runs.update_one(
            {"_id": run_id},
            {
                "$set": {
                    "status": "completed",
                    "agents_executed": agents_executed,
                    "duration_ms": duration_ms,
                    "updated_at": datetime.now(UTC),
                }
            },
        )

    except Exception as exc:
        logger.exception("[chat_service] Workflow failed for project %s", project_id)
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
        yield _sse({"type": "error", "message": "Workflow failed. Please try again."})


async def _persist_assistant_message(
    db,
    project_id: str,
    content: str,
    *,
    message_type: str,
    metadata: dict[str, Any],
) -> None:
    project_oid = parse_object_id(project_id, field="project_id")
    chat_session = await db.chat_sessions.find_one({"project_id": project_oid})
    if not chat_session:
        return

    await db.chat_messages.insert_one(
        {
            "chat_session_id": chat_session["_id"],
            "project_id": project_oid,
            "role": "assistant",
            "content": content,
            "message_type": message_type,
            "file_refs": [],
            "metadata": metadata,
            "created_at": datetime.now(UTC),
        }
    )
    await db.chat_sessions.update_one(
        {"_id": chat_session["_id"]},
        {"$set": {"updated_at": datetime.now(UTC)}},
    )
