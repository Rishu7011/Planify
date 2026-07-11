# System Architecture

This document describes the high-level architecture of the AI Project Intelligence Platform.

## System Overview

```
┌─────────────────────────────────────────────┐
│     Frontend (Next.js)                      │
│     - NextAuth (Google & Email Provider)    │
│     - React + Tailwind UI                   │
│     - Session Provider Wrapper              │
└──────────────────┬──────────────────────────┘
                   │
                   │ HTTPS + HS256 JWT
                   ▼
┌─────────────────────────────────────────────┐
│     Backend (FastAPI)                       │
│     - Global HTTP Auth Middleware           │
│     - Custom Verification (HS256 Decoupled) │
│     - Async MongoDB Driver (Motor)          │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│     MongoDB (Atlas) / Database Layer        │
│     - Collection Schemas & Indexes          │
└─────────────────────────────────────────────┘
```

## Layers

### 1. Frontend Layer (Next.js)
- **Framework**: Next.js 16.x using React 19 and Tailwind CSS.
- **Authentication**: NextAuth.js. User data, verification tokens, and sessions are stored in MongoDB using the database adapter.
- **Auth Strategy**: Stateless HS256 JWT. We override the default JWE encoding with a custom HS256 signature callback using a shared secret (`NEXTAUTH_SECRET`). This allows the separate FastAPI backend to verify the token without requesting Next.js or database checks.
- **API Communication**: The client attaches the JWT to the `Authorization: Bearer <token>` header on requests to the FastAPI backend.

### 2. Backend Layer (FastAPI)
- **Framework**: FastAPI.
- **Lifecycle Management**: Lifespan context initializes and shuts down the MongoDB async connection using Motor. On startup, it ensures database indexes are set up.
- **Auth Middleware**: A custom FastAPI middleware intercepts every request (excluding public paths like `/health` and `/docs`), extracts the bearer token, verifies it against `JWT_SECRET` (which matches `NEXTAUTH_SECRET`), and attaches the decoded payload to `request.state.user`.
- **CORS**: Configured to restrict access exclusively to the frontend origin.

### 3. Database Layer (MongoDB Atlas)
- **Connectivity**: Async connection using `motor.motor_asyncio.AsyncIOMotorClient`.
- **Index Management**: Automatic indexing on startup (`users.email`, `projects.organization_id`, etc.) ensures query efficiency.
