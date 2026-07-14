"""
pdf.py
------
Standalone script to load, split, embed, and store document chunks in MongoDB Atlas Vector Search.

Usage:
  cd backend
  uv run python -m app.agent.rag.loaders.pdf [/path/to/doc.pdf]
"""

from __future__ import annotations

import os
import sys
import time

# Allow `python app/agent/rag/loaders/pdf.py` as well as module invocation
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../..")))

from langchain_community.document_loaders import PyMuPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.agent.rag.vector_store import get_vector_store, init_vector_search_index, reset_vector_store_cache


def run_rag_indexing(filepath: str | None = None) -> None:
    filepath = (
        filepath
        or os.getenv("RAG_PDF_PATH")
        or os.path.join(
            os.path.dirname(__file__),
            "..",
            "..",
            "..",
            "..",
            "NextJS Ebook.pdf",
        )
    )
    filepath = os.path.abspath(filepath)

    if not os.path.exists(filepath):
        print(f"Error: PDF document not found at: {filepath}")
        print("Pass a path: python -m app.agent.rag.loaders.pdf /path/to/file.pdf")
        return

    print(f"\n[1/5] Loading document: {filepath} ...")
    loader = PyMuPDFLoader(file_path=filepath)
    documents = loader.load()
    print(f"Successfully loaded {len(documents)} pages.")

    print("\n[2/5] Splitting document into chunks ...")
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        add_start_index=True,
    )
    chunks = text_splitter.split_documents(documents)
    print(f"Split into {len(chunks)} chunks.")

    print("\n[3/5] Checking and initializing Vector Search Index ...")
    init_vector_search_index()
    reset_vector_store_cache()

    print("\n[4/5] Generating embeddings and storing documents ...")
    vector_store = get_vector_store()

    print("Purging existing documents in RAG collection to start clean...")
    vector_store.collection.delete_many({})

    batch_size = 25
    total_chunks = len(chunks)

    for i in range(0, total_chunks, batch_size):
        batch = chunks[i : i + batch_size]
        batch_num = i // batch_size + 1
        total_batches = (total_chunks - 1) // batch_size + 1

        print(f"Embedding and storing batch {batch_num}/{total_batches} ({len(batch)} chunks)...")
        vector_store.add_documents(batch)

        if i + batch_size < total_chunks:
            print("Sleeping for 10 seconds to respect API rate limits...")
            time.sleep(10)

    print("All chunks successfully embedded and stored!")

    print("\n[5/5] Running verification query on the vector store...")
    query = "What is Server Components?"
    print(f"Searching for: '{query}'")

    try:
        results = vector_store.similarity_search(query, k=2)
        if not results:
            print(
                "Warning: No matching documents returned. "
                "(New Atlas indexes can take a few minutes to become queryable.)"
            )
        for i, doc in enumerate(results):
            print(f"\nMatch {i + 1} (Page {doc.metadata.get('page', 'Unknown')}):")
            print(doc.page_content[:300] + "...")
    except Exception as e:
        print(f"Error during similarity search: {e}")


if __name__ == "__main__":
    cli_path = sys.argv[1] if len(sys.argv) > 1 else None
    run_rag_indexing(cli_path)
