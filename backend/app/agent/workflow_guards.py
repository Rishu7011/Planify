"""
workflow_guards.py
------------------
Deterministic overrides for project_workflow LLM output.

The structured LLM is helpful but regularly:
  - forgets to set discovery_complete after enough context exists
  - mislabels "generate the PRD" as PROJECT_QUERY
  - re-asks features/challenges the user already answered

These guards normalize metadata + context before routing / persistence.
"""

from __future__ import annotations

from typing import Any

from app.agent.router import REPORT_WORKFLOWS
from app.agent.schemas import NextWorkflow, ProjectAction

# Phrase → report type (ordered: more specific first).
_REPORT_ALIASES: list[tuple[str, tuple[str, ...]]] = [
    ("TECHNICAL_ARCHITECTURE", (
        "technical architecture",
        "tech architecture",
        "architecture doc",
        "architecture document",
        "architecture report",
        "system design",
    )),
    ("MARKET_RESEARCH", ("market research", "market analysis")),
    ("COMPETITOR_ANALYSIS", ("competitor", "competitive analysis")),
    ("ROI", ("roi", "budget report", "budget analysis", "budget estimate", "cost estimate")),
    ("HR_PLANNING", ("hr plan", "hiring plan", "team plan")),
    ("RISK_ANALYSIS", ("risk analysis", "risk register")),
    ("ROADMAP", ("roadmap",)),
    ("FINAL_REPORT", ("final report", "complete report", "full report", "executive summary", "executive report")),
    ("PRD", ("prd", "product requirements", "requirements doc", "requirements document")),
]

_GENERATE_HINTS = (
    "generate",
    "generator",  # common typo: "Generator prd"
    "create",
    "write",
    "build",
    "produce",
    "make",
    "draft",
    "give me",
    "please mark",
    "discovery is enough",
    "no other blockers",
)

# Topics already covered — used to drop repeated clarification asks.
_TOPIC_KEYWORDS: list[tuple[str, tuple[str, ...]]] = [
    ("features", ("feature", "functionality", "functionalities", "mvp")),
    ("challenges", ("challenge", "hard part", "risk", "hipaa", "constraint")),
    ("problem", ("problem", "issue", "pain point", "trying to solve")),
    ("users", ("target user", "who is it for", "who are it for", "persona", "audience")),
    ("budget", ("budget", "cost", "pricing", "how much")),
    ("timeline", ("timeline", "deadline", "how long", "month", "scale")),
    ("tech", (
        "tech stack",
        "technology stack",
        "preferred technology",
        "react native",
        "framework",
        "database",
        "postgres",
        "native language",
        "programming language",
    )),
]

# Never block discovery / reports on these — the model should recommend instead.
_OPTIONAL_TOPICS = frozenset({"budget", "timeline", "tech"})


def _nonempty_str(value: Any) -> bool:
    return isinstance(value, str) and bool(value.strip())


def _nonempty_list(value: Any) -> bool:
    return isinstance(value, list) and any(str(item).strip() for item in value)


def backfill_audience_fields(context: dict[str, Any] | None) -> dict[str, Any]:
    """Fill target_users from business_domain / industry when the LLM missed it.

    Domain-agnostic: works for SaaS, retail, edtech, logistics, etc. Models often
    put the audience (e.g. "SMBs", "students", "fleet managers") only in
    business_domain and leave target_users null — which blocked soft discovery.
    """
    ctx = dict(context or {})
    if not _nonempty_str(ctx.get("target_users")):
        for key in ("business_domain", "industry"):
            if _nonempty_str(ctx.get(key)):
                ctx["target_users"] = str(ctx[key]).strip()
                break
    return ctx


def is_discovery_complete(context: dict[str, Any] | None) -> bool:
    """True when we know enough to proceed — problem/idea + who it's for.

    Goals/features help but are optional: the model can recommend an MVP
    scope when the user only described the idea casually (or in imperfect
    language). Budget, timeline, and tech stack are NEVER required.
    """
    if not context:
        return False
    ctx = backfill_audience_fields(context)
    has_problem = _nonempty_str(ctx.get("problem_statement")) or _nonempty_str(
        ctx.get("idea")
    )
    has_users = _nonempty_str(ctx.get("target_users"))
    has_goals = _nonempty_list(ctx.get("goals"))
    # Strong complete: problem + users + goals
    if has_problem and has_users and has_goals:
        return True
    # Soft complete: clear idea + users (algorithm fills MVP features)
    if has_problem and has_users:
        return True
    # Soft complete: clear idea + goals (algorithm infers users)
    if has_problem and has_goals:
        return True
    return False


_QUESTION_MARKERS = (
    "?",
    "what ",
    "what's ",
    "whats ",
    "how ",
    "why ",
    "when ",
    "who ",
    "which ",
    "about ",
    "tell me",
    "explain",
    "discuss",
)

_CONCEPTUAL_QUESTION_INDICATORS = (
    "how to",
    "how do i",
    "how does",
    "how should",
    "what is",
    "what are",
    "what's",
    "whats",
    "why do",
    "why should",
    "why is",
    "why are",
    "explain what",
    "explain how",
    "explain why",
    "tell me about the differences",
    "tell me what",
    "tell me how",
    "tell me why",
)


def clean_user_message(user_input: str) -> str:
    """Extract only the user's actual prompt, ignoring any appended file/document content blocks."""
    if not user_input:
        return ""
    marker = "The user attached the following documents this turn."
    if marker in user_input:
        return user_input.split(marker)[0].strip()
    return user_input.strip()


def detect_requested_report(user_input: str) -> str | None:
    """Return a report type only when the user is clearly asking to generate one.

    Requires an explicit generate-verb, or a very short command-like message
    (e.g. "PRD", "roadmap please"). Conversational mentions like
    "what about our roadmap?" must NOT force report generation.
    """
    clean_input = clean_user_message(user_input)
    text = clean_input.strip().lower()
    if not text:
        return None

    # Ignore conceptual question/informational requests even if they contain generate trigger keywords
    if any(indicator in text for indicator in _CONCEPTUAL_QUESTION_INDICATORS):
        return None

    has_verb = any(hint in text for hint in _GENERATE_HINTS)
    looks_like_question = any(marker in text for marker in _QUESTION_MARKERS)
    words = text.split()

    for report_type, aliases in _REPORT_ALIASES:
        for alias in aliases:
            if alias not in text:
                continue
            if has_verb:
                return report_type
            # Short imperative / title-only: "PRD", "the roadmap", "roi please"
            if len(words) <= 5 and not looks_like_question:
                return report_type
            break
    return None


def covered_topics(context: dict[str, Any] | None, history_text: str = "") -> set[str]:
    """Topics already answered via context or prior conversation text."""
    ctx = backfill_audience_fields(context)
    covered: set[str] = set()
    if _nonempty_str(ctx.get("problem_statement")) or _nonempty_str(ctx.get("idea")):
        covered.add("problem")
    if _nonempty_str(ctx.get("target_users")):
        covered.add("users")
    if _nonempty_list(ctx.get("goals")):
        covered.add("features")
    if _nonempty_list(ctx.get("constraints")) or "hipaa" in (history_text or "").lower():
        covered.add("challenges")
    # Optional fields count as "covered" even when empty — we recommend them.
    covered |= _OPTIONAL_TOPICS
    if _nonempty_str(ctx.get("budget")):
        covered.add("budget")
    if _nonempty_str(ctx.get("timeline")):
        covered.add("timeline")
    if _nonempty_list(ctx.get("technology_stack")):
        covered.add("tech")
    return covered


def _question_topic(text: str) -> str | None:
    lower = (text or "").lower()
    for topic, keywords in _TOPIC_KEYWORDS:
        if any(k in lower for k in keywords):
            return topic
    return None


def filter_clarification_questions(
    questions: list[str],
    *,
    context: dict[str, Any] | None,
    history_text: str = "",
    drop_optional: bool = True,
) -> list[str]:
    """Drop clarification questions about topics already answered.

    Optional topics (budget / timeline / tech / scale / language) are dropped
    by default — the report generator should recommend those instead of
    blocking the user with more questions.
    """
    covered = covered_topics(context, history_text)
    if drop_optional:
        covered |= _OPTIONAL_TOPICS

    kept: list[str] = []
    for q in questions:
        text = (q or "").strip()
        if not text:
            continue
        topic_hit = _question_topic(text)
        if topic_hit and topic_hit in covered:
            continue
        kept.append(text)
    return kept[:3]


def normalize_next_workflows(
    workflows: list[Any],
    *,
    requested_report: str | None,
) -> list[str]:
    """Keep only real report workflows; prefer the user-requested type."""
    values: list[str] = []
    for wf in workflows or []:
        value = wf.value if isinstance(wf, NextWorkflow) else str(wf)
        if value and value != "NO_ACTION" and value in REPORT_WORKFLOWS:
            if value not in values:
                values.append(value)

    if requested_report:
        if requested_report in values:
            values = [requested_report] + [v for v in values if v != requested_report]
        else:
            values = [requested_report]

    return values


def apply_workflow_guards(
    *,
    user_input: str,
    merged_context: dict[str, Any],
    project_action: ProjectAction | str,
    next_workflows: list[Any],
    needs_clarification: bool,
    clarification_questions: list[str],
    discovery_complete: bool,
    assistant_response: str,
    history_text: str = "",
) -> dict[str, Any]:
    """Return normalized fields for metadata / response / context."""
    action_value = (
        project_action.value
        if isinstance(project_action, ProjectAction)
        else str(project_action)
    )

    # 0) Normalize audience fields the structured LLM often misplaces.
    merged_context = backfill_audience_fields(merged_context)

    # 1) Auto-complete discovery from accumulated context.
    auto_complete = is_discovery_complete(merged_context)
    discovery_complete = bool(discovery_complete or auto_complete or merged_context.get("discovery_complete"))
    merged_context["discovery_complete"] = discovery_complete

    # 2) Force REPORT_REQUEST when the user clearly asks for a report.
    requested = detect_requested_report(user_input)
    if requested:
        action_value = ProjectAction.REPORT_REQUEST.value

    workflows = normalize_next_workflows(next_workflows, requested_report=requested)

    # If user asked for a report and discovery is complete (or explicit request),
    # make sure the matching workflow is queued.
    if action_value == ProjectAction.REPORT_REQUEST.value and requested and not workflows:
        workflows = [requested]

    # Explicit report request should not keep asking for covered topics.
    questions = filter_clarification_questions(
        clarification_questions,
        context=merged_context,
        history_text=history_text,
    )

    if action_value == ProjectAction.REPORT_REQUEST.value and (discovery_complete or requested):
        # Never gate reports on budget / stack / scale / language.
        # If the user explicitly asked to generate, proceed even with a thin idea —
        # the report generator will recommend missing pieces as labeled assumptions.
        has_any_idea = _nonempty_str(merged_context.get("problem_statement")) or _nonempty_str(
            merged_context.get("idea")
        ) or _nonempty_list(merged_context.get("goals"))
        if not has_any_idea and not requested:
            needs_clarification = True
            workflows = []
        else:
            needs_clarification = False
            questions = []
            if not workflows and requested:
                workflows = [requested]
            discovery_complete = True
            merged_context["discovery_complete"] = True
            merged_context["missing_information"] = [
                m for m in (merged_context.get("missing_information") or [])
                if _question_topic(str(m)) not in _OPTIONAL_TOPICS
                and str(m).strip().lower()
                not in {"budget", "timeline", "technology stack", "technology_stack", "scale"}
            ]
            merged_context.pop("pending_discovery", None)

            if workflows and _is_filler_report_ack(assistant_response):
                label = (requested or workflows[0]).replace("_", " ").title()
                assistant_response = (
                    f"Generating the {label} now from your project context…"
                )

    elif discovery_complete:
        # Core discovery done — never re-ask optional fields.
        questions = filter_clarification_questions(
            questions,
            context=merged_context,
            history_text=history_text,
            drop_optional=True,
        )
        needs_clarification = bool(questions)
        if not questions:
            needs_clarification = False
            merged_context["missing_information"] = []
            merged_context.pop("pending_discovery", None)
            if _is_blocking_discovery_ask(assistant_response):
                assistant_response = _discovery_ready_reply(merged_context)

    # Even mid-discovery: never keep optional-only asks; rewrite questionnaire dumps.
    # Only promote discovery_complete when soft gates are already satisfied
    # (idea/problem + users/goals) — never on idea alone.
    if not discovery_complete:
        questions = filter_clarification_questions(
            questions,
            context=merged_context,
            history_text=history_text,
            drop_optional=True,
        )
        needs_clarification = bool(questions)
        if not questions:
            needs_clarification = False
        if _is_blocking_discovery_ask(assistant_response):
            if is_discovery_complete(merged_context):
                discovery_complete = True
                merged_context["discovery_complete"] = True
                merged_context["missing_information"] = []
                merged_context.pop("pending_discovery", None)
                needs_clarification = False
                questions = []
                assistant_response = _discovery_ready_reply(merged_context)
            elif not questions:
                # Optional-field quiz with incomplete core discovery — nudge, don't complete.
                assistant_response = (
                    "Thanks — I’ve noted what you shared. "
                    "A bit more on the core problem and who it’s for will unblock reports. "
                    "Share those whenever you’re ready, or say **generate the PRD** if you want me to fill gaps as labeled assumptions."
                )

    if not workflows:
        workflows = ["NO_ACTION"]

    return {
        "project_action": action_value,
        "next_workflows": workflows,
        "needs_clarification": needs_clarification,
        "clarification_questions": questions,
        "discovery_complete": discovery_complete,
        "assistant_response": assistant_response,
        "merged_context": merged_context,
        "requested_report": requested,
    }


def _is_blocking_discovery_ask(text: str) -> bool:
    """True when the model dumps a form of optional fields instead of coaching."""
    lower = (text or "").lower()
    if not lower:
        return False
    optional_hits = sum(
        1
        for needle in (
            "budget",
            "timeline",
            "technology stack",
            "tech stack",
            "programming language",
            "preferred technology",
        )
        if needle in lower
    )
    ask_hits = sum(
        1
        for needle in (
            "could you please provide",
            "please provide",
            "more details on",
            "to proceed",
            "need more information",
            "missing information",
        )
        if needle in lower
    )
    return optional_hits >= 2 or (optional_hits >= 1 and ask_hits >= 1)


def _discovery_ready_reply(context: dict[str, Any]) -> str:
    idea = (
        (_nonempty_str(context.get("idea")) and str(context["idea"]).strip())
        or (
            _nonempty_str(context.get("problem_statement"))
            and str(context["problem_statement"]).strip()
        )
        or "your idea"
    )
    users = (
        (_nonempty_str(context.get("target_users")) and str(context["target_users"]).strip())
        or "your described audience"
    )
    return (
        f"Got it — **{idea}** for **{users}**. "
        "That’s enough to move forward; I’ll recommend MVP scope and stack as labeled assumptions where needed. "
        "Say **generate the PRD** (or ask for startup ideas / competitors) whenever you’re ready."
    )


def _is_filler_report_ack(text: str) -> bool:
    lower = (text or "").lower()
    if len(lower) > 600:
        return False
    markers = (
        "let's proceed",
        "i'll generate",
        "i will generate",
        "generating the",
        "love to generate",
        "proceed with generating",
        "if there are any critical",
        "still need",
        "preferred technology",
        "technology stack and scale",
    )
    return any(m in lower for m in markers)
