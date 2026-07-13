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

    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "mistral:latest"


@lru_cache
def get_settings() -> Settings:
    return Settings()
