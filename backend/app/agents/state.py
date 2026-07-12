"""
LangGraph WorkflowState — the shared state object that flows through every agent node.

IMPORTANT: Must be a TypedDict (not Pydantic BaseModel) for LangGraph to correctly
perform partial state merges. Each agent node returns a DICT of only the fields it
updates; LangGraph merges that dict into the existing state. With Pydantic BaseModel,
the merge would replace the entire object with only the returned fields, causing
accumulated agent_outputs to be lost.

All fields are JSON-serialisable — required for the MongoDB checkpointer.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from typing_extensions import TypedDict

from app.schemas.context import ProjectContext


class WorkflowState(TypedDict, total=False):
    """
    Shared state flowing through the LangGraph pipeline.

    LangGraph passes this between nodes and merges return dicts into it.
    All fields are JSON-serialisable for MongoDB checkpoint persistence.

    Using TypedDict (not Pydantic BaseModel) so LangGraph can correctly
    do partial dict-style merges per node output.
    """

    # ── Input ─────────────────────────────────────────────────────────────────
    project_id: str
    raw_user_message: str
    chat_history: List[Dict[str, str]]
    project_context: ProjectContext
    uploaded_file_summaries: List[str]

    # ── Execution tracking ────────────────────────────────────────────────────
    current_agent: Optional[str]
    agents_executed: List[str]

    # ── Agent outputs ─────────────────────────────────────────────────────────
    agent_outputs: Dict[str, Any]

    # ── Routing ───────────────────────────────────────────────────────────────
    routing_decision: Optional[str]  # "prd" | "awaiting_input" | "persist"

    # ── Status ────────────────────────────────────────────────────────────────
    status: str  # running | awaiting_input | completed | failed
    error_message: Optional[str]

    # ── Token usage ───────────────────────────────────────────────────────────
    total_input_tokens: int
    total_output_tokens: int
