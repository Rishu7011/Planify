"""Chat routes."""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Request, status
from fastapi.responses import StreamingResponse

from app.config import get_settings
from app.db.mongodb import get_database
from app.routes.projects import _assert_project_access
from app.schemas.chat import (
    ChatHistoryResponse,
    ChatMessageResponse,
    FileAttachmentMeta,
    SendMessageRequest,
)
from app.services.chat_service import run_workflow_and_stream
from app.services.file_service import load_files_for_message, serialize_file_meta
from app.utils.objectid import parse_object_id

router = APIRouter(prefix="/api/projects/{project_id}/chat", tags=["Chat"])
UTC = timezone.utc


@router.post("/messages", summary="Send a message and stream AI response")
async def send_message(request: Request, project_id: str, body: SendMessageRequest):
    user = request.state.user
    db = get_database()
    project_oid = parse_object_id(project_id, field="project_id")
    settings = get_settings()

    project = await _assert_project_access(project_id, user, db)
    chat_session = await db.chat_sessions.find_one({"project_id": project_oid})
    if not chat_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found for this project",
        )

    running = await db.ai_workflow_runs.find_one(
        {"project_id": project_oid, "status": "running"}
    )
    if running:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A workflow is already running for this project. Wait for it to finish.",
        )

    file_ids_raw = body.file_ids or []
    if len(file_ids_raw) > settings.max_files_per_message:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"At most {settings.max_files_per_message} files per message",
        )

    file_refs = [parse_object_id(fid, field="file_id") for fid in file_ids_raw if fid]
    attachments = await load_files_for_message(db, project_id, file_refs)
    if file_refs and len(attachments) != len(file_refs):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="One or more file_ids are invalid or do not belong to this project",
        )

    content = (body.content or "").strip()
    if not content and attachments:
        names = ", ".join(a["filename"] for a in attachments)
        content = f"[Attached: {names}]"

    now = datetime.now(UTC)
    msg_result = await db.chat_messages.insert_one(
        {
            "chat_session_id": chat_session["_id"],
            "project_id": project_oid,
            "role": "user",
            "content": content,
            "message_type": "text",
            "file_refs": file_refs,
            "metadata": {
                "attachments": [
                    {
                        "file_id": a["file_id"],
                        "filename": a["filename"],
                        "content_type": a.get("content_type"),
                        "size_bytes": a.get("size_bytes", 0),
                    }
                    for a in attachments
                ]
            },
            "created_at": now,
        }
    )

    await db.chat_sessions.update_one(
        {"_id": chat_session["_id"]},
        {"$set": {"updated_at": now}},
    )

    return StreamingResponse(
        run_workflow_and_stream(
            project_id=project_id,
            message_id=str(msg_result.inserted_id),
            project_doc=project,
            request=request,
            attached_files=attachments,
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/messages", summary="Get chat history")
async def get_messages(
    request: Request,
    project_id: str,
    limit: int = 50,
    skip: int = 0,
) -> ChatHistoryResponse:
    user = request.state.user
    db = get_database()

    project = await _assert_project_access(project_id, user, db)
    limit = max(1, min(limit, 200))
    skip = max(0, skip)

    messages = (
        await db.chat_messages.find(
            {"project_id": parse_object_id(project_id, field="project_id")}
        )
        .sort("created_at", -1)
        .skip(skip)
        .limit(limit)
        .to_list(None)
    )
    messages.reverse()

    # Hydrate attachment metadata for history display
    all_refs: list = []
    for m in messages:
        all_refs.extend(m.get("file_refs") or [])
    file_map: dict = {}
    if all_refs:
        docs = await db.project_files.find({"_id": {"$in": all_refs}}).to_list(None)
        file_map = {d["_id"]: serialize_file_meta(d) for d in docs}

    ctx = project.get("context_object") or {}
    pending_discovery = ctx.get("pending_discovery")

    response_messages: list[ChatMessageResponse] = []
    for m in messages:
        attachments: list[FileAttachmentMeta] = []
        meta_atts = (m.get("metadata") or {}).get("attachments") or []
        if meta_atts:
            attachments = [FileAttachmentMeta(**a) for a in meta_atts if a.get("file_id")]
        else:
            for ref in m.get("file_refs") or []:
                meta = file_map.get(ref)
                if meta:
                    attachments.append(FileAttachmentMeta(**meta))

        response_messages.append(
            ChatMessageResponse(
                id=str(m["_id"]),
                role=m["role"],
                content=m["content"],
                message_type=m.get("message_type", "text"),
                metadata=m.get("metadata", {}),
                created_at=m["created_at"].isoformat(),
                attachments=attachments,
            )
        )

    return ChatHistoryResponse(
        messages=response_messages,
        pending_discovery=pending_discovery,
    )
