"""Helpers for mapping agent project context to API responses."""

from __future__ import annotations

from typing import Any


def empty_context_object() -> dict[str, Any]:
    return {
        "project_name": None,
        "idea": None,
        "problem_statement": None,
        "goals": [],
        "target_users": None,
        "industry": None,
        "business_domain": None,
        "budget": None,
        "timeline": None,
        "technology_stack": [],
        "constraints": [],
        "assumptions": [],
        "uploaded_documents": [],
        "reports": [],
        "conversation_summary": None,
        "missing_information": [],
        "stale_outputs": [],
        "discovery_complete": False,
        "pending_discovery": None,
    }


def build_memory_items(ctx: dict[str, Any]) -> list[dict[str, str]]:
    items: list[dict[str, str]] = []

    if ctx.get("industry"):
        items.append(
            {
                "id": "industry",
                "name": "Industry",
                "detail": str(ctx["industry"]),
                "icon": "building",
                "color": "blue-400",
            }
        )
    if ctx.get("target_users"):
        items.append(
            {
                "id": "target",
                "name": "Target Users",
                "detail": str(ctx["target_users"]),
                "icon": "users",
                "color": "purple-400",
            }
        )
    if ctx.get("budget"):
        items.append(
            {
                "id": "budget",
                "name": "Budget",
                "detail": str(ctx["budget"]),
                "icon": "wallet",
                "color": "amber-400",
            }
        )
    if ctx.get("timeline"):
        items.append(
            {
                "id": "timeline",
                "name": "Timeline",
                "detail": str(ctx["timeline"]),
                "icon": "calendar",
                "color": "emerald-400",
            }
        )
    for idx, goal in enumerate(ctx.get("goals") or []):
        items.append(
            {
                "id": f"goal-{idx}",
                "name": "Goal",
                "detail": str(goal),
                "icon": "target",
                "color": "primary",
            }
        )
    for idx, tech in enumerate(ctx.get("technology_stack") or []):
        items.append(
            {
                "id": f"tech-{idx}",
                "name": "Tech",
                "detail": str(tech),
                "icon": "code",
                "color": "success",
            }
        )
    return items


def enrich_project_response(project: dict[str, Any], chat_session_id: str | None = None) -> dict[str, Any]:
    ctx = project.get("context_object") or {}
    return {
        "id": str(project["_id"]),
        "title": project["title"],
        "description": project.get("description", ""),
        "organization_id": str(project["organization_id"]),
        "status": project.get("status", "active"),
        "context": ctx,
        "chat_session_id": chat_session_id,
        "created_at": project["created_at"].isoformat(),
        "updated_at": project["updated_at"].isoformat(),
        "objective": ctx.get("problem_statement") or ctx.get("idea") or project.get("description"),
        "priority": ctx.get("priority") or ("high" if ctx.get("discovery_complete") else "medium"),
        "target": ctx.get("target_users") or ctx.get("target_audience"),
        "memory": build_memory_items(ctx),
    }
