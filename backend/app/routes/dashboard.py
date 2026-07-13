"""Dashboard routes."""

from __future__ import annotations

from bson import ObjectId
from fastapi import APIRouter, Request

from app.db.mongodb import get_database

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/stats", summary="Get dashboard KPI stats")
async def get_dashboard_stats(request: Request) -> dict:
    user = request.state.user
    db = get_database()

    member_docs = await db.members.find(
        {"user_id": ObjectId(user["user_id"]), "status": "active"}
    ).to_list(None)
    org_ids = [m["organization_id"] for m in member_docs]

    if not org_ids:
        return {
            "total_projects": 0,
            "total_reports": 0,
            "total_ai_runs": 0,
            "recent_reports": [],
        }

    projects = await db.projects.find(
        {"organization_id": {"$in": org_ids}, "status": {"$ne": "deleted"}}
    ).to_list(None)
    project_ids = [p["_id"] for p in projects]
    project_map = {str(p["_id"]): p.get("title", "Untitled") for p in projects}

    total_reports = 0
    total_ai_runs = 0
    if project_ids:
        total_reports = await db.generated_reports.count_documents(
            {"project_id": {"$in": project_ids}}
        )
        total_ai_runs = await db.ai_workflow_runs.count_documents(
            {"project_id": {"$in": project_ids}}
        )

    recent_report_docs = []
    if project_ids:
        recent_report_docs = (
            await db.generated_reports.find({"project_id": {"$in": project_ids}})
            .sort("updated_at", -1)
            .limit(5)
            .to_list(None)
        )

    return {
        "total_projects": len(projects),
        "total_reports": total_reports,
        "total_ai_runs": total_ai_runs,
        "recent_reports": [
            {
                "report_id": str(doc["_id"]),
                "project_id": str(doc["project_id"]),
                "project_title": project_map.get(str(doc["project_id"]), "Untitled"),
                "report_type": doc["report_type"],
                "version": doc.get("version_number", 1),
                "updated_at": doc["updated_at"].isoformat() if doc.get("updated_at") else None,
            }
            for doc in recent_report_docs
        ],
    }


@router.get("/runs", summary="Get recent AI workflow runs")
async def get_recent_runs(request: Request, limit: int = 10) -> list:
    user = request.state.user
    db = get_database()

    member_docs = await db.members.find(
        {"user_id": ObjectId(user["user_id"]), "status": "active"}
    ).to_list(None)
    org_ids = [m["organization_id"] for m in member_docs]
    if not org_ids:
        return []

    projects = await db.projects.find(
        {"organization_id": {"$in": org_ids}, "status": {"$ne": "deleted"}}
    ).to_list(None)
    project_ids = [p["_id"] for p in projects]
    project_map = {str(p["_id"]): p.get("title", "Untitled") for p in projects}
    if not project_ids:
        return []

    runs = (
        await db.ai_workflow_runs.find({"project_id": {"$in": project_ids}})
        .sort("created_at", -1)
        .limit(limit)
        .to_list(None)
    )

    return [
        {
            "run_id": str(r["_id"]),
            "project_id": str(r["project_id"]),
            "project_title": project_map.get(str(r["project_id"]), "Untitled"),
            "status": r.get("status", "unknown"),
            "agents_executed": r.get("agents_executed", []),
            "duration_ms": r.get("duration_ms", 0),
            "created_at": r["created_at"].isoformat() if r.get("created_at") else None,
        }
        for r in runs
    ]
