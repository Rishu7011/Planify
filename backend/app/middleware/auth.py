import os
import jwt
from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse

ALGORITHM = "HS256"
# Must match NEXTAUTH_SECRET in frontend/.env.local exactly
JWT_SECRET = os.getenv("JWT_SECRET", "")

# Routes that do NOT require authentication
PUBLIC_ROUTES = {"/health", "/docs", "/openapi.json", "/redoc"}


async def verify_jwt(token: str) -> dict:
    """Verify HS256 JWT signature and return decoded claims."""
    if not JWT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="JWT_SECRET not configured on server.",
        )
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired.",
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}",
        )


async def get_current_user(request: Request) -> dict:
    """Extract bearer token from Authorization header and return verified user claims."""
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

    token = parts[1]
    claims = await verify_jwt(token)

    return {
        "user_id": claims.get("sub"),
        "email": claims.get("email"),
        "name": claims.get("name"),
    }


async def auth_middleware(request: Request, call_next):
    """Global HTTP middleware — verifies JWT on all non-public routes."""
    if request.url.path in PUBLIC_ROUTES or request.method == "OPTIONS":
        return await call_next(request)

    try:
        user = await get_current_user(request)
        request.state.user = user
    except HTTPException as exc:
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
        )

    return await call_next(request)
