"""
Reports routes.

GET /api/projects/{id}/reports                    — all reports for a project
GET /api/projects/{id}/reports/{type}             — single report (prd|feasibility|roi|roadmap)
GET /api/projects/{id}/reports/{type}/versions    — version history
"""
from __future__ import annotations

from bson import ObjectId
from fastapi import APIRouter, HTTPException, Request, status

from app.db.mongodb import get_database
from app.routes.projects import _assert_project_access

router = APIRouter(prefix="/api/projects/{project_id}/reports", tags=["Reports"])

VALID_TYPES = {"prd", "feasibility", "roi", "roadmap"}


@router.get("", summary="Get all reports for a project")
async def get_all_reports(request: Request, project_id: str) -> dict:
    user = request.state.user
    db = get_database()

    await _assert_project_access(project_id, user, db)

    report_docs = await db.generated_reports.find(
        {"project_id": ObjectId(project_id)}
    ).to_list(None)

    result: dict = {}
    for doc in report_docs:
        report_type = doc["report_type"]
        # Load current version content
        version_doc = await db.report_versions.find_one(
            {"_id": doc.get("current_version_id")}
        )
        result[report_type] = {
            "report_id": str(doc["_id"]),
            "type": report_type,
            "version": doc.get("version_number", 1),
            "content": version_doc["content_snapshot"] if version_doc else None,
            "updated_at": doc["updated_at"].isoformat() if doc.get("updated_at") else None,
        }

    return result


@router.get("/{report_type}", summary="Get a single report")
async def get_report(request: Request, project_id: str, report_type: str) -> dict:
    user = request.state.user
    db = get_database()

    if report_type not in VALID_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid report type. Must be one of: {', '.join(VALID_TYPES)}",
        )

    await _assert_project_access(project_id, user, db)

    doc = await db.generated_reports.find_one(
        {"project_id": ObjectId(project_id), "report_type": report_type}
    )
    if not doc:
        return {"type": report_type, "content": None, "version": 0}

    version_doc = await db.report_versions.find_one({"_id": doc.get("current_version_id")})

    return {
        "report_id": str(doc["_id"]),
        "type": report_type,
        "version": doc.get("version_number", 1),
        "content": version_doc["content_snapshot"] if version_doc else None,
        "updated_at": doc["updated_at"].isoformat() if doc.get("updated_at") else None,
    }


@router.get("/{report_type}/versions", summary="Get version history for a report")
async def get_report_versions(request: Request, project_id: str, report_type: str) -> list:
    user = request.state.user
    db = get_database()

    if report_type not in VALID_TYPES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid report type")

    await _assert_project_access(project_id, user, db)

    versions = (
        await db.report_versions.find(
            {"project_id": ObjectId(project_id), "report_type": report_type}
        )
        .sort("version_number", -1)
        .to_list(None)
    )

    return [
        {
            "version_id": str(v["_id"]),
            "version_number": v["version_number"],
            "change_reason": v.get("change_reason", ""),
            "created_by": v.get("created_by", ""),
            "edit_source": v.get("edit_source", "ai"),
            "created_at": v["created_at"].isoformat(),
        }
        for v in versions
    ]
