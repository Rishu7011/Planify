"""
Auth-related routes.

POST /auth/signup/complete
    Called from the Next.js signIn callback on first login.
    Auto-creates a personal Organization and makes the user its OWNER.
"""
from __future__ import annotations

from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Request

from app.db.mongodb import get_database

router = APIRouter(prefix="/auth", tags=["Auth"])

UTC = timezone.utc


@router.post("/signup/complete", summary="Finish first-time sign-up")
async def complete_signup(request: Request) -> dict:
    """
    Auto-create a personal workspace (Organization) for a brand-new user.

    Idempotent: if the personal org already exists, returns the existing one.
    Requires a valid JWT (handled by the global auth middleware).
    """
    user = request.state.user
    db = get_database()

    # Check if personal org already exists (idempotent)
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

    # Create the personal organization
    personal_org = {
        "name": f"{user.get('email', 'My')} Workspace",
        "owner_id": ObjectId(user["user_id"]),
        "type": "personal",
        "plan_tier": "free",
        "settings": {},
        "created_at": now,
        "updated_at": now,
    }
    org_result = await db.organizations.insert_one(personal_org)
    org_id = org_result.inserted_id

    # Add owner as OWNER member
    member = {
        "organization_id": org_id,
        "user_id": ObjectId(user["user_id"]),
        "role": "OWNER",
        "invited_by": ObjectId(user["user_id"]),
        "joined_at": now,
        "status": "active",
    }
    await db.members.insert_one(member)

    return {
        "organization_id": str(org_id),
        "created": True,
        "message": "Personal workspace created",
    }
