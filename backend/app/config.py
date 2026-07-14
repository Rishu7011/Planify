"""Application configuration via environment variables."""

from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "Planify API"
    app_version: str = "0.1.0"
    environment: str = "development"
    debug: bool = False

    frontend_url: str = "http://localhost:3000"
    jwt_secret: str = ""
    jwt_algorithm: str = "HS256"

    mongodb_uri: str = "mongodb://localhost:27017"
    mongodb_db: str = "planify"

    google_api_key: str = ""
    mistral_api_key: str = ""
    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"
    llm_provider: str = "groq"  # groq | ollama | gemini | mistral

    # RAG (MongoDB Atlas Vector Search) — soft-fail when unavailable
    rag_enabled: bool = True
    rag_top_k: int = 4
    rag_collection: str = "rag_knowledge"
    rag_index_name: str = "vector_index"

    # Chat file uploads
    upload_dir: str = "uploads"
    max_upload_bytes: int = 10 * 1024 * 1024  # 10 MB
    max_files_per_message: int = 5


@lru_cache
def get_settings() -> Settings:
    return Settings()
