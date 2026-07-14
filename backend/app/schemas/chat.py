"""Chat-related schemas."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field, model_validator


class SendMessageRequest(BaseModel):
    content: str = Field(default="", max_length=32000)
    file_ids: list[str] | None = None

    @model_validator(mode="after")
    def require_content_or_files(self) -> "SendMessageRequest":
        has_text = bool((self.content or "").strip())
        has_files = bool(self.file_ids)
        if not has_text and not has_files:
            raise ValueError("Message text or at least one file is required")
        if self.file_ids is not None and len(self.file_ids) > 5:
            raise ValueError("At most 5 files per message")
        return self


class FileAttachmentMeta(BaseModel):
    file_id: str
    filename: str
    content_type: str | None = None
    size_bytes: int = 0


class ChatMessageResponse(BaseModel):
    id: str
    role: str
    content: str
    message_type: str = "text"
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: str
    attachments: list[FileAttachmentMeta] = Field(default_factory=list)


class ChatHistoryResponse(BaseModel):
    messages: list[ChatMessageResponse]
    pending_discovery: dict[str, Any] | None = None
