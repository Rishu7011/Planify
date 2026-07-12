"""
LLM Provider Factory — Gemini → Mistral → Ollama fallback chain.

Usage:
    from app.agents.llm import get_llm
    llm = get_llm()                     # default temperature=0.1
    llm = get_llm(temperature=0.3)      # PRD agent uses this
"""
from __future__ import annotations

import logging
import os
from typing import Dict, Tuple

from dotenv import load_dotenv

load_dotenv()

from langchain_core.language_models.chat_models import BaseChatModel  # noqa: E402

logger = logging.getLogger(__name__)

# Module-level LLM cache keyed by (provider_name, temperature).
# This avoids the @lru_cache(maxsize=1) bug where different temperature
# values share the same cached instance.
_llm_cache: Dict[Tuple[str, float], BaseChatModel] = {}


def get_llm(temperature: float = 0.1) -> BaseChatModel:
    """
    Return the best available LLM, cached per (provider, temperature):
      1. Google Gemini (GOOGLE_API_KEY)
      2. Mistral      (MISTRAL_API_KEY)
      3. Ollama local (always available if running)
    """
    provider = os.getenv("LLM_PROVIDER", "").lower()
    cache_key = (provider or "auto", temperature)

    if cache_key in _llm_cache:
        return _llm_cache[cache_key]

    llm = _build_llm(provider, temperature)
    _llm_cache[cache_key] = llm
    return llm


def _build_llm(provider: str, temperature: float) -> BaseChatModel:
    """Instantiate the LLM. Called once per (provider, temperature) combination."""

    # 1. Force Ollama if explicitly requested
    if provider == "ollama":
        try:
            from langchain_ollama import ChatOllama  # type: ignore

            model = os.getenv("OLLAMA_MODEL", "llama3.2")
            logger.info("LLM provider: Ollama local (%s)", model)
            return ChatOllama(model=model, temperature=temperature)
        except Exception as exc:
            logger.warning("Ollama init failed: %s — falling through", exc)

    # 2. Try Gemini
    if provider in ("", "gemini") and os.getenv("GOOGLE_API_KEY"):
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI  # type: ignore

            model = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
            logger.info("LLM provider: Google Gemini (%s)", model)
            return ChatGoogleGenerativeAI(
                model=model,
                temperature=temperature,
            )
        except Exception as exc:
            logger.warning("Gemini init failed: %s — falling through", exc)

    # 3. Try Mistral
    if provider in ("", "mistral") and os.getenv("MISTRAL_API_KEY"):
        try:
            from langchain_mistralai import ChatMistralAI  # type: ignore

            model = os.getenv("MISTRAL_MODEL", "mistral-large-latest")
            logger.info("LLM provider: Mistral (%s)", model)
            return ChatMistralAI(
                model=model,
                temperature=temperature,
            )
        except Exception as exc:
            logger.warning("Mistral init failed: %s — falling through", exc)

    # 4. Final fallback to Ollama
    try:
        from langchain_ollama import ChatOllama  # type: ignore

        model = os.getenv("OLLAMA_MODEL", "llama3.2")
        logger.info("LLM provider: Ollama local fallback (%s)", model)
        return ChatOllama(model=model, temperature=temperature)
    except Exception as exc:
        raise RuntimeError(
            "No LLM provider available. Set GOOGLE_API_KEY, MISTRAL_API_KEY, or run Ollama locally."
        ) from exc


def clear_llm_cache() -> None:
    """Clear the LLM instance cache. Useful for testing."""
    _llm_cache.clear()
