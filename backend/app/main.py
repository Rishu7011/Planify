import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.mongodb import connect_to_mongo, close_mongo_connection
from app.db.init_db import init_indexes
from app.middleware.auth import auth_middleware
from app.logging_config import setup_logging

# ── Routes ────────────────────────────────────────────────────────────────────
from app.routes.auth import router as auth_router
from app.routes.projects import router as projects_router
from app.routes.chat import router as chat_router
from app.routes.reports import router as reports_router
from app.routes.export import router as export_router

# ── Logging & Observability ───────────────────────────────────────────────────
logger = setup_logging()

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")


# ── App Lifespan ─────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: connect to MongoDB and create indexes. Shutdown: close connection."""
    logger.info("Starting Planify backend...")
    await connect_to_mongo()
    await init_indexes()
    yield
    await close_mongo_connection()
    logger.info("Planify backend shut down.")


# ── FastAPI App ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="Planify API",
    description="AI Project Intelligence Platform — Backend API",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Auth Middleware ───────────────────────────────────────────────────────────
app.middleware("http")(auth_middleware)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth_router)
app.include_router(projects_router)
app.include_router(chat_router)
app.include_router(reports_router)
app.include_router(export_router)


# ── Health Check ────────────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
async def health_check() -> dict:
    """Public health check endpoint. Returns service status."""
    return {"status": "ok", "service": "planify-backend", "version": "0.1.0"}
