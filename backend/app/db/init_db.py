from app.db.mongodb import get_database


async def init_indexes() -> None:
    """Create all MongoDB indexes for the planify database."""
    db = get_database()

    # ── Auth collections (managed by NextAuth, indexes ensured here) ──
    await db.users.create_index("email", unique=True)

    # ── Projects ──────────────────────────────────────────────────────
    await db.projects.create_index([("organization_id", 1), ("created_at", -1)])
    await db.projects.create_index([("owner_id", 1)])

    # ── Chat ──────────────────────────────────────────────────────────
    await db.chat_messages.create_index([("chat_session_id", 1), ("created_at", 1)])
    await db.chat_messages.create_index([("project_id", 1)])

    # ── AI Workflow ───────────────────────────────────────────────────
    await db.ai_workflow_runs.create_index([("project_id", 1), ("created_at", -1)])

    # ── Checkpoints ───────────────────────────────────────────────────
    await db.checkpoints.create_index([("thread_id", 1), ("checkpoint_ns", 1), ("checkpoint_id", -1)])
    await db.pending_writes.create_index([("thread_id", 1), ("checkpoint_ns", 1)])

    # ── Members (unique per org + user) ───────────────────────────────
    await db.members.create_index([("organization_id", 1), ("user_id", 1)], unique=True)

    # ── Reports (unique per project + type) ───────────────────────────
    await db.generated_reports.create_index(
        [("project_id", 1), ("report_type", 1)], unique=True
    )

    print("✅ MongoDB indexes created successfully.")
