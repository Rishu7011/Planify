"""
LangGraph Workflow Definition.

Compiles the full agent pipeline:
  input_understanding → clarification → (conditional)
      ├─ awaiting_input → END  (pause, wait for user clarification)
      └─ prd → feasibility → roi → roadmap → final_report → END
"""
from __future__ import annotations

import logging
from typing import Any, Dict

from langgraph.graph import END, StateGraph

from app.agents import (
    clarification,
    feasibility_agent,
    final_report_agent,
    input_understanding,
    prd_agent,
    roadmap_agent,
    roi_agent,
)
from app.agents.state import WorkflowState
from app.agents.checkpointer import MongoCheckpointSaver
from app.db.mongodb import get_database

logger = logging.getLogger(__name__)


def _route_after_clarification(state: Dict[str, Any]) -> str:
    """
    Conditional edge: go to PRD or pause for user input.
    Reads routing_decision from the TypedDict state.
    """
    decision = state.get("routing_decision") or "awaiting_input"
    logger.info("[workflow] Routing after clarification: %s", decision)
    return decision


_compiled_graph = None


def get_graph():
    """Build and compile the full LangGraph agent pipeline, attaching the checkpointer."""
    global _compiled_graph
    if _compiled_graph is not None:
        return _compiled_graph

    graph = StateGraph(WorkflowState)

    # ── Register nodes ────────────────────────────────────────────────────────
    graph.add_node("input_understanding", input_understanding.input_understanding_agent)
    graph.add_node("clarification", clarification.clarification_agent)
    graph.add_node("prd", prd_agent.prd_agent)
    graph.add_node("feasibility", feasibility_agent.feasibility_agent)
    graph.add_node("roi", roi_agent.roi_agent)
    graph.add_node("roadmap", roadmap_agent.roadmap_agent)
    graph.add_node("final_report", final_report_agent.final_report_agent)

    # ── Set entry point ───────────────────────────────────────────────────────
    graph.set_entry_point("input_understanding")

    # ── Linear edges ──────────────────────────────────────────────────────────
    graph.add_edge("input_understanding", "clarification")

    # ── Conditional edge after clarification ──────────────────────────────────
    graph.add_conditional_edges(
        "clarification",
        _route_after_clarification,
        {
            "awaiting_input": END,  # Pause — frontend shows clarification questions
            "prd": "prd",           # Sufficient context — proceed to report generation
        },
    )

    # ── Agent chain ───────────────────────────────────────────────────────────
    graph.add_edge("prd", "feasibility")
    graph.add_edge("feasibility", "roi")
    graph.add_edge("roi", "roadmap")
    graph.add_edge("roadmap", "final_report")
    graph.add_edge("final_report", END)

    try:
        db = get_database()
        saver = MongoCheckpointSaver(db.client, db.name)
        _compiled_graph = graph.compile(checkpointer=saver)
        logger.info("[workflow] LangGraph compiled with MongoDB checkpointer")
    except Exception as exc:
        # Fallback if DB not connected (e.g., during tests or initialisation)
        logger.warning("[workflow] Checkpointer unavailable (%s) — compiling without persistence", exc)
        _compiled_graph = graph.compile()

    logger.info("[workflow] LangGraph compiled successfully")
    return _compiled_graph
