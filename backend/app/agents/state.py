"""
LangGraph WorkflowState — the shared state object that flows through every agent node.
"""
from __future__ import annotations

from typing import Annotated, Any, Dict, List, Optional

from langgraph.graph.message import add_messages
from pydantic import BaseModel, Field

from app.schemas.context import ProjectContext


class WorkflowState(BaseModel):
    """
    Shared state flowing through the LangGraph pipeline.

    LangGraph passes this between nodes and merges return dicts into it.
    All fields should be JSON-serialisable.
    """

    # ── Input ─────────────────────────────────────────────────────────────────
    project_id: str
    raw_user_message: str
    chat_history: List[Dict[str, str]] = Field(default_factory=list)
    project_context: ProjectContext = Field(default_factory=ProjectContext)
    uploaded_file_summaries: List[str] = Field(default_factory=list)

    # ── Execution tracking ────────────────────────────────────────────────────
    current_agent: Optional[str] = None
    agents_executed: List[str] = Field(default_factory=list)

    # ── Agent outputs ─────────────────────────────────────────────────────────
    agent_outputs: Dict[str, Any] = Field(default_factory=dict)

    # ── Routing ───────────────────────────────────────────────────────────────
    routing_decision: Optional[str] = None  # "prd" | "awaiting_input"

    # ── Status ────────────────────────────────────────────────────────────────
    status: str = "running"  # running | awaiting_input | completed | failed
    error_message: Optional[str] = None

    # ── Token usage ───────────────────────────────────────────────────────────
    total_input_tokens: int = 0
    total_output_tokens: int = 0

    class Config:
        arbitrary_types_allowed = True
