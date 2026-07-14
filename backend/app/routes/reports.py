"""Reports routes."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request, status

from app.db.mongodb import get_database
from app.routes.projects import _assert_project_access
from app.utils.objectid import parse_object_id

router = APIRouter(prefix="/api/projects/{project_id}/reports", tags=["Reports"])

VALID_TYPES = {
    "prd",
    "feasibility",
    "roi",
    "roadmap",
    "technical_architecture",
    "market_research",
    "competitor_analysis",
    "hr_planning",
    "risk_analysis",
    "final_report",
}


def _serialize_report(doc: dict, version_doc: dict | None) -> dict:
    content = version_doc["content_snapshot"] if version_doc else None
    return {
        "report_id": str(doc["_id"]),
        "type": doc["report_type"],
        "version": doc.get("version_number", 1),
        "content": content,
        "updated_at": doc["updated_at"].isoformat() if doc.get("updated_at") else None,
    }


@router.get("", summary="Get all reports for a project")
async def get_all_reports(request: Request, project_id: str) -> dict:
    user = request.state.user
    db = get_database()
    await _assert_project_access(project_id, user, db)
    project_oid = parse_object_id(project_id, field="project_id")

    report_docs = await db.generated_reports.find(
        {"project_id": project_oid}
    ).to_list(None)

    result: dict = {}
    for doc in report_docs:
        version_doc = await db.report_versions.find_one({"_id": doc.get("current_version_id")})
        result[doc["report_type"]] = _serialize_report(doc, version_doc)
    return result


@router.get("/{report_type}", summary="Get a single report")
async def get_report(request: Request, project_id: str, report_type: str) -> dict:
    user = request.state.user
    db = get_database()

    if report_type not in VALID_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid report type. Must be one of: {', '.join(sorted(VALID_TYPES))}",
        )

    await _assert_project_access(project_id, user, db)
    doc = await db.generated_reports.find_one(
        {
            "project_id": parse_object_id(project_id, field="project_id"),
            "report_type": report_type,
        }
    )
    if not doc:
        return {"type": report_type, "content": None, "version": 0}

    version_doc = await db.report_versions.find_one({"_id": doc.get("current_version_id")})
    return _serialize_report(doc, version_doc)


@router.get("/{report_type}/versions", summary="Get version history for a report")
async def get_report_versions(request: Request, project_id: str, report_type: str) -> list:
    user = request.state.user
    db = get_database()

    if report_type not in VALID_TYPES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid report type")

    await _assert_project_access(project_id, user, db)
    versions = (
        await db.report_versions.find(
            {
                "project_id": parse_object_id(project_id, field="project_id"),
                "report_type": report_type,
            }
        )
        .sort("version_number", -1)
        .to_list(None)
    )

    return [
        {
            "version_id": str(v["_id"]),
            "version_number": v.get("version_number", 1),
            "created_at": v["created_at"].isoformat() if v.get("created_at") else None,
            "edit_source": v.get("edit_source", "ai"),
        }
        for v in versions
    ]
