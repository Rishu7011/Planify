"""JWT authentication middleware."""

from __future__ import annotations

import jwt
from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse

from app.config import get_settings

ALWAYS_PUBLIC = frozenset({"/health"})
DEV_DOCS_ROUTES = frozenset({"/docs", "/openapi.json", "/redoc"})


def _is_public_path(path: str) -> bool:
    if path in ALWAYS_PUBLIC:
        return True
    settings = get_settings()
    if settings.environment.lower() != "production" and path in DEV_DOCS_ROUTES:
        return True
    return False


async def verify_jwt(token: str) -> dict:
    settings = get_settings()
    if not settings.jwt_secret:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="JWT_SECRET not configured on server.",
        )
    try:
        claims = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
        )
    except jwt.PyJWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        ) from exc

    if not claims.get("sub"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: missing subject",
        )
    return claims


async def get_current_user(request: Request) -> dict:
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header.",
        )

    parts = auth_header.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header must be: Bearer <token>",
        )

    claims = await verify_jwt(parts[1])
    return {
        "user_id": claims.get("sub"),
        "email": claims.get("email"),
        "name": claims.get("name"),
    }


async def auth_middleware(request: Request, call_next):
    if _is_public_path(request.url.path) or request.method == "OPTIONS":
        return await call_next(request)

    try:
        request.state.user = await get_current_user(request)
    except HTTPException as exc:
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})

    return await call_next(request)
