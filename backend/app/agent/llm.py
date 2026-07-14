"""
llm.py
------
Multi-provider LLM instantiation for Planify agents.

Switch providers by setting LLM_PROVIDER in .env:
  groq    — Groq cloud (llama-3.3-70b-versatile, free tier, recommended)
  ollama  — local Ollama server (llama3.1:8b or any pulled model)
  gemini  — Google Gemini (GOOGLE_API_KEY required)
  mistral — Mistral AI (MISTRAL_API_KEY required)

Key exports
-----------
  get_base_llm()             → cached LLM instance for the active provider
  get_structured_llm(schema) → structured-output chain with retry
  ACTIVE_PROVIDER            → string name of the currently active provider
  get_provider_info()        → dict with provider + model name
"""

from __future__ import annotations

import os
from functools import lru_cache

from dotenv import load_dotenv

load_dotenv()

# ── provider config ───────────────────────────────────────────────────────────

ACTIVE_PROVIDER = os.getenv("LLM_PROVIDER", "groq").lower().strip()

# Groq
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL   = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

# Ollama
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL    = os.getenv("OLLAMA_MODEL", "llama3.1:8b")

# Gemini
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")
GEMINI_MODEL   = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

# Mistral
MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY", "")
MISTRAL_MODEL   = os.getenv("MISTRAL_MODEL", "mistral-small-latest")


def _active_model_name() -> str:
    if ACTIVE_PROVIDER == "groq":
        return GROQ_MODEL
    if ACTIVE_PROVIDER == "gemini":
        return GEMINI_MODEL
    if ACTIVE_PROVIDER == "mistral":
        return MISTRAL_MODEL
    return OLLAMA_MODEL


# ── public factories ──────────────────────────────────────────────────────────

@lru_cache(maxsize=None)
def get_base_llm(temperature: float = 0.0):
    """Returns a cached LLM instance for the configured provider."""

    if ACTIVE_PROVIDER == "groq":
        if not GROQ_API_KEY:
            raise RuntimeError(
                "LLM_PROVIDER=groq but GROQ_API_KEY is not set in .env"
            )
        from langchain_groq import ChatGroq
        print(f"[llm] Groq — model: {GROQ_MODEL}")
        return ChatGroq(
            api_key=GROQ_API_KEY,
            model=GROQ_MODEL,
            temperature=temperature,
        )

    if ACTIVE_PROVIDER == "gemini":
        if not GOOGLE_API_KEY:
            raise RuntimeError(
                "LLM_PROVIDER=gemini but GOOGLE_API_KEY is not set in .env"
            )
        from langchain_google_genai import ChatGoogleGenerativeAI
        print(f"[llm] Gemini — model: {GEMINI_MODEL}")
        return ChatGoogleGenerativeAI(
            model=GEMINI_MODEL,
            google_api_key=GOOGLE_API_KEY,
            temperature=temperature,
        )

    if ACTIVE_PROVIDER == "mistral":
        if not MISTRAL_API_KEY:
            raise RuntimeError(
                "LLM_PROVIDER=mistral but MISTRAL_API_KEY is not set in .env"
            )
        from langchain_mistralai import ChatMistralAI
        print(f"[llm] Mistral — model: {MISTRAL_MODEL}")
        return ChatMistralAI(
            api_key=MISTRAL_API_KEY,
            model=MISTRAL_MODEL,
            temperature=temperature,
        )

    # Default: ollama
    from langchain_ollama import ChatOllama
    print(f"[llm] Ollama — model: {OLLAMA_MODEL}  base_url: {OLLAMA_BASE_URL}")
    return ChatOllama(
        model=OLLAMA_MODEL,
        base_url=OLLAMA_BASE_URL,
        temperature=temperature,
    )


def get_structured_llm(schema: type, temperature: float = 0.0):
    """Returns a structured-output chain backed by the active provider.

    Wrapped with `.with_retry(stop_after_attempt=3)` to handle transient
    server hiccups automatically.
    """
    llm = get_base_llm(temperature=temperature)
    structured = llm.with_structured_output(schema)
    return structured.with_retry(stop_after_attempt=3)


def get_provider_info() -> dict:
    """Returns provider metadata for logging / health checks."""
    return {
        "provider": ACTIVE_PROVIDER,
        "model": _active_model_name(),
    }