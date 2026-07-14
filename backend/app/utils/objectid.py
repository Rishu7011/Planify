"""ObjectId parsing helpers — return 400 instead of raw InvalidId 500s."""

from __future__ import annotations

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException, status


def parse_object_id(value: str | None, *, field: str = "id") -> ObjectId:
    if value is None or (isinstance(value, str) and not value.strip()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid {field}",
        )
    try:
        if not ObjectId.is_valid(value):
            raise InvalidId(value)
        return ObjectId(value)
    except InvalidId as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid {field}",
        ) from exc
