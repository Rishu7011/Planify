"""Project-related schemas."""

from __future__ import annotations

from typing import Any, Optional

from pydantic import BaseModel, Field


class CreateProjectRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    organization_id: Optional[str] = None


class ProjectDetailResponse(BaseModel):
    id: str
    title: str
    description: str
    organization_id: str
    status: str
    context: Optional[dict[str, Any]] = None
    chat_session_id: Optional[str] = None
    created_at: str
    updated_at: str
    objective: Optional[str] = None
    priority: Optional[str] = None
    target: Optional[str] = None
    memory: list[dict[str, str]] = Field(default_factory=list)
