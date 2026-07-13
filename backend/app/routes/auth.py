"""Auth routes."""

from __future__ import annotations

from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Request

from app.db.mongodb import get_database

router = APIRouter(prefix="/auth", tags=["Auth"])
UTC = timezone.utc


@router.post("/signup/complete", summary="Finish first-time sign-up")
async def complete_signup(request: Request) -> dict:
    user = request.state.user
    db = get_database()

    existing_org = await db.organizations.find_one(
        {"owner_id": ObjectId(user["user_id"]), "type": "personal"}
    )
    if existing_org:
        return {
            "organization_id": str(existing_org["_id"]),
            "created": False,
            "message": "Personal workspace already exists",
        }

    now = datetime.now(UTC)
    org_result = await db.organizations.insert_one(
        {
            "name": f"{user.get('email', 'My')} Workspace",
            "owner_id": ObjectId(user["user_id"]),
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
            "user_id": ObjectId(user["user_id"]),
            "role": "OWNER",
            "invited_by": ObjectId(user["user_id"]),
            "joined_at": now,
            "status": "active",
        }
    )

    return {
        "organization_id": str(org_id),
        "created": True,
        "message": "Personal workspace created",
    }
