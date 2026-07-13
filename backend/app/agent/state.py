"""
state.py
--------
Defines the shared LangGraph workflow state.

This is the single source of truth passed between every node in the graph.
It is intentionally generic so that future multi-agent nodes (requirements
analysis, architecture design, risk assessment, report generation, etc.)
can read/write to it without needing to redefine state.
"""

from __future__ import annotations

from typing import Annotated, Any, Optional, TypedDict

from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages


class WorkflowState(TypedDict):
    """Central state object shared across all graph nodes.

    Attributes:
        user_input: The raw latest message from the user.
        conversation_history: Full message history. Uses the `add_messages`
            reducer so nodes can simply return new messages and LangGraph
            will append (rather than overwrite) them.
        conversation_summary: Rolling summary of the conversation so far,
            useful once history grows large (future summarization node).
        project_context: Structured, accumulated knowledge about the
            project being discussed (requirements, goals, constraints...).
        uploaded_files: Metadata/content references for any files the user
            has uploaded (specs, docs, diagrams, etc.).
        current_project: The active project record, if one has been
            created/identified during this session.
        user_preferences: Persisted user-level preferences (tone, output
            format, notification settings, etc.).
        metadata: Free-form bag for routing decisions, trace IDs, timing,
            and other cross-cutting concerns. The Conversation Understanding
            node writes its routing decision here.
    """

    user_input: str
    conversation_history: Annotated[list[BaseMessage], add_messages]
    conversation_summary: str
    project_context: dict[str, Any]
    uploaded_files: list[dict[str, Any]]
    current_project: Optional[dict[str, Any]]
    user_preferences: dict[str, Any]
    metadata: dict[str, Any]


def build_initial_state(user_input: str) -> WorkflowState:
    """Convenience factory for a fresh conversation state."""
    return WorkflowState(
        user_input=user_input,
        conversation_history=[],
        conversation_summary="",
        project_context={},
        uploaded_files=[],
        current_project=None,
        user_preferences={},
        metadata={},
    )