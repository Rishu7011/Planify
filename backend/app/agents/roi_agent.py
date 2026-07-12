"""
ROI Agent.

Generates a realistic financial model — cost ranges, team estimates,
revenue scenarios, and break-even projections.
Always uses ranges (never false-precision single numbers).
"""
from __future__ import annotations

import json
import logging
from typing import Any, Dict

from langchain_core.prompts import ChatPromptTemplate

from app.agents.llm import get_llm
from app.schemas.agents import ROIOutput
from app.schemas.context import ProjectContext

logger = logging.getLogger(__name__)

_PROMPT = ChatPromptTemplate.from_template(
    """You are a financial analyst and startup advisor.

Create a realistic cost and revenue model for this project:

Domain: {domain}
Complexity: {complexity}
MVP Definition: {mvp}
Budget Constraint: {budget}
Team Size: {team_size}
Timeline: {timeline}

Return ONLY a valid JSON object — no markdown fences:
{{
  "development_cost_range": "$X–$Y (e.g., $80K–$150K for 3 engineers × 6 months)",
  "infrastructure_cost_estimate": "$X/month at MVP scale",
  "team_cost_estimate": "$X/month for N people (e.g., $45K/month for 3 FTEs)",
  "revenue_assumptions": [
    "Assumption about pricing model (e.g., $99/month per seat SaaS)",
    "Assumed conversion rate from trial to paid",
    "Assumed initial addressable market size"
  ],
  "roi_scenarios": [
    {{
      "name": "Bootstrapped",
      "timeline_months": 18,
      "breakeven": "Month 14 with 120 customers at $99/month",
      "notes": "Lean 2-person team, minimal infra"
    }},
    {{
      "name": "Seed-funded",
      "timeline_months": 12,
      "breakeven": "Month 10 with 200 customers",
      "notes": "$500K seed, 5-person team"
    }}
  ],
  "assumptions_stated": [
    "Assumes 3% monthly churn rate",
    "Does not account for regulatory costs (if applicable)"
  ]
}}

IMPORTANT rules:
- ALWAYS use ranges (e.g., "$80K–$150K"), never single values
- Be conservative — most projects cost more and take longer than expected
- Tailor revenue scenarios to the specific domain and business model
- State all assumptions explicitly
"""
)


def _strip_fences(text: str) -> str:
    """Strip markdown code fences from LLM output."""
    text = text.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        lines = lines[1:] if lines[0].startswith("```") else lines
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        text = "\n".join(lines).strip()
    return text


async def roi_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    """LangGraph node: generate financial model and ROI scenarios."""
    existing_outputs = state.get("agent_outputs") or {}

    if "prd" not in existing_outputs or "feasibility" not in existing_outputs:
        logger.warning("[roi_agent] Missing PRD or feasibility outputs — skipping")
        return {}

    llm = get_llm()
    prd = existing_outputs["prd"]
    feasibility = existing_outputs["feasibility"]

    raw_context = state.get("project_context")
    if isinstance(raw_context, dict):
        context = ProjectContext(**raw_context)
    elif raw_context is not None:
        context = raw_context
    else:
        context = ProjectContext()

    constraints = context.constraints
    if hasattr(constraints, "budget"):
        budget = constraints.budget or "Not specified"
        team_size = str(constraints.team_size) if constraints.team_size else "Not specified"
        timeline = constraints.timeline or "Not specified"
    elif isinstance(constraints, dict):
        budget = constraints.get("budget") or "Not specified"
        team_size = str(constraints.get("team_size", "")) or "Not specified"
        timeline = constraints.get("timeline") or "Not specified"
    else:
        budget = team_size = timeline = "Not specified"

    messages = _PROMPT.format_messages(
        domain=context.domain or "unknown",
        complexity=feasibility.get("complexity_signal", "medium"),
        mvp=prd.get("mvp_definition", "Not defined"),
        budget=budget,
        team_size=team_size,
        timeline=timeline,
    )

    logger.info("[roi_agent] Generating financial model for project %s", state.get("project_id"))
    response = await llm.ainvoke(messages)

    try:
        content = _strip_fences(response.content)
        data = json.loads(content)
        output = ROIOutput(**data)
    except Exception as exc:
        logger.error("[roi_agent] Parse failed: %s", exc)
        raise ValueError(f"ROI parse failed: {exc}") from exc

    existing_executed = state.get("agents_executed") or []

    return {
        "agent_outputs": {**existing_outputs, "roi": output.model_dump()},
        "agents_executed": [*existing_executed, "roi_agent"],
        "current_agent": "roi",
    }
