"""Planify FastAPI application entry point."""

from __future__ import annotations

from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from app.agent.db import init_db as init_agent_db
from app.config import get_settings
from app.db.init_db import init_indexes
from app.db.mongodb import close_mongo_connection, connect_to_mongo
from app.logging_config import setup_logging
from app.middleware.auth import auth_middleware
from app.routes.auth import router as auth_router
from app.routes.chat import router as chat_router
from app.routes.dashboard import router as dashboard_router
from app.routes.export import router as export_router
from app.routes.files import router as files_router
from app.routes.projects import router as projects_router
from app.routes.reports import router as reports_router

logger = setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    logger.info("Starting %s (%s)", settings.app_name, settings.environment)
    await connect_to_mongo()
    await init_indexes()
    init_agent_db()
    yield
    await close_mongo_connection()
    logger.info("Planify backend shut down")


def create_app() -> FastAPI:
    settings = get_settings()
    is_prod = settings.environment.lower() == "production"
    application = FastAPI(
        title=settings.app_name,
        description="AI Project Intelligence Platform — Backend API",
        version=settings.app_version,
        lifespan=lifespan,
        docs_url=None if is_prod else "/docs",
        redoc_url=None if is_prod else "/redoc",
        openapi_url=None if is_prod else "/openapi.json",
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=[
            settings.frontend_url,
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ],
        allow_origin_regex="https://.*\\.vercel\\.app",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    application.middleware("http")(auth_middleware)

    application.include_router(auth_router)
    application.include_router(projects_router)
    application.include_router(chat_router)
    application.include_router(files_router)
    application.include_router(reports_router)
    application.include_router(export_router)
    application.include_router(dashboard_router)

    @application.get("/health", tags=["Health"])
    async def health_check() -> dict:
        return {
            "status": "ok",
            "service": "planify-backend",
            "version": settings.app_version,
            "environment": settings.environment,
        }

    return application


app = create_app()
