"""Project file upload routes."""

from __future__ import annotations

from fastapi import APIRouter, File, HTTPException, Request, UploadFile, status
from fastapi.responses import FileResponse

from app.db.mongodb import get_database
from app.routes.projects import _assert_project_access
from app.services.file_service import save_upload, serialize_file_meta
from app.utils.objectid import parse_object_id
from pathlib import Path

router = APIRouter(prefix="/api/projects/{project_id}/files", tags=["Files"])


@router.post("", status_code=status.HTTP_201_CREATED, summary="Upload a file to the project")
async def upload_project_file(
    request: Request,
    project_id: str,
    file: UploadFile = File(...),
) -> dict:
    user = request.state.user
    db = get_database()
    await _assert_project_access(project_id, user, db)
    user_id = parse_object_id(user.get("user_id"), field="user_id")

    try:
        meta = await save_upload(
            db=db,
            project_id=project_id,
            user_id=user_id,
            upload=file,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to store uploaded file",
        ) from exc

    return meta


@router.get("", summary="List uploaded files for a project")
async def list_project_files(request: Request, project_id: str) -> list:
    user = request.state.user
    db = get_database()
    await _assert_project_access(project_id, user, db)
    project_oid = parse_object_id(project_id, field="project_id")

    docs = (
        await db.project_files.find({"project_id": project_oid})
        .sort("created_at", -1)
        .to_list(100)
    )
    return [serialize_file_meta(d) for d in docs]


@router.get("/{file_id}", summary="Download an uploaded file")
async def download_project_file(request: Request, project_id: str, file_id: str):
    user = request.state.user
    db = get_database()
    await _assert_project_access(project_id, user, db)

    doc = await db.project_files.find_one(
        {
            "_id": parse_object_id(file_id, field="file_id"),
            "project_id": parse_object_id(project_id, field="project_id"),
        }
    )
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")

    path = Path(doc["storage_path"])
    if not path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File missing from storage",
        )

    return FileResponse(
        path,
        media_type=doc.get("content_type") or "application/octet-stream",
        filename=doc.get("original_filename") or doc.get("filename") or "download",
    )
