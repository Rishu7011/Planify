"""Unit tests for deterministic workflow guards."""

from __future__ import annotations

from app.agent.schemas import ProjectAction
from app.agent.workflow_guards import (
    apply_workflow_guards,
    detect_requested_report,
    filter_clarification_questions,
    is_discovery_complete,
)


def test_discovery_complete_soft_gates():
    assert not is_discovery_complete({})
    assert not is_discovery_complete({"problem_statement": "x"})
    # Soft: idea + users is enough (budget/stack not required)
    assert is_discovery_complete(
        {"problem_statement": "x", "target_users": "y"}
    )
    assert is_discovery_complete(
        {
            "idea": "crypto trading app",
            "goals": ["live charts", "buy crypto"],
        }
    )
    assert is_discovery_complete(
        {
            "problem_statement": "chronic care tracking",
            "target_users": "patients + doctors",
            "goals": ["reminders", "vitals logging"],
        }
    )
    # LLM often dumps audience into business_domain only (any vertical)
    assert is_discovery_complete(
        {
            "idea": "marketplace for local tutors and students",
            "business_domain": "Edtech, Tutoring marketplace",
            "target_users": None,
        }
    )
    assert is_discovery_complete(
        {
            "idea": "inventory app for independent grocery stores",
            "industry": "Retail / SMB ops",
            "target_users": None,
        }
    )


def test_detect_prd_request():
    assert detect_requested_report("Generate the PRD now.") == "PRD"
    assert detect_requested_report("Generator prd for this.") == "PRD"
    assert (
        detect_requested_report(
            "Discovery is enough for now. Please mark discovery complete and generate the PRD"
        )
        == "PRD"
    )
    assert (
        detect_requested_report(
            "No other blockers. Generate the PRD now."
        )
        == "PRD"
    )
    assert (
        detect_requested_report(
            "Okay generate a technical architecture for this project also."
        )
        == "TECHNICAL_ARCHITECTURE"
    )
    # Short command form
    assert detect_requested_report("PRD") == "PRD"
    assert detect_requested_report("roadmap please") == "ROADMAP"
    # Conversational mentions must NOT force a report
    assert detect_requested_report("what about our roadmap?") is None
    assert detect_requested_report("tell me about the PRD") is None
    assert detect_requested_report("how should we think about roi?") is None
    
    # Document attachments containing report trigger keywords should NOT trigger a report
    user_msg_with_file = (
        "tell me about this pdf\n\n"
        "The user attached the following documents this turn. Use them for FILE_ANALYSIS / discovery / reports as relevant.\n\n"
        "### Uploaded file: NextJS Ebook-20-30.pdf\n"
        "Chapter 3\n"
        "Roadmap\n"
        "The Roadmap is a concise guide to web development essentials. It covers HTML, CSS, and JS."
    )
    assert detect_requested_report(user_msg_with_file) is None

    # Conceptual questions should NOT trigger a report
    assert detect_requested_report("How do I create a roadmap?") is None
    assert detect_requested_report("Explain how to write a PRD") is None
    assert detect_requested_report("What database options are there for nextjs?") is None
    assert detect_requested_report("What is React?") is None


def test_filter_drops_optional_budget_and_answered_features():
    qs = filter_clarification_questions(
        [
            "What specific features or functionalities do you envision for the app?",
            "What budget range are you targeting?",
            "What tech stack do you prefer?",
        ],
        context={
            "problem_statement": "chronic care",
            "target_users": "patients",
            "goals": ["reminders"],
            "constraints": ["HIPAA"],
        },
    )
    assert qs == []


def test_apply_guards_forces_report_without_stack_or_budget():
    ctx = {
        "problem_statement": "chronic care tracking",
        "target_users": "patients + doctors",
        "goals": ["reminders", "vitals"],
        # Intentionally no budget / timeline / technology_stack
    }
    out = apply_workflow_guards(
        user_input="Generate the PRD now.",
        merged_context=dict(ctx),
        project_action=ProjectAction.PROJECT_QUERY,
        next_workflows=["NO_ACTION"],
        needs_clarification=True,
        clarification_questions=[
            "What is your preferred technology stack and scale?",
            "What budget do you have?",
        ],
        discovery_complete=False,
        assistant_response=(
            "I'd love to generate that PRD! However, I still need details "
            "about your preferred technology stack and scale."
        ),
    )
    assert out["project_action"] == "REPORT_REQUEST"
    assert out["discovery_complete"] is True
    assert out["next_workflows"] == ["PRD"]
    assert out["needs_clarification"] is False
    assert out["clarification_questions"] == []


def test_apply_guards_stops_discovery_loop():
    ctx = {
        "problem_statement": "chronic care",
        "target_users": "patients",
        "goals": ["reminders"],
        "constraints": ["HIPAA"],
    }
    out = apply_workflow_guards(
        user_input="MVP: reminders, vitals. Challenges: HIPAA.",
        merged_context=dict(ctx),
        project_action=ProjectAction.CONTINUE_PROJECT,
        next_workflows=["NO_ACTION"],
        needs_clarification=True,
        clarification_questions=[
            "What specific features or functionalities do you envision for the app?",
            "Are there any particular challenges you're anticipating during development?",
        ],
        discovery_complete=False,
        assistant_response="Great! What features do you envision?",
    )
    assert out["discovery_complete"] is True
    assert out["needs_clarification"] is False
    assert out["clarification_questions"] == []


def test_apply_guards_rewrites_budget_questionnaire():
    ctx = {
        "idea": "A SaaS tool that helps freelancers track invoices and late payments",
        "business_domain": "Fintech / Freelance ops",
        "target_users": None,
        "goals": [],
        "missing_information": ["budget", "timeline", "technology_stack"],
    }
    out = apply_workflow_guards(
        user_input=(
            "I want to build a SaaS for freelancers to track invoices "
            "and chase late payments automatically."
        ),
        merged_context=dict(ctx),
        project_action=ProjectAction.CONTINUE_PROJECT,
        next_workflows=["NO_ACTION"],
        needs_clarification=True,
        clarification_questions=[
            "What is the problem statement?",
            "What budget do you have?",
            "What technology stack?",
        ],
        discovery_complete=False,
        assistant_response=(
            "Thank you for describing your project idea. To proceed, could you "
            "please provide more details on the problem statement, goals, target "
            "users, budget, timeline, and technology stack?"
        ),
    )
    assert out["discovery_complete"] is True
    assert out["needs_clarification"] is False
    assert out["clarification_questions"] == []
    assert "budget" not in out["assistant_response"].lower()
    assert "generate the PRD" in out["assistant_response"]
    assert out["merged_context"]["target_users"]


def test_should_run_web_search():
    from app.agent.web_search import should_run_web_search
    # Generic introductions/discussions should NOT trigger web search
    assert not should_run_web_search("I want to build a startup idea for tutoring")
    assert not should_run_web_search("hi, I have a new project idea")
    
    # PDF attachment contents should NOT trigger web search
    user_msg_with_file = (
        "tell me about this pdf\n\n"
        "The user attached the following documents this turn. Use them for FILE_ANALYSIS / discovery / reports as relevant.\n\n"
        "### Uploaded file: NextJS Ebook-20-30.pdf\n"
        "This chapter is a roadmap that discusses competitor analysis and market trends."
    )
    assert not should_run_web_search(user_msg_with_file)

    # Explicit research questions SHOULD trigger web search
    assert should_run_web_search("who are the competitors for a crypto trading app?")
    assert should_run_web_search("what is the market size of edtech in 2026?")
    assert should_run_web_search("what is the pricing model of stripe?")


if __name__ == "__main__":
    test_discovery_complete_soft_gates()
    test_detect_prd_request()
    test_filter_drops_optional_budget_and_answered_features()
    test_apply_guards_forces_report_without_stack_or_budget()
    test_apply_guards_stops_discovery_loop()
    test_apply_guards_rewrites_budget_questionnaire()
    test_should_run_web_search()
    print("All workflow_guards tests passed!")
