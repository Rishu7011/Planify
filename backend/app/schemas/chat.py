from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime


class ChatMessage(BaseModel):
    """Represents a single message in a chat session."""

    chat_session_id: str
    project_id: str
    role: str  # user | assistant | system | agent
    content: str
    message_type: str  # text | clarification_question | agent_result | file_ref
    file_refs: List[str] = []
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime


class ChatSession(BaseModel):
    """Represents an active chat session tied to a project."""

    project_id: str
    user_id: str
    organization_id: str
    title: str
    status: str  # active | archived
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime


class SendMessageRequest(BaseModel):
    """Request body to send a new message in a chat session."""

    content: str
    file_ids: Optional[List[str]] = None


class SendMessageResponse(BaseModel):
    """Response returned immediately after a message is accepted."""

    message_id: str
    status: str  # received | processing
    workflow_run_id: Optional[str] = None
