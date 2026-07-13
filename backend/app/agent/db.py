"""
db.py
-----
MongoDB Atlas persistence layer for Planify.

Provides:
  - get_db()               → Motor async database handle (for async contexts)
  - get_sync_db()          → PyMongo sync database handle (for sync LangGraph nodes)
  - ProjectRepository      → CRUD for project documents
  - ConversationRepository → CRUD for conversation/session documents

All collection names are constants at the top of this file.
"""

from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Any, Optional

from bson import ObjectId
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI      = os.getenv("MONGODB_URI", "")
DATABASE_NAME    = os.getenv("MONGODB_DB", "planify")

COL_PROJECTS      = "agent_project_snapshots"
COL_CONVERSATIONS = "conversations"


# ── sync client (used inside LangGraph nodes which are synchronous) ───────────

_sync_client = None
_sync_db     = None


def get_sync_db():
    """Returns a cached synchronous PyMongo database handle."""
    global _sync_client, _sync_db
    if _sync_db is None:
        from pymongo import MongoClient
        _sync_client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
        _sync_db     = _sync_client[DATABASE_NAME]
    return _sync_db


_checkpointer = None


def get_checkpointer():
    """Returns a cached MongoDBSaver checkpointer using the sync MongoClient."""
    global _checkpointer, _sync_client
    if _checkpointer is None:
        from langgraph.checkpoint.mongodb import MongoDBSaver
        # Ensure _sync_client is initialized
        get_sync_db()
        _checkpointer = MongoDBSaver(
            client=_sync_client,
            db_name=DATABASE_NAME,
            checkpoint_collection_name="checkpoints",
            writes_collection_name="checkpoint_writes"
        )
    return _checkpointer


# ── async client (for future FastAPI / async endpoints) ──────────────────────

_async_client = None
_async_db     = None


def get_db():
    """Returns a cached asynchronous Motor database handle."""
    global _async_client, _async_db
    if _async_db is None:
        from motor.motor_asyncio import AsyncIOMotorClient
        _async_client = AsyncIOMotorClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
        _async_db     = _async_client[DATABASE_NAME]
    return _async_db


# ── helpers ───────────────────────────────────────────────────────────────────

def _now() -> datetime:
    return datetime.now(tz=timezone.utc)


def _serialize(doc: dict) -> dict:
    """Converts ObjectId fields to strings for JSON-safe output."""
    out = {}
    for k, v in doc.items():
        if isinstance(v, ObjectId):
            out[k] = str(v)
        elif isinstance(v, dict):
            out[k] = _serialize(v)
        elif isinstance(v, list):
            out[k] = [_serialize(i) if isinstance(i, dict) else i for i in v]
        else:
            out[k] = v
    return out


# ── Project Repository ────────────────────────────────────────────────────────

class ProjectRepository:
    """Sync CRUD operations for the `projects` collection."""

    def __init__(self):
        self._col = get_sync_db()[COL_PROJECTS]

    # ── index setup (call once at startup) ──────────────────────────────────

    def ensure_indexes(self) -> None:
        self._col.create_index("session_id")
        self._col.create_index("project_name")
        self._col.create_index("updated_at")

    # ── create ───────────────────────────────────────────────────────────────

    def create(self, session_id: str, context: dict[str, Any]) -> str:
        """Inserts a new project document and returns its string ID."""
        doc = {
            "session_id":  session_id,
            "context":     context,
            "status":      context.get("project_status", "new"),
            "created_at":  _now(),
            "updated_at":  _now(),
        }
        result = self._col.insert_one(doc)
        return str(result.inserted_id)

    # ── read ─────────────────────────────────────────────────────────────────

    def find_by_session(self, session_id: str) -> Optional[dict]:
        """Returns the most recent project for a given session, or None."""
        doc = self._col.find_one(
            {"session_id": session_id},
            sort=[("updated_at", -1)],
        )
        return _serialize(doc) if doc else None

    def find_by_id(self, project_id: str) -> Optional[dict]:
        doc = self._col.find_one({"_id": ObjectId(project_id)})
        return _serialize(doc) if doc else None

    # ── update ───────────────────────────────────────────────────────────────

    def update_context(
        self,
        project_id: str,
        context_patch: dict[str, Any],
        status: Optional[str] = None,
    ) -> None:
        """Deep-merges `context_patch` into the stored context."""
        set_fields: dict[str, Any] = {
            f"context.{k}": v for k, v in context_patch.items() if v is not None
        }
        set_fields["updated_at"] = _now()
        if status:
            set_fields["status"] = status

        self._col.update_one(
            {"_id": ObjectId(project_id)},
            {"$set": set_fields},
        )

    def upsert_by_session(
        self,
        session_id: str,
        context: dict[str, Any],
        status: str = "active",
    ) -> str:
        """Updates the project for a session, or creates one if none exists.

        Returns the project_id (string).
        """
        existing = self.find_by_session(session_id)
        if existing:
            self.update_context(existing["_id"], context, status)
            return existing["_id"]
        return self.create(session_id, {**context, "project_status": status})


# ── Conversation Repository ───────────────────────────────────────────────────

class ConversationRepository:
    """Sync CRUD for the `conversations` collection.

    Each document represents one conversation turn / full session history.
    """

    def __init__(self):
        self._col = get_sync_db()[COL_CONVERSATIONS]

    def ensure_indexes(self) -> None:
        self._col.create_index("session_id")
        self._col.create_index("created_at")

    def append_turn(
        self,
        session_id: str,
        user_input: str,
        ai_response: str,
        metadata: dict[str, Any],
    ) -> None:
        """Appends a single turn to the session's conversation log."""
        turn = {
            "user":     user_input,
            "ai":       ai_response,
            "metadata": metadata,
            "ts":       _now(),
        }
        self._col.update_one(
            {"session_id": session_id},
            {
                "$push":        {"turns": turn},
                "$setOnInsert": {"session_id": session_id, "created_at": _now()},
                "$set":         {"updated_at": _now()},
            },
            upsert=True,
        )

    def get_session(self, session_id: str) -> Optional[dict]:
        doc = self._col.find_one({"session_id": session_id})
        return _serialize(doc) if doc else None


# ── module-level singletons ───────────────────────────────────────────────────

project_repo      = ProjectRepository()
conversation_repo = ConversationRepository()


def init_db() -> None:
    """Call once at application startup to create indexes."""
    project_repo.ensure_indexes()
    conversation_repo.ensure_indexes()
    print(f"[db] Connected to MongoDB Atlas — database: {DATABASE_NAME}")
