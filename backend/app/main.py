import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.mongodb import connect_to_mongo, close_mongo_connection
from app.db.init_db import init_indexes
from app.middleware.auth import auth_middleware
from app.logging_config import setup_logging

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
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Auth Middleware ───────────────────────────────────────────────────────────
app.middleware("http")(auth_middleware)


# ── Health Check ────────────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
async def health_check() -> dict:
    """Public health check endpoint. Returns service status."""
    return {"status": "ok", "service": "planify-backend", "version": "0.1.0"}
