"""
schemas.py
----------
Pydantic models used for structured LLM output via `.with_structured_output()`.

Keeping these separate from prompts/nodes makes the contract between the
LLM and the graph explicit, versionable, and easy to unit test.
"""

from __future__ import annotations

from enum import Enum

from typing import Any

from pydantic import BaseModel, Field, field_validator


class ConversationCategory(str, Enum):
    """The only two routing categories the Conversation Understanding
    node is allowed to choose between.

    Intentionally coarse: greetings, small talk, thanks, goodbyes, general
    knowledge questions, etc. all collapse into GENERAL_CONVERSATION.
    Anything that concerns a software/business/AI project — describing an
    idea, requesting analysis, asking to start/continue a project — is
    PROJECT.
    """

    GENERAL_CONVERSATION = "GENERAL_CONVERSATION"
    PROJECT = "PROJECT"


class ConversationUnderstandingOutput(BaseModel):
    """Structured output contract for the Conversation Understanding node."""

    category: ConversationCategory = Field(
        ...,
        description=(
            "Whether the user's message is general conversation or "
            "related to a software/business/AI project."
        ),
    )
    reasoning: str = Field(
        ...,
        description="Brief internal justification for the classification.",
    )
    response: str | None = Field(
        ...,
        description=(
            "A natural, direct reply to the user. Must be a friendly, warm, conversational "
            "reply when category is GENERAL_CONVERSATION. Must be null when category is PROJECT, "
            "since project messages are handled by downstream nodes."
        ),
    )
    confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Model's confidence in the classification, 0.0 to 1.0.",
    )

    @field_validator("confidence", mode="before")
    @classmethod
    def normalize_confidence(cls, v: Any) -> float:
        """Normalizes confidence if model outputs a percentage (e.g., 100 or 95)."""
        if isinstance(v, (int, float)):
            if v > 1.0:
                return float(v) / 100.0
            return float(v)
        try:
            val = float(v)
            if val > 1.0:
                return val / 100.0
            return val
        except (ValueError, TypeError):
            return 0.0


# ── Project Workflow Agent schemas ────────────────────────────────────────────

class ProjectAction(str, Enum):
    """What the user is doing in this turn relative to the project lifecycle.

    The LLM must choose exactly one — this drives routing and state logic.
    """
    NEW_PROJECT      = "NEW_PROJECT"       # First time describing a project idea
    CONTINUE_PROJECT = "CONTINUE_PROJECT"  # Continuing an existing project discussion
    UPDATE_PROJECT   = "UPDATE_PROJECT"    # Changing an existing assumption/field
    PROJECT_QUERY    = "PROJECT_QUERY"     # Asking a question about the project
    REPORT_REQUEST   = "REPORT_REQUEST"    # Requesting a specific report/output
    FILE_ANALYSIS    = "FILE_ANALYSIS"     # Uploaded a file to analyze
    CLARIFICATION    = "CLARIFICATION"     # Responding to a previous clarification ask


class NextWorkflow(str, Enum):
    """Downstream specialist agents this node can route to."""
    PROJECT_INITIALIZATION = "PROJECT_INITIALIZATION"
    PROJECT_UPDATE         = "PROJECT_UPDATE"
    DOCUMENT_PROCESSING    = "DOCUMENT_PROCESSING"
    CLARIFICATION          = "CLARIFICATION"
    PRD                    = "PRD"
    TECHNICAL_ARCHITECTURE = "TECHNICAL_ARCHITECTURE"
    MARKET_RESEARCH        = "MARKET_RESEARCH"
    COMPETITOR_ANALYSIS    = "COMPETITOR_ANALYSIS"
    ROI                    = "ROI"
    HR_PLANNING            = "HR_PLANNING"
    RISK_ANALYSIS          = "RISK_ANALYSIS"
    ROADMAP                = "ROADMAP"
    FINAL_REPORT           = "FINAL_REPORT"
    NO_ACTION              = "NO_ACTION"


class ProjectContext(BaseModel):
    """The single source of truth for all accumulated project knowledge.

    Rules:
    - Only set fields the user has explicitly mentioned.
    - Never remove existing values unless the user explicitly changes them.
    - List fields are additive (union across turns).
    """
    # ── Core identity ────────────────────────────────────────────────────────
    project_name:        str | None = Field(default=None, description="Name or working title of the project.")
    idea:                str | None = Field(default=None, description="One-sentence description of the project idea.")
    problem_statement:   str | None = Field(default=None, description="The core problem the project solves.")
    goals:               list[str]  = Field(default_factory=list, description="Key goals or success criteria.")
    # ── Audience & market ────────────────────────────────────────────────────
    target_users:        str | None = Field(default=None, description="Primary users of the product.")
    industry:            str | None = Field(default=None, description="Industry or vertical.")
    business_domain:     str | None = Field(default=None, description="Specific business domain.")
    # ── Scope & resources ────────────────────────────────────────────────────
    budget:              str | None = Field(default=None, description="Budget range or constraints.")
    timeline:            str | None = Field(default=None, description="Desired timeline or deadline.")
    technology_stack:    list[str]  = Field(default_factory=list, description="Technologies, frameworks, platforms mentioned.")
    constraints:         list[str]  = Field(default_factory=list, description="Known limitations or non-negotiable constraints.")
    assumptions:         list[str]  = Field(default_factory=list, description="Assumptions being made about the project.")
    # ── Artifacts & gaps ────────────────────────────────────────────────────
    uploaded_documents:  list[str]  = Field(default_factory=list, description="Names/paths of uploaded documents.")
    reports:             list[str]  = Field(default_factory=list, description="Reports that have been generated so far.")
    conversation_summary: str | None = Field(default=None, description="Rolling plain-English summary of the conversation.")
    missing_information: list[str]  = Field(default_factory=list, description="Critical gaps still needed for downstream agents.")
    stale_outputs:       list[str]  = Field(default_factory=list, description="Reports/outputs invalidated by recent changes.")


class ProjectWorkflowOutput(BaseModel):
    """Structured output contract for the Project Workflow Agent node.

    Matches the canonical response format:
    {
        summary, project_action, updated_context,
        needs_clarification, clarification_questions,
        discovery_complete, stale_outputs, tools_to_call,
        next_workflows, assistant_response, confidence
    }
    """
    summary:                 str           = Field(..., description="One-sentence summary of what the user communicated this turn.")
    project_action:          ProjectAction = Field(..., description="What the user is doing in this turn.")
    updated_context:         ProjectContext = Field(
        ...,
        description=(
            "Project fields extracted from the FULL conversation (not just this turn). "
            "Preserve all existing fields. Only update fields explicitly changed by the user."
        ),
    )
    needs_clarification:     bool          = Field(
        ...,
        description=(
            "True when critical information (problem, target users, or core features) is "
            "still missing and the agent needs to ask follow-up questions before proceeding."
        ),
    )
    clarification_questions: list[str]     = Field(
        default_factory=list,
        description=(
            "≤3 high-value clarification questions. Empty when needs_clarification is False. "
            "Never repeat questions already answered in conversation_history."
        ),
    )
    discovery_complete:      bool          = Field(
        default=False,
        description=(
            "True when enough is known to proceed: (idea OR problem_statement) AND "
            "(target_users OR at least one goal/feature). "
            "Budget, timeline, tech stack, scale, and language are OPTIONAL — never "
            "keep this False just because those are missing. "
            "Reports may still generate on REPORT_REQUEST with labeled recommendations."
        ),
    )
    stale_outputs:           list[str]     = Field(
        default_factory=list,
        description=(
            "List of report/output names invalidated by changes this turn. "
            "Budget change → ROI, HR, Roadmap. "
            "Tech change → Architecture, Infrastructure. "
            "Target users change → PRD, Market Research. "
            "Problem change → everything."
        ),
    )
    tools_to_call:           list[str]     = Field(
        default_factory=list,
        description="Tool names this node should invoke (e.g. save_project, load_project, search_reports).",
    )
    next_workflows:          list[NextWorkflow] = Field(
        ...,
        description=(
            "Downstream workflows to trigger. CRITICAL RULES: "
            "(1) During discovery (discovery_complete=False), ALWAYS use [NO_ACTION] — "
            "never queue PRD, TECHNICAL_ARCHITECTURE, MARKET_RESEARCH, ROI, HR_PLANNING, "
            "RISK_ANALYSIS, ROADMAP, or FINAL_REPORT automatically. "
            "(2) Report workflows are ONLY allowed when project_action=REPORT_REQUEST "
            "(user explicitly asked for a report) OR when discovery_complete=True AND the "
            "workflow planner has scheduled it. "
            "(3) PROJECT_QUERY turns always get [NO_ACTION]. "
            "(4) For REPORT_REQUEST, queue ONLY the matching report type "
            "(e.g. TECHNICAL_ARCHITECTURE) — never PROJECT_INITIALIZATION, "
            "PROJECT_UPDATE, CLARIFICATION, or a kitchen-sink list of every report."
        ),
    )
    assistant_response:      str           = Field(
        ...,
        description=(
            "The reply shown to the user. Be a helpful critic and idea partner, not a yes-man. "
            "Evaluate technology-stack fit: if React Native/Expo is wrong for a web-first "
            "product, say so and recommend Next.js + Express + NextAuth + Python/FastAPI (or "
            "whatever fits); keep user-stated stack and add recommendation. "
            "NEW_PROJECT / CONTINUE_PROJECT → acknowledge, push back on weak budget/tags/scope/"
            "mismatched stack, propose 2–3 project-specific ideas, summarize, ask ≤3 follow-ups "
            "if needed. "
            "PROJECT_QUERY → answer from context; honest judgment on budgets/tags/stack. "
            "REPORT_REQUEST → confirm generation (User-stated vs Recommendation for stack/budget). "
            "needs_clarification=True → numbered list of ≤3 targeted questions."
        ),
    )
    reasoning_summary:       str           = Field(..., description="Internal reasoning trace — not shown to user.")
    confidence:              float         = Field(..., ge=0.0, le=1.0, description="Confidence in the extraction, 0.0–1.0.")

    @field_validator("confidence", mode="before")
    @classmethod
    def normalize_confidence(cls, v: Any) -> float:
        if isinstance(v, (int, float)):
            return float(v) / 100.0 if float(v) > 1.0 else float(v)
        try:
            val = float(v)
            return val / 100.0 if val > 1.0 else val
        except (ValueError, TypeError):
            return 0.0

    @field_validator("clarification_questions", mode="before")
    @classmethod
    def cap_questions(cls, v: Any) -> list:
        """Enforce the ≤3 clarification questions hard limit."""
        if isinstance(v, list):
            return v[:3]
        return []