"""
db.py
-----
MongoDB Atlas persistence layer for Planify agent nodes (sync) + checkpointer.

Uses app.config.Settings so API + agent always share the same URI/DB name.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional

from bson import ObjectId

from app.config import get_settings

COL_PROJECTS = "agent_project_snapshots"
COL_CONVERSATIONS = "conversations"


# ── sync client (used inside LangGraph nodes which are synchronous) ───────────

_sync_client = None
_sync_db = None


def get_sync_db():
    """Returns a cached synchronous PyMongo database handle."""
    global _sync_client, _sync_db
    if _sync_db is None:
        from pymongo import MongoClient

        settings = get_settings()
        if not settings.mongodb_uri:
            raise RuntimeError("MONGODB_URI is not configured")
        _sync_client = MongoClient(
            settings.mongodb_uri,
            serverSelectionTimeoutMS=5000,
        )
        _sync_db = _sync_client[settings.mongodb_db]
    return _sync_db


_checkpointer = None


def get_checkpointer():
    """Returns a cached MongoDBSaver checkpointer using the sync MongoClient."""
    global _checkpointer, _sync_client
    if _checkpointer is None:
        from langgraph.checkpoint.mongodb import MongoDBSaver

        settings = get_settings()
        get_sync_db()
        _checkpointer = MongoDBSaver(
            client=_sync_client,
            db_name=settings.mongodb_db,
            checkpoint_collection_name="checkpoints",
            writes_collection_name="checkpoint_writes",
        )
    return _checkpointer


# ── async client (for future FastAPI / async endpoints) ──────────────────────

_async_client = None
_async_db = None


def get_db():
    """Returns a cached asynchronous Motor database handle."""
    global _async_client, _async_db
    if _async_db is None:
        from motor.motor_asyncio import AsyncIOMotorClient

        settings = get_settings()
        if not settings.mongodb_uri:
            raise RuntimeError("MONGODB_URI is not configured")
        _async_client = AsyncIOMotorClient(
            settings.mongodb_uri,
            serverSelectionTimeoutMS=5000,
        )
        _async_db = _async_client[settings.mongodb_db]
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
    """Sync CRUD operations for the agent project snapshots collection."""

    def __init__(self):
        self._col = get_sync_db()[COL_PROJECTS]

    def ensure_indexes(self) -> None:
        self._col.create_index("session_id")
        self._col.create_index("project_name")
        self._col.create_index("updated_at")

    def create(self, session_id: str, context: dict[str, Any]) -> str:
        doc = {
            "session_id": session_id,
            "context": context,
            "status": context.get("project_status", "new"),
            "created_at": _now(),
            "updated_at": _now(),
        }
        result = self._col.insert_one(doc)
        return str(result.inserted_id)

    def find_by_session(self, session_id: str) -> Optional[dict]:
        doc = self._col.find_one(
            {"session_id": session_id},
            sort=[("updated_at", -1)],
        )
        return _serialize(doc) if doc else None

    def find_by_id(self, project_id: str) -> Optional[dict]:
        doc = self._col.find_one({"_id": ObjectId(project_id)})
        return _serialize(doc) if doc else None

    def update_context(
        self,
        project_id: str,
        context_patch: dict[str, Any],
        status: Optional[str] = None,
    ) -> None:
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
        existing = self.find_by_session(session_id)
        if existing:
            self.update_context(existing["_id"], context, status)
            return existing["_id"]
        return self.create(session_id, {**context, "project_status": status})


# ── Conversation Repository ───────────────────────────────────────────────────

class ConversationRepository:
    """Sync CRUD for the `conversations` collection."""

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
        turn = {
            "user": user_input,
            "ai": ai_response,
            "metadata": metadata,
            "ts": _now(),
        }
        self._col.update_one(
            {"session_id": session_id},
            {
                "$push": {"turns": turn},
                "$setOnInsert": {"session_id": session_id, "created_at": _now()},
                "$set": {"updated_at": _now()},
            },
            upsert=True,
        )

    def get_session(self, session_id: str) -> Optional[dict]:
        doc = self._col.find_one({"session_id": session_id})
        return _serialize(doc) if doc else None


# Lazy singletons — do not connect at import time
_project_repo: ProjectRepository | None = None
_conversation_repo: ConversationRepository | None = None


def get_project_repo() -> ProjectRepository:
    global _project_repo
    if _project_repo is None:
        _project_repo = ProjectRepository()
    return _project_repo


def get_conversation_repo() -> ConversationRepository:
    global _conversation_repo
    if _conversation_repo is None:
        _conversation_repo = ConversationRepository()
    return _conversation_repo


# Backwards-compatible module-level names used by nodes
class _RepoProxy:
    def __init__(self, factory):
        self._factory = factory

    def __getattr__(self, name: str):
        return getattr(self._factory(), name)


project_repo = _RepoProxy(get_project_repo)
conversation_repo = _RepoProxy(get_conversation_repo)


def init_db() -> None:
    """Call once at application startup to create indexes."""
    settings = get_settings()
    get_project_repo().ensure_indexes()
    get_conversation_repo().ensure_indexes()
    print(f"[db] Connected to MongoDB — database: {settings.mongodb_db}")
