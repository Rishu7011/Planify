"""Project file uploads — disk storage + text extraction for agent context."""

from __future__ import annotations

import logging
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from bson import ObjectId
from fastapi import UploadFile

from app.config import get_settings

logger = logging.getLogger(__name__)
UTC = timezone.utc

ALLOWED_EXTENSIONS = {
    ".pdf",
    ".txt",
    ".md",
    ".markdown",
    ".csv",
    ".json",
    ".docx",
    ".png",
    ".jpg",
    ".jpeg",
    ".webp",
}

TEXT_EXTENSIONS = {".txt", ".md", ".markdown", ".csv", ".json"}
IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp"}

# Cap extracted text injected into the LLM context
MAX_EXTRACT_CHARS = 40_000


def _safe_filename(name: str) -> str:
    base = Path(name or "file").name
    cleaned = re.sub(r"[^\w.\- ]+", "_", base).strip(" ._")
    return (cleaned or "file")[:180]


def upload_root() -> Path:
    settings = get_settings()
    root = Path(settings.upload_dir)
    if not root.is_absolute():
        # Resolve relative to backend package parent (backend/)
        root = Path(__file__).resolve().parents[2] / root
    root.mkdir(parents=True, exist_ok=True)
    return root


def project_upload_dir(project_id: str) -> Path:
    path = upload_root() / project_id
    path.mkdir(parents=True, exist_ok=True)
    return path


def extract_text_from_bytes(filename: str, data: bytes, content_type: str | None) -> str:
    """Best-effort text extraction for agent context."""
    ext = Path(filename).suffix.lower()
    try:
        if ext in TEXT_EXTENSIONS or (content_type or "").startswith("text/"):
            return data.decode("utf-8", errors="replace")

        if ext == ".pdf":
            import fitz  # pymupdf

            parts: list[str] = []
            with fitz.open(stream=data, filetype="pdf") as doc:
                for page in doc:
                    parts.append(page.get_text("text") or "")
            return "\n".join(parts).strip()

        if ext == ".docx":
            import io
            from docx import Document

            doc = Document(io.BytesIO(data))
            return "\n".join(p.text for p in doc.paragraphs if p.text).strip()

        if ext in IMAGE_EXTENSIONS:
            return f"[Image attached: {filename}. Describe or ask about this image in your message.]"
    except Exception as exc:
        logger.warning("Text extraction failed for %s: %s", filename, exc)
        return f"[Could not extract text from {filename}]"

    return f"[Binary file attached: {filename}]"


async def save_upload(
    *,
    db,
    project_id: str,
    user_id: ObjectId,
    upload: UploadFile,
) -> dict[str, Any]:
    settings = get_settings()
    original_name = upload.filename or "upload.bin"
    safe_name = _safe_filename(original_name)
    ext = Path(safe_name).suffix.lower()

    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(
            f"Unsupported file type '{ext}'. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )

    data = await upload.read()
    if not data:
        raise ValueError("Empty file")
    if len(data) > settings.max_upload_bytes:
        mb = settings.max_upload_bytes / (1024 * 1024)
        raise ValueError(f"File exceeds the {mb:.0f} MB upload limit")

    file_id = ObjectId()
    dest = project_upload_dir(project_id) / f"{file_id}_{safe_name}"
    dest.write_bytes(data)

    extracted = extract_text_from_bytes(safe_name, data, upload.content_type)
    if len(extracted) > MAX_EXTRACT_CHARS:
        extracted = extracted[:MAX_EXTRACT_CHARS] + "\n…[truncated]"

    now = datetime.now(UTC)
    doc = {
        "_id": file_id,
        "project_id": ObjectId(project_id),
        "uploaded_by": user_id,
        "filename": safe_name,
        "original_filename": original_name,
        "content_type": upload.content_type or "application/octet-stream",
        "size_bytes": len(data),
        "storage_path": str(dest),
        "extracted_text": extracted,
        "created_at": now,
    }
    await db.project_files.insert_one(doc)

    return {
        "file_id": str(file_id),
        "filename": safe_name,
        "original_filename": original_name,
        "content_type": doc["content_type"],
        "size_bytes": len(data),
        "created_at": now.isoformat(),
        "has_text": bool(extracted.strip()),
    }


async def load_files_for_message(
    db,
    project_id: str,
    file_ids: list[ObjectId],
) -> list[dict[str, Any]]:
    if not file_ids:
        return []
    project_oid = ObjectId(project_id)
    cursor = db.project_files.find(
        {"_id": {"$in": file_ids}, "project_id": project_oid}
    )
    docs = await cursor.to_list(None)
    by_id = {d["_id"]: d for d in docs}
    ordered: list[dict[str, Any]] = []
    for fid in file_ids:
        d = by_id.get(fid)
        if not d:
            continue
        ordered.append(
            {
                "file_id": str(d["_id"]),
                "filename": d.get("filename") or d.get("original_filename"),
                "content_type": d.get("content_type"),
                "size_bytes": d.get("size_bytes", 0),
                "extracted_text": d.get("extracted_text") or "",
            }
        )
    return ordered


def format_files_for_prompt(files: list[dict[str, Any]]) -> str:
    if not files:
        return ""
    blocks: list[str] = []
    for f in files:
        name = f.get("filename") or "file"
        body = (f.get("extracted_text") or "").strip()
        if not body:
            body = "(no extractable text)"
        blocks.append(f"### Uploaded file: {name}\n{body}")
    return (
        "The user attached the following documents this turn. "
        "Use them for FILE_ANALYSIS / discovery / reports as relevant.\n\n"
        + "\n\n".join(blocks)
    )


def serialize_file_meta(d: dict[str, Any]) -> dict[str, Any]:
    return {
        "file_id": str(d["_id"]),
        "filename": d.get("filename") or d.get("original_filename"),
        "content_type": d.get("content_type"),
        "size_bytes": d.get("size_bytes", 0),
        "created_at": d["created_at"].isoformat() if d.get("created_at") else None,
    }
