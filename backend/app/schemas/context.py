from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class Constraint(BaseModel):
    """Resource and regulatory constraints for a project."""

    budget: Optional[str] = None
    team_size: Optional[int] = None
    timeline: Optional[str] = None
    regulatory_context: Optional[str] = None


class ProjectContext(BaseModel):
    """
    The shared context object that flows through all AI agents.
    Changing one field may trigger re-derivation of dependent artifacts.
    """

    domain: Optional[str] = None
    problem_statement: Optional[str] = None
    target_audience: Optional[str] = None
    known_facts: List[str] = Field(default_factory=list)
    constraints: Constraint = Field(default_factory=Constraint)
    ambiguity_flags: List[str] = Field(default_factory=list)
    context_version: int = 1
    last_updated: Optional[datetime] = None
    stale_agents: List[str] = Field(default_factory=list)

    model_config = {
        "json_schema_extra": {
            "example": {
                "domain": "healthcare",
                "problem_statement": "Doctors spend too much time on administrative tasks",
                "target_audience": "primary care physicians",
                "known_facts": [
                    "Team has 2 founders with healthcare and software experience",
                    "No existing customer base",
                ],
                "constraints": {
                    "budget": "$500K seed funding",
                    "team_size": 5,
                    "timeline": "12 months to MVP",
                    "regulatory_context": "HIPAA compliance required",
                },
                "ambiguity_flags": [
                    "Unclear if B2C or B2B model",
                    "Specific revenue model not defined",
                ],
                "context_version": 2,
                "stale_agents": ["roi_agent", "roadmap_agent"],
            }
        }
    }
