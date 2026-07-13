"""
nodes/report_generator.py
--------------------------
Universal report generator — triggered by whatever next_workflows the
project_workflow LLM decides to queue.

The LLM in project_workflow is the sole gatekeeper:
  - If it sets next_workflows=["PRD"], this node generates a PRD.
  - If it sets next_workflows=["ROADMAP","ROI"], this runs for the first one.
  - If it sets next_workflows=["NO_ACTION"] or [], this node never runs.

Known report types get specialist instructions. Unknown types fall back
to a general-purpose prompt — the LLM still does the right thing.

All 9 standard reports are supported:
    PRD · TECHNICAL_ARCHITECTURE · MARKET_RESEARCH · COMPETITOR_ANALYSIS
    ROI · HR_PLANNING · RISK_ANALYSIS · ROADMAP · FINAL_REPORT
"""

from __future__ import annotations

import json
from typing import Final

from langchain_core.messages import AIMessage
from langchain_core.prompts import ChatPromptTemplate

from app.agent.db import conversation_repo, project_repo
from app.agent.llm import get_base_llm
from app.agent.state import WorkflowState

# ── Report type → generation instructions ─────────────────────────────────────
# Each entry is the specialist instruction block injected into the prompt.
# The LLM already knows how to write these — we just tell it WHAT to produce.

REPORT_INSTRUCTIONS: Final[dict[str, str]] = {
    "PRD": """\
Generate a complete Product Requirements Document (PRD) including:
1. Executive Summary & Product Vision
2. Problem Statement & Opportunity
3. Goals & Success Metrics (KPIs)
4. Target Users & Personas
5. User Stories & Use Cases (detailed, prioritized)
6. Functional Requirements (must-have vs nice-to-have)
7. Non-Functional Requirements (performance, security, scalability)
8. Out of Scope
9. Assumptions & Dependencies
10. Open Questions
""",

    "TECHNICAL_ARCHITECTURE": """\
Generate a complete Technical Architecture document including:
1. Architecture Overview (pattern, style, rationale)
2. System Components & responsibilities
3. Full Tech Stack Breakdown (frontend, backend, DB, AI/ML, infra)
4. Data Flow & Integration diagram (described in text/ASCII)
5. Database Design (schemas, indexes, relationships)
6. AI/ML Architecture (if applicable — models, pipeline, serving)
7. Security Architecture (auth, encryption, threats)
8. Scalability & Performance strategy
9. Deployment Architecture (envs, containers, CI/CD)
10. MVP vs Full Build scoping
""",

    "MARKET_RESEARCH": """\
Generate a comprehensive Market Research report including:
1. Market Overview & Size (TAM, SAM, SOM estimates)
2. Market Trends & Growth Drivers
3. Target Segment Deep-Dive (demographics, psychographics, behavior)
4. Customer Pain Points & Unmet Needs
5. Existing Solutions & Gaps
6. Regulatory & Compliance considerations
7. Go-to-Market opportunity
8. Key Risks & Market Barriers
9. Sources & Assumptions
""",

    "COMPETITOR_ANALYSIS": """\
Generate a detailed Competitor Analysis report including:
1. Competitive Landscape Overview
2. Top 5 Competitors (name, description, target market)
3. Feature Comparison Matrix
4. Pricing Model Comparison
5. Strengths & Weaknesses per competitor
6. Our Competitive Advantages
7. Market Gaps & Differentiation Strategy
8. Recommendations
""",

    "ROI": """\
Generate a complete ROI & Financial Analysis report including:
1. Cost Breakdown (development, infrastructure, operations, marketing)
2. Revenue Model & Monetization Strategy
3. Revenue Projections (Year 1, 2, 3)
4. Break-even Analysis
5. ROI Calculation & Payback Period
6. Key Financial Assumptions
7. Risk-adjusted Scenarios (optimistic / base / pessimistic)
8. Funding Requirements & Use of Funds
""",

    "HR_PLANNING": """\
Generate a complete HR & Team Planning report including:
1. Required Roles & Responsibilities
2. Team Structure & Org Chart (described)
3. Hiring Plan & Timeline
4. Skills Matrix (required vs nice-to-have per role)
5. Estimated Salaries & Budget allocation
6. Freelance vs Full-time recommendations
7. Onboarding & Knowledge Management plan
8. Team Scaling plan (MVP → growth)
""",

    "RISK_ANALYSIS": """\
Generate a comprehensive Risk Analysis report including:
1. Risk Register (list all identified risks)
2. Risk Matrix (Likelihood × Impact for each risk)
3. Technical Risks & Mitigations
4. Business & Market Risks
5. Financial Risks
6. Legal & Compliance Risks
7. Operational Risks
8. Top 5 Critical Risks with detailed mitigation plans
9. Risk Monitoring Strategy
""",

    "ROADMAP": """\
Generate a complete Product Roadmap including:
1. Roadmap Summary & Guiding Principles
2. Phase 1 — MVP (features, timeline, success criteria)
3. Phase 2 — Growth (features, timeline, success criteria)
4. Phase 3 — Scale (features, timeline, success criteria)
5. Milestone Timeline (Gantt-style described in text)
6. Dependencies & Critical Path
7. Resource allocation per phase
8. KPIs & Review Gates between phases
""",

    "FINAL_REPORT": """\
Generate a comprehensive Final Project Intelligence Report including:
1. Executive Summary
2. Project Overview (idea, problem, goals)
3. Market Opportunity
4. Technical Architecture Summary
5. Product Requirements Summary
6. Financial Projections & ROI Summary
7. Team & HR Plan Summary
8. Risk Summary & Mitigations
9. Recommended Next Steps
10. Decision Checklist (go / no-go criteria)
""",
}

# Fallback for unknown report types
_DEFAULT_INSTRUCTIONS = """\
Generate a comprehensive, well-structured report covering all relevant aspects
of this project based on the report type requested. Use clear headings,
bullet points, and actionable insights.
"""

# ── prompt template ───────────────────────────────────────────────────────────

_SYSTEM = """\
You are an expert business and technology consultant.
You produce clear, detailed, actionable reports for software/AI/business projects.
Use professional markdown formatting: headers (##, ###), bullet points, tables, and
code blocks where helpful. Be specific — use the actual details from the project context.
Do NOT make up information not present in the project context.
"""

_prompt = ChatPromptTemplate.from_messages(
    [
        ("system", _SYSTEM),
        ("human", (
            "Report Type: {report_type}\n\n"
            "Project Context:\n{project_context}\n\n"
            "Instructions:\n{instructions}\n\n"
            "Generate the full {report_type} report now."
        )),
    ]
)

_llm   = get_base_llm(temperature=0.3)
_chain = _prompt | _llm


# ── node ──────────────────────────────────────────────────────────────────────

def report_generator_node(state: WorkflowState) -> dict:
    """Universal report generator — trusts whatever the project_workflow LLM queued.

    Reads the first non-NO_ACTION entry from metadata["next_workflows"],
    looks up specialist instructions (or falls back to a general prompt),
    and generates the full report via the LLM.
    """
    project_context = state.get("project_context") or {}
    metadata        = state.get("metadata", {})
    session_id      = metadata.get("session_id", "default")
    next_workflows  = metadata.get("next_workflows", [])

    # Pick the first actionable workflow the project_workflow LLM queued.
    report_type = next(
        (wf for wf in next_workflows if wf and wf != "NO_ACTION"),
        None,
    )

    if not report_type:
        reply = "⚠️ No report was requested. Tell me what to generate (e.g. PRD, Roadmap, ROI)."
        return {"conversation_history": [AIMessage(content=reply)]}

    if not project_context:
        reply = (
            f"⚠️ I need more project information before I can generate the {report_type}. "
            "Please describe your project first."
        )
        return {"conversation_history": [AIMessage(content=reply)]}

    instructions  = REPORT_INSTRUCTIONS.get(report_type, _DEFAULT_INSTRUCTIONS)
    context_str   = json.dumps(project_context, indent=2)

    # ── generate ──────────────────────────────────────────────────────────────
    print(f"[report_generator] Generating {report_type}…")
    response      = _chain.invoke({
        "report_type":    report_type,
        "project_context": context_str,
        "instructions":   instructions,
    })
    report_doc    = response.content

    # ── persist ───────────────────────────────────────────────────────────────
    try:
        existing = project_repo.find_by_session(session_id)
        if existing:
            ctx    = dict(project_context)
            reports = list(ctx.get("reports", []))
            if report_type not in reports:
                reports.append(report_type)
            ctx["reports"] = reports
            # Remove this report from stale list — it's freshly generated.
            ctx["stale_outputs"] = [
                s for s in ctx.get("stale_outputs", []) if s != report_type
            ]
            project_repo.update_context(existing["_id"], ctx)

            # Log final conversation turn with the generated report content
            user_input = state["user_input"]
            conversation_repo.append_turn(
                session_id=session_id,
                user_input=user_input,
                ai_response=report_doc,
                metadata={
                    "project_action":        "REPORT_REQUEST",
                    "next_workflows":        [wf for wf in next_workflows if wf != report_type],
                    "last_generated_report": report_type,
                },
            )
    except Exception as db_err:
        print(f"[report_generator] MongoDB write warning: {db_err}")

    metadata_update = {
        **metadata,
        "last_generated_report": report_type,
        "next_workflows":        [wf for wf in next_workflows if wf != report_type],
    }

    return {
        "conversation_history": [AIMessage(content=report_doc)],
        "metadata":             metadata_update,
    }
