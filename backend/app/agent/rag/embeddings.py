"""
embeddings.py
-------------
Instantiates the embedding provider (Gemini, Mistral, or Ollama) based on available API keys.
"""

from __future__ import annotations

import os
from functools import lru_cache
from langchain_core.embeddings import Embeddings
from app.config import get_settings

@lru_cache(maxsize=None)
def get_embeddings() -> Embeddings:
    """Returns the configured langchain Embeddings instance."""
    settings = get_settings()
    google_key = settings.google_api_key or os.getenv("GOOGLE_API_KEY", "")
    mistral_key = settings.mistral_api_key or os.getenv("MISTRAL_API_KEY", "")

    # Try Mistral first
    if mistral_key:
        print("[rag.embeddings] Using Mistral AI embeddings (mistral-embed)")
        from langchain_mistralai import MistralAIEmbeddings
        return MistralAIEmbeddings(
            model="mistral-embed",
            api_key=mistral_key,
        )

    # Try Google Gemini as fallback
    if google_key:
        print("[rag.embeddings] Using Google Generative AI embeddings (models/gemini-embedding-001)")
        from langchain_google_genai import GoogleGenerativeAIEmbeddings
        return GoogleGenerativeAIEmbeddings(
            model="models/gemini-embedding-001",
            google_api_key=google_key,
        )

    # Default to Ollama embeddings
    print(f"[rag.embeddings] Using Ollama embeddings (nomic-embed-text) via {settings.ollama_base_url}")
    from langchain_ollama import OllamaEmbeddings
    return OllamaEmbeddings(
        model="nomic-embed-text",
        base_url=settings.ollama_base_url,
    )
