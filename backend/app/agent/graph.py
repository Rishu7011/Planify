"""
graph.py
--------
Assembles the LangGraph StateGraph.

Flow:

    START
      │
      ▼
    conversation_understanding
      │
      ├── GENERAL_CONVERSATION ──────────────────────────► END
      │
      └── PROJECT ──► project_workflow
                            │
                            ├── report requested? ──► report_generator ──► END
                            │
                            └── no report ──────────────────────────────► END

`report_generator` handles ALL report types:
    PRD · TECHNICAL_ARCHITECTURE · MARKET_RESEARCH · COMPETITOR_ANALYSIS
    ROI · HR_PLANNING · RISK_ANALYSIS · ROADMAP · FINAL_REPORT
"""

from __future__ import annotations

from langgraph.graph import END, START, StateGraph
from langgraph.graph.state import CompiledStateGraph

from app.agent.nodes import (
    conversation_understanding_node,
    project_workflow_node,
    report_generator_node,
)
from app.agent.router import (
    PROJECT_WORKFLOW_NODE,
    REPORT_GENERATOR_NODE,
    route_after_conversation_understanding,
    route_after_project_workflow,
)
from app.agent.db import get_checkpointer
from app.agent.state import WorkflowState

CONVERSATION_UNDERSTANDING_NODE = "conversation_understanding"


def build_graph() -> CompiledStateGraph:
    """Builds and compiles the top-level workflow graph."""
    graph = StateGraph(WorkflowState)

    # ── nodes ─────────────────────────────────────────────────────────────────
    graph.add_node(CONVERSATION_UNDERSTANDING_NODE, conversation_understanding_node)
    graph.add_node(PROJECT_WORKFLOW_NODE,           project_workflow_node)
    graph.add_node(REPORT_GENERATOR_NODE,           report_generator_node)

    # ── edges ─────────────────────────────────────────────────────────────────
    graph.add_edge(START, CONVERSATION_UNDERSTANDING_NODE)

    # conversation_understanding → project_workflow | END
    graph.add_conditional_edges(
        CONVERSATION_UNDERSTANDING_NODE,
        route_after_conversation_understanding,
        {
            PROJECT_WORKFLOW_NODE: PROJECT_WORKFLOW_NODE,
            END:                   END,
        },
    )

    # project_workflow → report_generator | END
    graph.add_conditional_edges(
        PROJECT_WORKFLOW_NODE,
        route_after_project_workflow,
        {
            REPORT_GENERATOR_NODE: REPORT_GENERATOR_NODE,
            END:                   END,
        },
    )

    # report_generator always ends the turn (one report per turn)
    graph.add_edge(REPORT_GENERATOR_NODE, END)

    # Compile with MongoDB checkpointer
    return graph.compile(checkpointer=get_checkpointer())


# Module-level compiled graph — imported by main.py and the LangGraph server.
app = build_graph()