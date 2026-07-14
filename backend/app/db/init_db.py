"""MongoDB index initialization."""

from __future__ import annotations

import logging

from pymongo.errors import OperationFailure

from app.db.mongodb import get_database

logger = logging.getLogger(__name__)

# LangGraph MongoDBSaver owns checkpoint collection indexes (with unique constraints).
# Do not duplicate them here — it causes IndexKeySpecsConflict on startup.


async def _safe_create_index(collection, keys, **kwargs) -> None:
    """Create an index, ignoring conflicts with existing equivalent indexes."""
    try:
        await collection.create_index(keys, **kwargs)
    except OperationFailure as exc:
        if exc.code == 86:  # IndexKeySpecsConflict — already exists (e.g. LangGraph)
            logger.debug("Index already exists on %s: %s", collection.name, keys)
            return
        raise


async def init_indexes() -> None:
    db = get_database()

    await _safe_create_index(db.users, "email", unique=True)
    await _safe_create_index(db.projects, [("organization_id", 1), ("created_at", -1)])
    await _safe_create_index(db.projects, [("owner_id", 1)])
    await _safe_create_index(db.chat_messages, [("chat_session_id", 1), ("created_at", 1)])
    await _safe_create_index(db.chat_messages, [("project_id", 1)])
    await _safe_create_index(db.ai_workflow_runs, [("project_id", 1), ("created_at", -1)])
    await _safe_create_index(db.members, [("organization_id", 1), ("user_id", 1)], unique=True)
    # One personal workspace per owner (team orgs are not constrained).
    await _safe_create_index(
        db.organizations,
        [("owner_id", 1), ("type", 1)],
        unique=True,
        partialFilterExpression={"type": "personal"},
    )
    await _safe_create_index(
        db.generated_reports,
        [("project_id", 1), ("report_type", 1)],
        unique=True,
    )
    await _safe_create_index(db.conversations, "session_id")
    await _safe_create_index(db.agent_project_snapshots, "session_id")
    await _safe_create_index(
        db.ai_workflow_runs,
        [("project_id", 1), ("status", 1)],
    )
    await _safe_create_index(db.project_files, [("project_id", 1), ("created_at", -1)])
    await _safe_create_index(db.project_files, [("uploaded_by", 1)])
