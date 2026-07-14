"""
RAG package — embeddings, MongoDB Atlas vector store, retrieval helpers.
"""

from app.agent.rag.retrieve import gather_rag_context, should_run_rag

__all__ = ["gather_rag_context", "should_run_rag"]
