"""
LLM Provider Factory — Gemini → Mistral → Ollama fallback chain.

Usage:
    from app.agents.llm import get_llm
    llm = get_llm()
"""
from __future__ import annotations

import logging
import os
from functools import lru_cache
from dotenv import load_dotenv
load_dotenv()

from langchain_core.language_models.chat_models import BaseChatModel

logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def get_llm(temperature: float = 0.1) -> BaseChatModel:
    """
    Return the best available LLM:
      1. Google Gemini (GOOGLE_API_KEY)
      2. Mistral      (MISTRAL_API_KEY)
      3. Ollama local (always available if running)
    """

    provider = os.getenv("LLM_PROVIDER", "").lower()

    # 1. Force Ollama if requested
    if provider == "ollama":
        try:
            from langchain_ollama import ChatOllama  # type: ignore
            logger.info("LLM provider: Ollama local (llama3.2)")
            return ChatOllama(model='llama3.2', temperature=temperature)
        except Exception as exc:
            logger.warning("Ollama init failed: %s", exc)

    # 2. Try Gemini
    if provider in ("", "gemini") and os.getenv("GOOGLE_API_KEY"):
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI  # type: ignore
            logger.info("LLM provider: Google Gemini (gemini-2.0-flash)")
            return ChatGoogleGenerativeAI(
                model="gemini-2.0-flash",
                temperature=temperature,
            )
        except Exception as exc:
            logger.warning("Gemini init failed: %s", exc)

    # 3. Try Mistral
    if provider in ("", "mistral") and os.getenv("MISTRAL_API_KEY"):
        try:
            from langchain_mistralai import ChatMistralAI  # type: ignore
            logger.info("LLM provider: Mistral (mistral-large-latest)")
            return ChatMistralAI(
                model="mistral-large-latest",
                temperature=temperature,
            )
        except Exception as exc:
            logger.warning("Mistral init failed: %s", exc)

    # 4. Final Fallback to Ollama
    try:
        from langchain_ollama import ChatOllama  # type: ignore
        logger.info("LLM provider: Ollama local fallback (llama3.2)")
        return ChatOllama(model='llama3.2', temperature=temperature)
    except Exception as exc:
        raise RuntimeError(
            "No LLM provider available. Set GOOGLE_API_KEY, MISTRAL_API_KEY, or run Ollama locally."
        ) from exc
