"""Chat-related schemas."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class SendMessageRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=32000)
    file_ids: list[str] | None = None


class ChatMessageResponse(BaseModel):
    id: str
    role: str
    content: str
    message_type: str = "text"
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: str


class ChatHistoryResponse(BaseModel):
    messages: list[ChatMessageResponse]
    pending_discovery: dict[str, Any] | None = None
