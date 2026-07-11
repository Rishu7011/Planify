from pydantic import BaseModel
from typing import List, Dict, Optional


class InputUnderstandingOutput(BaseModel):
    """Output from the Input Understanding Agent."""

    domain: str
    idea_summary: str
    known_facts: List[str]
    ambiguity_flags: List[str]
    confidence: float


class ClarificationOutput(BaseModel):
    """Output from the Clarification Agent."""

    sufficient_context: bool
    clarification_questions: Optional[List[str]] = None


class PRDSection(BaseModel):
    title: str
    content: str


class PRDOutput(BaseModel):
    """Output from the PRD Agent."""

    overview: PRDSection
    problem_statement: PRDSection
    goals: List[str]
    personas: List[Dict]
    user_stories: List[str]
    functional_requirements: List[str]
    non_functional_requirements: List[str]
    acceptance_criteria: List[str]
    success_metrics: List[str]
    mvp_definition: str
    assumptions_stated: List[str]


class FeasibilityOutput(BaseModel):
    """Output from the Feasibility Agent."""

    technical_approach: str
    complexity_signal: str  # low | medium | high
    key_risks: List[str]
    critical_dependencies: List[str]
    regulatory_notes: Optional[str] = None


class ROIOutput(BaseModel):
    """Output from the ROI / Financial Agent."""

    estimated_revenue_year1: Optional[str] = None
    estimated_costs: Optional[str] = None
    break_even_timeline: Optional[str] = None
    key_assumptions: List[str] = []
    confidence: float = 0.0


class RoadmapMilestone(BaseModel):
    title: str
    duration_weeks: int
    deliverables: List[str]


class RoadmapOutput(BaseModel):
    """Output from the Roadmap Agent."""

    phases: List[RoadmapMilestone]
    total_duration_weeks: int
    critical_path_notes: Optional[str] = None
