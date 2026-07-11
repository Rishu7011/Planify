# API Reference

This document outlines the API endpoints exposed by the FastAPI backend.

## Base URL
- Local Development: `http://localhost:8000`

## Authentication
Every endpoint (except `/health` and documentation routes `/docs`, `/openapi.json`, `/redoc`) is protected. 
You must attach a bearer JWT token in the HTTP Authorization header:
```http
Authorization: Bearer <your_jwt_token>
```
*Note: The backend validates this token against the shared `JWT_SECRET` (matching NextAuth's `NEXTAUTH_SECRET`).*

---

## Endpoints

### 1. Health check

#### `GET /health`
Verify that the service is running and database connectivity is functional.

- **Access**: Public
- **Response `200 OK`**:
  ```json
  {
    "status": "ok",
    "service": "planify-backend",
    "version": "0.1.0"
  }
  ```

---

## Error Codes & Responses

### Unauthenticated Request
Returned when the `Authorization` header is missing, malformed, or has an invalid/expired token.

- **Status**: `401 Unauthorized`
- **Response**:
  ```json
  {
    "detail": "Missing Authorization header."
  }
  ```

### Server Secret Misconfiguration
Returned if the backend lacks a properly configured `JWT_SECRET` value.

- **Status**: `500 Internal Server Error`
- **Response**:
  ```json
  {
    "detail": "JWT_SECRET not configured on server."
  }
  ```
