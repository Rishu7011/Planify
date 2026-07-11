"""
Project-related Pydantic schemas for request/response models.
"""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.schemas.context import ProjectContext


# ── Request Schemas ───────────────────────────────────────────────────────────

class CreateProjectRequest(BaseModel):
    """Request body for creating a new project."""

    title: str = Field(..., min_length=1, max_length=200, description="Project title")
    description: Optional[str] = Field(None, max_length=2000, description="Optional description")
    organization_id: Optional[str] = Field(
        None, description="Org to create in; defaults to personal workspace"
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "title": "Healthcare Admin Automation",
                "description": "AI tool to reduce doctor administrative burden",
            }
        }
    }


# ── Response Schemas ──────────────────────────────────────────────────────────

class ProjectResponse(BaseModel):
    """Response schema for a single project."""

    id: str
    title: str
    description: str
    organization_id: str
    status: str
    context: Optional[ProjectContext] = None
    chat_session_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class ProjectListItem(BaseModel):
    """Lightweight project entry for list views."""

    id: str
    title: str
    description: str
    organization_id: str
    status: str
    created_at: datetime
    updated_at: datetime
