"""
Project CRUD routes.

POST   /api/projects             — create project + chat session
GET    /api/projects             — list projects for current user
GET    /api/projects/{id}        — get single project
PATCH  /api/projects/{id}        — update title / description
DELETE /api/projects/{id}        — soft-archive
"""
from __future__ import annotations

from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, HTTPException, Request, status

from app.db.mongodb import get_database
from app.schemas.project import CreateProjectRequest

router = APIRouter(prefix="/api/projects", tags=["Projects"])

UTC = timezone.utc


# ─── Helpers ─────────────────────────────────────────────────────────────────

async def _get_user_org_ids(user: dict, db) -> list[ObjectId]:
    """Return all org ObjectIds the user belongs to (personal + team)."""
    member_docs = await db.members.find(
        {"user_id": ObjectId(user["user_id"]), "status": "active"}
    ).to_list(None)
    org_ids = [m["organization_id"] for m in member_docs]
    return org_ids


async def _assert_project_access(project_id: str, user: dict, db) -> dict:
    """Load project and raise 403/404 if user lacks access."""
    project = await db.projects.find_one({"_id": ObjectId(project_id), "status": {"$ne": "deleted"}})
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    org_ids = await _get_user_org_ids(user, db)
    if project["organization_id"] not in org_ids:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return project


def _serialize_project(p: dict, chat_session_id: str | None = None) -> dict:
    """Convert a MongoDB project document to a JSON-serialisable dict."""
    return {
        "id": str(p["_id"]),
        "title": p["title"],
        "description": p.get("description", ""),
        "organization_id": str(p["organization_id"]),
        "status": p.get("status", "active"),
        "context": p.get("context_object"),
        "chat_session_id": chat_session_id,
        "created_at": p["created_at"].isoformat(),
        "updated_at": p["updated_at"].isoformat(),
    }


# ─── Routes ──────────────────────────────────────────────────────────────────

@router.post("", status_code=status.HTTP_201_CREATED, summary="Create a new project")
async def create_project(request: Request, body: CreateProjectRequest) -> dict:
    """
    Create a project inside the user's personal workspace (or a given org).
    Automatically creates a linked ChatSession.
    """
    user = request.state.user
    db = get_database()

    # Resolve org: use provided one (verify membership) or personal workspace
    if body.organization_id:
        org_id = ObjectId(body.organization_id)
        member = await db.members.find_one(
            {"organization_id": org_id, "user_id": ObjectId(user["user_id"]), "status": "active"}
        )
        if not member:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member of this org")
    else:
        personal_org = await db.organizations.find_one(
            {"owner_id": ObjectId(user["user_id"]), "type": "personal"}
        )
        if not personal_org:
            # Auto-create the workspace if it's missing (lazy creation fallback)
            now = datetime.now(UTC)
            org_doc = {
                "name": f"{user.get('email', 'My')} Workspace",
                "owner_id": ObjectId(user["user_id"]),
                "type": "personal",
                "plan_tier": "free",
                "settings": {},
                "created_at": now,
                "updated_at": now,
            }
            org_result = await db.organizations.insert_one(org_doc)
            org_id = org_result.inserted_id
            
            await db.members.insert_one({
                "organization_id": org_id,
                "user_id": ObjectId(user["user_id"]),
                "role": "OWNER",
                "invited_by": ObjectId(user["user_id"]),
                "joined_at": now,
                "status": "active",
            })
        else:
            org_id = personal_org["_id"]

    now = datetime.now(UTC)

    # Create project document
    project_doc = {
        "organization_id": org_id,
        "owner_id": ObjectId(user["user_id"]),
        "title": body.title,
        "description": body.description or "",
        "status": "active",
        "context_object": {
            "domain": None,
            "problem_statement": None,
            "target_audience": None,
            "known_facts": [],
            "constraints": {"budget": None, "team_size": None, "timeline": None, "regulatory_context": None},
            "ambiguity_flags": [],
            "context_version": 1,
            "last_updated": None,
            "stale_agents": [],
        },
        "created_at": now,
        "updated_at": now,
    }
    project_result = await db.projects.insert_one(project_doc)
    project_id = project_result.inserted_id

    # Auto-create chat session
    chat_doc = {
        "project_id": project_id,
        "user_id": ObjectId(user["user_id"]),
        "organization_id": org_id,
        "title": f"Chat — {body.title}",
        "status": "active",
        "metadata": {},
        "created_at": now,
        "updated_at": now,
    }
    chat_result = await db.chat_sessions.insert_one(chat_doc)

    return {
        "project_id": str(project_id),
        "chat_session_id": str(chat_result.inserted_id),
        "organization_id": str(org_id),
        "message": "Project created successfully",
    }


@router.get("", summary="List all projects for the current user")
async def list_projects(request: Request) -> list:
    user = request.state.user
    db = get_database()

    org_ids = await _get_user_org_ids(user, db)
    if not org_ids:
        return []

    projects = (
        await db.projects.find(
            {"organization_id": {"$in": org_ids}, "status": {"$ne": "deleted"}}
        )
        .sort("updated_at", -1)
        .to_list(None)
    )

    return [_serialize_project(p) for p in projects]


@router.get("/{project_id}", summary="Get a single project")
async def get_project(request: Request, project_id: str) -> dict:
    user = request.state.user
    db = get_database()

    project = await _assert_project_access(project_id, user, db)

    # Fetch linked chat session id
    chat = await db.chat_sessions.find_one({"project_id": ObjectId(project_id)})
    chat_session_id = str(chat["_id"]) if chat else None

    return _serialize_project(project, chat_session_id)


@router.patch("/{project_id}", summary="Update project title or description")
async def update_project(request: Request, project_id: str) -> dict:
    user = request.state.user
    db = get_database()

    await _assert_project_access(project_id, user, db)

    body = await request.json()
    update_fields: dict = {}
    if "title" in body:
        update_fields["title"] = body["title"]
    if "description" in body:
        update_fields["description"] = body["description"]

    if not update_fields:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update")

    update_fields["updated_at"] = datetime.now(UTC)
    await db.projects.update_one({"_id": ObjectId(project_id)}, {"$set": update_fields})

    return {"message": "Project updated"}


@router.delete("/{project_id}", summary="Soft-delete (archive) a project")
async def delete_project(request: Request, project_id: str) -> dict:
    user = request.state.user
    db = get_database()

    project = await _assert_project_access(project_id, user, db)

    # Only the owner can delete
    if str(project["owner_id"]) != user["user_id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the project owner can delete")

    await db.projects.update_one(
        {"_id": ObjectId(project_id)},
        {"$set": {"status": "deleted", "updated_at": datetime.now(UTC)}},
    )
    return {"message": "Project archived"}
