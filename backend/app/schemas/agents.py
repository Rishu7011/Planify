"""
Pydantic schemas for all AI agent inputs and outputs.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel


# ── Input Understanding ───────────────────────────────────────────────────────

class InputUnderstandingOutput(BaseModel):
    """Output from the Input Understanding Agent."""

    domain: str
    idea_summary: str
    known_facts: List[str]
    ambiguity_flags: List[str]
    confidence: float


# ── Clarification ─────────────────────────────────────────────────────────────

class ClarificationOutput(BaseModel):
    """Output from the Clarification Agent."""

    sufficient_context: bool
    clarification_questions: Optional[List[str]] = None


# ── PRD ───────────────────────────────────────────────────────────────────────

class PRDSection(BaseModel):
    title: str
    content: str


class Persona(BaseModel):
    name: str
    role: str
    needs: List[str]
    pain_points: List[str]


class PRDOutput(BaseModel):
    """Output from the PRD Agent."""

    overview: PRDSection
    problem_statement: PRDSection
    goals: List[str]
    personas: List[Persona]
    user_stories: List[str]
    functional_requirements: List[str]
    non_functional_requirements: List[str]
    acceptance_criteria: List[str]
    success_metrics: List[str]
    mvp_definition: str
    assumptions_stated: List[str]


# ── Feasibility ───────────────────────────────────────────────────────────────

class FeasibilityOutput(BaseModel):
    """Output from the Feasibility Agent."""

    technical_approach: str
    complexity_signal: str  # low | medium | high
    key_risks: List[str]
    critical_dependencies: List[str]
    regulatory_notes: Optional[str] = None
    assumptions_stated: List[str] = []


# ── ROI ───────────────────────────────────────────────────────────────────────

class ROIScenario(BaseModel):
    name: str
    timeline_months: int
    breakeven: str
    notes: Optional[str] = None


class ROIOutput(BaseModel):
    """Output from the ROI Agent."""

    development_cost_range: str
    infrastructure_cost_estimate: str
    team_cost_estimate: str
    revenue_assumptions: List[str]
    roi_scenarios: List[ROIScenario]
    assumptions_stated: List[str]


# ── Roadmap ───────────────────────────────────────────────────────────────────

class RoadmapPhase(BaseModel):
    phase_name: str
    description: str
    duration_weeks: int
    milestones: List[str]
    deliverables: List[str]


class RoadmapOutput(BaseModel):
    """Output from the Roadmap Agent."""

    phases: List[RoadmapPhase]
    total_timeline_weeks: int
    critical_path: str
    priority_rationale: str


# ── Final Report ──────────────────────────────────────────────────────────────

class FinalReportOutput(BaseModel):
    """Output from the Final Report Agent — assembled bundle."""

    prd_version: int = 1
    feasibility_version: int = 1
    roi_version: int = 1
    roadmap_version: int = 1
    consistency_issues: List[str] = []
    status: str  # ready | review_needed
