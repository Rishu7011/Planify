"""Auth routes."""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Request, status
from pydantic import BaseModel, Field

from app.db.mongodb import get_database
from app.utils.objectid import parse_object_id

router = APIRouter(prefix="/auth", tags=["Auth"])
UTC = timezone.utc


class UpdateWorkspaceRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=80)


@router.get("/me", summary="Current user + personal workspace profile")
async def get_me(request: Request) -> dict:
    user = request.state.user
    db = get_database()
    user_id = parse_object_id(user.get("user_id"), field="user_id")

    org = await db.organizations.find_one(
        {"owner_id": user_id, "type": "personal"}
    )
    membership = None
    if org:
        membership = await db.members.find_one(
            {
                "organization_id": org["_id"],
                "user_id": user_id,
                "status": "active",
            }
        )

    return {
        "user": {
            "id": user["user_id"],
            "email": user.get("email"),
            "name": user.get("name"),
        },
        "workspace": (
            {
                "organization_id": str(org["_id"]),
                "name": org.get("name") or "Personal Workspace",
                "plan_tier": org.get("plan_tier") or "free",
                "role": (membership or {}).get("role") or "OWNER",
                "created_at": org["created_at"].isoformat()
                if org.get("created_at")
                else None,
            }
            if org
            else None
        ),
    }


@router.patch("/workspace", summary="Update personal workspace name")
async def update_workspace(request: Request, body: UpdateWorkspaceRequest) -> dict:
    user = request.state.user
    db = get_database()
    name = body.name.strip()
    if not name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Workspace name must be 1–80 characters",
        )

    user_id = parse_object_id(user.get("user_id"), field="user_id")
    org = await db.organizations.find_one(
        {"owner_id": user_id, "type": "personal"}
    )
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Personal workspace not found",
        )

    now = datetime.now(UTC)
    await db.organizations.update_one(
        {"_id": org["_id"]},
        {"$set": {"name": name, "updated_at": now}},
    )
    return {"message": "Workspace updated", "name": name}


@router.post("/signup/complete", summary="Finish first-time sign-up")
async def complete_signup(request: Request) -> dict:
    user = request.state.user
    db = get_database()
    user_id = parse_object_id(user.get("user_id"), field="user_id")

    existing_org = await db.organizations.find_one(
        {"owner_id": user_id, "type": "personal"}
    )
    if existing_org:
        return {
            "organization_id": str(existing_org["_id"]),
            "created": False,
            "message": "Personal workspace already exists",
        }

    now = datetime.now(UTC)
    try:
        org_result = await db.organizations.insert_one(
            {
                "name": f"{user.get('email', 'My')} Workspace",
                "owner_id": user_id,
                "type": "personal",
                "plan_tier": "free",
                "settings": {},
                "created_at": now,
                "updated_at": now,
            }
        )
        org_id = org_result.inserted_id

        await db.members.insert_one(
            {
                "organization_id": org_id,
                "user_id": user_id,
                "role": "OWNER",
                "invited_by": user_id,
                "joined_at": now,
                "status": "active",
            }
        )
    except Exception:
        existing_org = await db.organizations.find_one(
            {"owner_id": user_id, "type": "personal"}
        )
        if existing_org:
            return {
                "organization_id": str(existing_org["_id"]),
                "created": False,
                "message": "Personal workspace already exists",
            }
        raise

    return {
        "organization_id": str(org_id),
        "created": True,
        "message": "Personal workspace created",
    }
