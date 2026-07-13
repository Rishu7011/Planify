"""
nodes/conversation_understanding.py
------------------------------------
The entry-point node for every user turn.

Responsibilities (and ONLY these):
  1. Read the current state (latest input + history).
  2. Classify the message as GENERAL_CONVERSATION or PROJECT.
  3. If GENERAL_CONVERSATION -> answer naturally, workflow will END.
  4. If PROJECT -> do NOT answer/report; just record the routing decision
     in `metadata` so the graph can hand off to the Project Workflow.

This node must stay lightweight. It never calls project-analysis logic
itself.
"""

from __future__ import annotations

from langchain_core.messages import AIMessage, HumanMessage

from app.agent.db import conversation_repo
from app.agent.llm import get_structured_llm
from app.agent.prompts import conversation_understanding_prompt
from app.agent.schemas import ConversationCategory, ConversationUnderstandingOutput
from app.agent.state import WorkflowState
from app.agent.web_search import is_light_message

# Build the structured-output chain once at import time.
_conversation_understanding_chain = (
    conversation_understanding_prompt
    | get_structured_llm(ConversationUnderstandingOutput)
)

_ACTIVE_PROJECT_KEYS = (
    "project_name",
    "idea",
    "problem_statement",
    "target_users",
    "goals",
    "reports",
)


def _has_active_project(project_context: dict | None) -> bool:
    """True when enough project context already exists that a follow-up
    should never reset back to a generic greeting."""
    if not project_context:
        return False
    for key in _ACTIVE_PROJECT_KEYS:
        value = project_context.get(key)
        if isinstance(value, str) and value.strip():
            return True
        if isinstance(value, list) and any(str(item).strip() for item in value):
            return True
    return False


def conversation_understanding_node(state: WorkflowState) -> dict:
    """Classifies the user's message and routes / responds accordingly."""
    user_input = state["user_input"]
    history = state.get("conversation_history", [])
    project_context = state.get("project_context") or {}

    result: ConversationUnderstandingOutput = _conversation_understanding_chain.invoke(
        {
            "user_input": user_input,
            "conversation_history": history,
        }
    )

    category = result.category
    reasoning = result.reasoning
    confidence = result.confidence

    # Keep pure greetings ("hi") as GENERAL_CONVERSATION even mid-project —
    # forcing the full project_workflow + web search made "hi" take 30s+.
    # Only override for *substantive* follow-ups when a project is active.
    if (
        category == ConversationCategory.GENERAL_CONVERSATION
        and _has_active_project(project_context)
        and not is_light_message(user_input)
    ):
        category = ConversationCategory.PROJECT
        reasoning = (
            f"Overridden to PROJECT because active project_context exists. "
            f"Original classification: {result.category.value} — {result.reasoning}"
        )
        confidence = max(confidence, 0.9)

    new_messages: list = [HumanMessage(content=user_input)]

    metadata_update = {
        **state.get("metadata", {}),
        "routing_decision": category.value,
        "routing_confidence": confidence,
        "routing_reasoning": reasoning,
    }

    if category == ConversationCategory.GENERAL_CONVERSATION:
        reply = result.response or (
            "Hey there! 👋 I'm your AI Project Guide. I'd love to help you design, "
            "analyze, and build your next big idea! What are you thinking of creating today?"
        )
        if _has_active_project(project_context) and is_light_message(user_input):
            name = (
                (project_context.get("project_name") or "").strip()
                or (project_context.get("idea") or "").strip()
                or "your project"
            )
            reply = (
                f"Hey! 👋 Ready to continue on **{name}**? "
                "Tell me more details, ask for ideas, or say “generate the PRD” when you want a doc."
            )

        new_messages.append(AIMessage(content=reply))

        session_id = state.get("metadata", {}).get("session_id", "default")
        try:
            conversation_repo.append_turn(
                session_id=session_id,
                user_input=user_input,
                ai_response=reply,
                metadata={
                    "project_action": "GENERAL_CONVERSATION",
                    "confidence": confidence,
                    "reasoning": reasoning,
                },
            )
        except Exception as db_err:
            print(f"[conversation_understanding] MongoDB write warning: {db_err}")

        return {
            "conversation_history": new_messages,
            "metadata": metadata_update,
        }

    return {
        "conversation_history": new_messages,
        "metadata": metadata_update,
    }
