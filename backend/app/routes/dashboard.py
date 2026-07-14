"""Dashboard routes."""

from __future__ import annotations

from fastapi import APIRouter, Request

from app.db.mongodb import get_database
from app.utils.objectid import parse_object_id

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/stats", summary="Get dashboard KPI stats")
async def get_dashboard_stats(request: Request) -> dict:
    user = request.state.user
    db = get_database()
    user_id = parse_object_id(user.get("user_id"), field="user_id")

    member_docs = await db.members.find(
        {"user_id": user_id, "status": "active"}
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


@router.get("/assets", summary="List generated report assets across all projects")
async def list_dashboard_assets(request: Request, limit: int = 100) -> list:
    """Artifact library: every generated report the user can access."""
    user = request.state.user
    db = get_database()
    user_id = parse_object_id(user.get("user_id"), field="user_id")

    member_docs = await db.members.find(
        {"user_id": user_id, "status": "active"}
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

    docs = (
        await db.generated_reports.find({"project_id": {"$in": project_ids}})
        .sort("updated_at", -1)
        .limit(max(1, min(limit, 200)))
        .to_list(None)
    )

    assets: list[dict] = []
    for doc in docs:
        pid = str(doc["project_id"])
        report_type = str(doc.get("report_type") or "report")
        created = doc.get("created_at") or doc.get("updated_at")
        assets.append(
            {
                "asset_id": str(doc["_id"]),
                "kind": "report",
                "report_type": report_type,
                "title": report_type.replace("_", " ").title(),
                "project_id": pid,
                "project_title": project_map.get(pid, "Untitled"),
                "version": doc.get("version_number", 1),
                "updated_at": doc["updated_at"].isoformat() if doc.get("updated_at") else None,
                "created_at": created.isoformat() if created else None,
            }
        )
    return assets


@router.get("/runs", summary="Get recent AI workflow runs")
async def get_recent_runs(request: Request, limit: int = 10) -> list:
    user = request.state.user
    db = get_database()
    user_id = parse_object_id(user.get("user_id"), field="user_id")

    member_docs = await db.members.find(
        {"user_id": user_id, "status": "active"}
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
        .limit(max(1, min(limit, 50)))
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
