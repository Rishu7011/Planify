"""
llm.py
------
LLM instantiation — Ollama only, model: mistral:latest.

Change OLLAMA_MODEL in .env to switch models without touching code.
Change OLLAMA_BASE_URL in .env to point at a remote Ollama server.

Key exports
-----------
  get_base_llm()             → cached ChatOllama instance
  get_structured_llm(schema) → structured-output chain with retry
  ACTIVE_PROVIDER            → always 'ollama'
  get_provider_info()        → dict with provider + model name
"""

from __future__ import annotations

import os
from functools import lru_cache

from dotenv import load_dotenv

load_dotenv()

# ── config ────────────────────────────────────────────────────────────────────
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL    = os.getenv("OLLAMA_MODEL",    "mistral:latest")

ACTIVE_PROVIDER = "ollama"


def _best_ollama_model() -> str:
    """Returns the configured Ollama model name (env override or default)."""
    return OLLAMA_MODEL


# ── public factories ──────────────────────────────────────────────────────────

@lru_cache(maxsize=None)
def get_base_llm(temperature: float = 0.0):
    """Returns a cached ChatOllama instance using the best available model."""
    from langchain_ollama import ChatOllama

    model = _best_ollama_model()
    print(f"[llm] Ollama — model: {model}  base_url: {OLLAMA_BASE_URL}")
    return ChatOllama(
        model=model,
        base_url=OLLAMA_BASE_URL,
        temperature=temperature,
    )


def get_structured_llm(schema: type, temperature: float = 0.0):
    """Returns a structured-output chain backed by the best Ollama model.

    Ollama supports tool-call mode for structured output when the model
    has been pulled with a tool-capable variant (e.g. llama3.2, llama3.3).

    Wrapped with `.with_retry(stop_after_attempt=3)` to handle transient
    Ollama server hiccups automatically.
    """
    llm = get_base_llm(temperature=temperature)
    structured = llm.with_structured_output(schema)
    return structured.with_retry(stop_after_attempt=3)


def get_provider_info() -> dict:
    """Returns provider metadata for logging."""
    return {"provider": ACTIVE_PROVIDER, "model": _best_ollama_model()}