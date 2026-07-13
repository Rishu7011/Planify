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

# Build the structured-output chain once at import time.
# get_structured_llm() uses json_mode for Gemini (avoids the empty-tool-call
# error) and adds automatic retry for all providers.
_conversation_understanding_chain = (
    conversation_understanding_prompt
    | get_structured_llm(ConversationUnderstandingOutput)
)


def conversation_understanding_node(state: WorkflowState) -> dict:
    """Classifies the user's message and routes / responds accordingly.

    Returns a partial state update (LangGraph merges this into the full
    state). `conversation_history` uses the `add_messages` reducer, so we
    only need to return the *new* messages, not the full list.
    """
    user_input = state["user_input"]
    history = state.get("conversation_history", [])

    result: ConversationUnderstandingOutput = _conversation_understanding_chain.invoke(
        {
            "user_input": user_input,
            "conversation_history": history,
        }
    )

    new_messages: list = [HumanMessage(content=user_input)]

    metadata_update = {
        **state.get("metadata", {}),
        "routing_decision": result.category.value,
        "routing_confidence": result.confidence,
        "routing_reasoning": result.reasoning,
    }

    if result.category == ConversationCategory.GENERAL_CONVERSATION:
        reply = result.response or (
            "Hey there! 👋 I'm your AI Project Guide. I'd love to help you design, "
            "analyze, and build your next big idea! What are you thinking of creating today?"
        )
        new_messages.append(AIMessage(content=reply))
        
        # Persist general conversation turn to the database
        session_id = state.get("metadata", {}).get("session_id", "default")
        try:
            conversation_repo.append_turn(
                session_id=session_id,
                user_input=user_input,
                ai_response=reply,
                metadata={
                    "project_action":    "GENERAL_CONVERSATION",
                    "confidence":        result.confidence,
                    "reasoning":         result.reasoning,
                },
            )
        except Exception as db_err:
            print(f"[conversation_understanding] MongoDB write warning: {db_err}")

        return {
            "conversation_history": new_messages,
            "metadata": metadata_update,
        }

    # PROJECT category: no reply is generated here. The Project Workflow
    # node(s) will take over from here to analyze/respond.
    return {
        "conversation_history": new_messages,
        "metadata": metadata_update,
    }