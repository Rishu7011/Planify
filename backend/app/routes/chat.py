"""
Chat routes.

POST /api/projects/{id}/chat/messages  — send message + stream AI response (SSE)
GET  /api/projects/{id}/chat/messages  — paginated chat history
"""
from __future__ import annotations

from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, HTTPException, Request, status
from fastapi.responses import StreamingResponse

from app.db.mongodb import get_database
from app.routes.projects import _assert_project_access
from app.schemas.chat import SendMessageRequest
from app.services.chat_service import run_workflow_and_stream

router = APIRouter(prefix="/api/projects/{project_id}/chat", tags=["Chat"])

UTC = timezone.utc


@router.post("/messages", summary="Send a message and stream AI response")
async def send_message(request: Request, project_id: str, body: SendMessageRequest):
    """
    Persists user message, then streams SSE events from the LangGraph workflow.
    Streams `text/event-stream` data chunks.
    """
    user = request.state.user
    db = get_database()

    project = await _assert_project_access(project_id, user, db)

    # Ensure chat session exists
    chat_session = await db.chat_sessions.find_one({"project_id": ObjectId(project_id)})
    if not chat_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found for this project",
        )

    # Persist the user message
    now = datetime.now(UTC)
    user_message_doc = {
        "chat_session_id": chat_session["_id"],
        "project_id": ObjectId(project_id),
        "role": "user",
        "content": body.content,
        "message_type": "text",
        "file_refs": [ObjectId(fid) for fid in (body.file_ids or [])],
        "metadata": {},
        "created_at": now,
    }
    msg_result = await db.chat_messages.insert_one(user_message_doc)

    # Update chat session timestamp
    await db.chat_sessions.update_one(
        {"_id": chat_session["_id"]},
        {"$set": {"updated_at": now}},
    )

    return StreamingResponse(
        run_workflow_and_stream(
            project_id=project_id,
            message_id=str(msg_result.inserted_id),
            project_doc=project,
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/messages", summary="Get paginated chat history")
async def get_messages(
    request: Request,
    project_id: str,
    limit: int = 50,
    skip: int = 0,
) -> list:
    user = request.state.user
    db = get_database()

    await _assert_project_access(project_id, user, db)

    messages = (
        await db.chat_messages.find({"project_id": ObjectId(project_id)})
        .sort("created_at", 1)
        .skip(skip)
        .limit(limit)
        .to_list(None)
    )

    return [
        {
            "id": str(m["_id"]),
            "role": m["role"],
            "content": m["content"],
            "message_type": m.get("message_type", "text"),
            "metadata": m.get("metadata", {}),
            "created_at": m["created_at"].isoformat(),
        }
        for m in messages
    ]
