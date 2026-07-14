"""
vector_store.py
---------------
MongoDB Atlas Vector Search for Planify's RAG system.

Uses a process-wide MongoClient singleton to avoid connection leaks.
"""

from __future__ import annotations

import logging
from typing import Any

from pymongo import MongoClient
from langchain_mongodb import MongoDBAtlasVectorSearch

from app.config import get_settings
from app.agent.rag.embeddings import get_embeddings

logger = logging.getLogger(__name__)

_client: MongoClient | None = None
_vector_store: MongoDBAtlasVectorSearch | None = None


def _get_client() -> MongoClient:
    global _client
    if _client is None:
        settings = get_settings()
        if not settings.mongodb_uri:
            raise RuntimeError("MONGODB_URI is not configured")
        _client = MongoClient(settings.mongodb_uri, serverSelectionTimeoutMS=5000)
    return _client


def get_vector_store() -> MongoDBAtlasVectorSearch:
    """Returns a cached MongoDBAtlasVectorSearch instance."""
    global _vector_store
    if _vector_store is None:
        settings = get_settings()
        client = _get_client()
        collection = client[settings.mongodb_db][settings.rag_collection]
        _vector_store = MongoDBAtlasVectorSearch(
            collection=collection,
            embedding=get_embeddings(),
            index_name=settings.rag_index_name,
            text_key="text",
            embedding_key="embedding",
        )
    return _vector_store


def reset_vector_store_cache() -> None:
    """Clear cached store (e.g. after embedding provider / index changes)."""
    global _vector_store
    _vector_store = None


def init_vector_search_index() -> None:
    """Creates the Atlas Vector Search index dynamically if not already present."""
    settings = get_settings()
    client = _get_client()
    db = client[settings.mongodb_db]
    col_name = settings.rag_collection
    index_name = settings.rag_index_name

    if col_name not in db.list_collection_names():
        logger.info("[rag.vector_store] Creating collection '%s'", col_name)
        db.create_collection(col_name)

    collection = db[col_name]
    embeddings = get_embeddings()
    try:
        dimensions = len(embeddings.embed_query("test"))
    except Exception as e:
        logger.warning("[rag.vector_store] Dummy embed failed (%s); defaulting dims=768", e)
        dimensions = 768

    logger.info("[rag.vector_store] Detected embedding dimensions: %s", dimensions)

    try:
        existing_indexes = list(collection.list_search_indexes())
        for idx in existing_indexes:
            if idx.get("name") != index_name:
                continue
            existing_dims = _extract_dimensions(idx)
            if existing_dims is not None and existing_dims != dimensions:
                logger.warning(
                    "[rag.vector_store] Dimension mismatch (%s vs %s); dropping index. "
                    "Re-run the PDF loader to re-embed documents.",
                    existing_dims,
                    dimensions,
                )
                try:
                    collection.drop_search_index(index_name)
                except Exception:
                    idx_id = idx.get("id")
                    if idx_id:
                        collection.drop_search_index(idx_id)
                    else:
                        raise
                break
            logger.info(
                "[rag.vector_store] Index '%s' already exists with matching dimensions",
                index_name,
            )
            return
    except Exception as e:
        logger.warning("[rag.vector_store] Could not list/check search indexes: %s", e)

    logger.info(
        "[rag.vector_store] Creating vector search index '%s' (%s dims)",
        index_name,
        dimensions,
    )
    try:
        collection.create_search_index(
            model={
                "definition": {
                    "mappings": {
                        "dynamic": True,
                        "fields": {
                            "embedding": {
                                "dimensions": dimensions,
                                "similarity": "cosine",
                                "type": "knnVector",
                            }
                        },
                    }
                },
                "name": index_name,
            }
        )
        logger.info("[rag.vector_store] Vector search index creation submitted")
    except Exception as e:
        logger.warning(
            "[rag.vector_store] Failed to create vector search index: %s "
            "(local MongoDB without Atlas Search is expected to fail here)",
            e,
        )


def _extract_dimensions(idx: dict[str, Any]) -> int | None:
    latest_def = idx.get("latestDefinition", idx.get("definition", {}))
    fields = latest_def.get("fields", [])
    if isinstance(fields, list):
        for field in fields:
            if field.get("path") == "embedding":
                return field.get("numDimensions") or field.get("dimensions")
    mappings = latest_def.get("mappings", {})
    embedding_field = mappings.get("fields", {}).get("embedding", {})
    return embedding_field.get("dimensions") or embedding_field.get("numDimensions")
