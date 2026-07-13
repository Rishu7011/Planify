"""
main.py
-------
Simple CLI runner for local testing. Requires a running Ollama server
(default: http://localhost:11434) with the model set in llm.py pulled,
e.g.:

    ollama pull llama3.1
    ollama serve

Usage:
    python main.py
"""

from __future__ import annotations

from app.agent.db import init_db
from app.agent.graph import app
from app.agent.state import build_initial_state


import uuid


def run_turn(user_input: str, session_id: str, prior_state: dict | None = None) -> dict:
    """Runs a single conversational turn through the graph with persistence."""
    config = {"configurable": {"thread_id": session_id}}
    
    # On the very first turn, we must construct the initial state.
    # On subsequent turns, we only need to pass the new user_input.
    if prior_state is None:
        state = build_initial_state(user_input)
        state["metadata"]["session_id"] = session_id
    else:
        state = {"user_input": user_input}
        
    result = app.invoke(state, config=config)
    return result


def main() -> None:
    init_db()   # ensure MongoDB Atlas indexes exist
    session_id = f"cli-{uuid.uuid4().hex[:8]}"
    print("AI Project Intelligence Platform — type 'exit' to quit.\n")
    print(f"Session/Thread ID: {session_id}\n")
    state: dict | None = None

    while True:
        user_input = input("You: ").strip()
        if user_input.lower() in {"exit", "quit"}:
            break
        if not user_input:
            continue

        state = run_turn(user_input, session_id, state)

        last_ai_message = state["conversation_history"][-1]
        print(f"🤖: {last_ai_message.content}")
        meta = state["metadata"]
        routing = meta.get("routing_decision", "—")
        action  = meta.get("project_action", "")
        workflows = meta.get("next_workflows", [])
        stale     = meta.get("stale_outputs", [])
        disc_comp = meta.get("discovery_complete", False)
        print(f"  [routing: {routing}]", end="")
        if action:
            print(f"  [action: {action}] [discovery_complete: {disc_comp}]", end="")
        if workflows:
            print(f"  [next: {workflows}]", end="")
        if stale:
            print(f"  [⚠ stale: {stale}]", end="")
        print("\n")


if __name__ == "__main__":
    main()