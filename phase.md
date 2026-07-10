# AI Project Intelligence Platform — Build Guide

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Architecture Summary](#architecture-summary)
- [Complete Build Roadmap](#complete-build-roadmap)
- [Phase Details](#phase-details)
- [Quick Reference](#quick-reference)

---

## Project Overview

**AI Project Intelligence Platform** is an enterprise-grade SaaS tool that behaves like a fused team of Product Manager, Business Analyst, Solution Architect, and Strategy Consultant. Users describe their project ideas in natural language, and the system generates connected, interconnected planning artifacts (PRD, feasibility study, financial models, hiring plans, roadmaps) that stay logically consistent as assumptions change.

### Core Principles

- **Stateful**: Maintains a persistent, evolving understanding of the project across long-lived conversations.
- **Interconnected**: Every generated artifact derives from a shared context object; changing one assumption triggers re-derivation of dependent artifacts.
- **Multi-agent**: Specialized reasoning agents coordinated via LangGraph orchestration, not a single monolithic prompt.

---

## Architecture Summary

### Technology Stack

**Frontend**: Next.js + TypeScript + React + TailwindCSS  
**Backend**: FastAPI + Python + Pydantic  
**AI Orchestration**: LangGraph + LLM (Claude/GPT)  
**Database**: MongoDB (primary), Redis (caching)  
**Vector Store**: Pinecone / Weaviate (Phase 4+)  
**Auth**: NextAuth.js with JWT strategy  
**Deployment**: Docker + Kubernetes / Cloud Run  
**Infrastructure**: AWS / GCP / Azure

### System Layers

```
┌─────────────────────────────────────────────┐
│     Frontend (Next.js)                      │
│     - Auth, UI, Session Management          │
└──────────────────┬──────────────────────────┘
                   │ HTTPS + JWT
┌──────────────────┴──────────────────────────┐
│     Backend (FastAPI)                       │
│     - API, Business Logic, Auth Enforcement │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────┴──────────────────────────┐
│     LangGraph Orchestration                 │
│     - Stateful Multi-Agent Pipeline         │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────┴──────────────────────────┐
│     AI Agents (Specialized Reasoning)       │
│     - PRD, ROI, Risk, Roadmap, etc.         │
└──────────────────┬──────────────────────────┘
                   │
        ┌──────────┼──────────┐
        │          │          │
    ┌───┴──┐  ┌───┴──┐  ┌───┴──┐
    │  DB  │  │Redis │  │ Ext  │
    │(Mongo)  │Cache │  │Tools │
    └───────┘  └──────┘  └──────┘
```

---

## Complete Build Roadmap

### Timeline Overview

| Phase | Duration | Weeks | Status | Key Goal |
|-------|----------|-------|--------|----------|
| **Phase 0** | 4 weeks | 1–4 | In Progress | Foundation & Infrastructure Setup |
| **Phase 1** | 12 weeks | 5–16 | Planning | MVP Core Loop (Chat → Reports) |
| **Phase 2** | 12 weeks | 17–28 | Planning | Full Agent Suite + Collaboration |
| **Phase 3** | 12 weeks | 29–40 | Planning | Production Hardening + Features |
| **Phase 4** | 8 weeks | 41–48 | Planning | Vector Search & RAG |
| **Phase 5** | 12 weeks | 49–60 | Planning | Enterprise Features |
| **Phase 6** | 12 weeks | 61–72 | Planning | Domain Specialization |
| **Phase 7** | Ongoing | 73+ | Planning | Scale & Market Expansion |

**Total**: ~72 weeks (18 months) to full-featured platform

---

## Phase Details

---

# PHASE 0: Foundation & Setup

**Duration**: Weeks 1–4 (4 weeks)  
**Team**: 2–3 engineers  
**Goal**: Establish engineering foundation, infrastructure, and core abstractions

## Step 1: Initialize Repository & Development Environment

### 1.1 Create Monorepo Structure

```bash
ai-project-platform/
├── backend/                 # FastAPI service
│   ├── app/
│   │   ├── main.py
│   │   ├── models/          # Database models
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # Business logic
│   │   ├── agents/          # LangGraph agents
│   │   └── schemas/         # Pydantic schemas
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                # Next.js application
│   ├── app/
│   │   ├── (auth)/
│   │   ├── dashboard/
│   │   ├── projects/
│   │   ├── chat/
│   │   └── reports/
│   ├── components/
│   ├── utils/
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
├── .github/
│   └── workflows/           # CI/CD pipelines
├── docs/
│   ├── architecture.md
│   ├── schemas.md
│   └── api.md
└── README.md
```

### 1.2 Set Up Version Control & CI/CD

- Initialize Git repository
- Create GitHub organization and repositories
- Set up branch protection rules (require PR reviews before merge to main)
- Create GitHub Actions workflows for:
  - **Lint**: Run linters on every commit
  - **Test**: Run unit tests on every commit
  - **Build**: Build Docker images on PR
  - **Deploy**: Deploy to staging on merge to main

### 1.3 Environment Configuration

Create environment templates:

```bash
# .env.local (development)
DATABASE_URL=mongodb://localhost:27017/ai-platform
JWT_SECRET=dev-secret-key-change-in-production
NEXTAUTH_SECRET=dev-secret-key
NEXTAUTH_URL=http://localhost:3000
OPENAI_API_KEY=your-key-here
GOOGLE_CLIENT_ID=your-id
GOOGLE_CLIENT_SECRET=your-secret

# .env.staging
DATABASE_URL=mongodb+srv://user:pass@staging-cluster.mongodb.net/ai-platform
# ... production-like settings

# .env.production
DATABASE_URL=mongodb+srv://user:pass@prod-cluster.mongodb.net/ai-platform
# ... hardened settings
```

**Important**: Use environment-specific secret management:
- **Local dev**: `.env.local` (never commit to repo)
- **Staging/Prod**: Use cloud secret manager (AWS Secrets Manager, GCP Secret Manager, or GitHub Secrets)

### 1.4 Docker Setup

**backend/Dockerfile**:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**frontend/Dockerfile**:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "start"]
```

**docker-compose.yml** (for local development):

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:latest
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password
    volumes:
      - mongo_data:/data/db

  redis:
    image: redis:latest
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: mongodb://admin:password@mongodb:27017/ai-platform
      REDIS_URL: redis://redis:6379
    depends_on:
      - mongodb
      - redis
    volumes:
      - ./backend:/app

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:8000
    depends_on:
      - backend

volumes:
  mongo_data:
```

---

## Step 2: Database Schema & Design

### 2.1 Define MongoDB Collections

Create `docs/mongodb-schema.md`:

**Authentication Collections** (NextAuth-owned):

```json
{
  "users": {
    "_id": "ObjectId",
    "name": "string",
    "email": "string (unique)",
    "emailVerified": "Date",
    "image": "string",
    "createdAt": "Date"
  },
  "accounts": {
    "_id": "ObjectId",
    "userId": "ObjectId (ref: users)",
    "provider": "string (google, github)",
    "providerAccountId": "string",
    "access_token": "string",
    "refresh_token": "string",
    "expires_at": "number"
  },
  "sessions": {
    "_id": "ObjectId",
    "sessionToken": "string (unique)",
    "userId": "ObjectId (ref: users)",
    "expires": "Date"
  }
}
```

**Organization Collections**:

```json
{
  "organizations": {
    "_id": "ObjectId",
    "name": "string",
    "owner_id": "ObjectId (ref: users)",
    "type": "string (personal, team)",
    "plan_tier": "string (free, pro, enterprise)",
    "settings": "object",
    "created_at": "Date",
    "updated_at": "Date"
  },
  "members": {
    "_id": "ObjectId",
    "organization_id": "ObjectId (ref: organizations)",
    "user_id": "ObjectId (ref: users)",
    "role": "string (OWNER, ADMIN, MEMBER, VIEWER)",
    "invited_by": "ObjectId (ref: users)",
    "joined_at": "Date",
    "status": "string (active, invited, removed)"
  }
}
```

**Project Collections**:

```json
{
  "projects": {
    "_id": "ObjectId",
    "organization_id": "ObjectId (ref: organizations)",
    "owner_id": "ObjectId (ref: users)",
    "title": "string",
    "description": "string",
    "status": "string (active, archived)",
    "context_object": {
      "domain": "string",
      "problem_statement": "string",
      "known_facts": ["string"],
      "constraints": {
        "budget": "string",
        "team_size": "number",
        "timeline": "string",
        "regulatory_context": "string"
      },
      "ambiguity_flags": ["string"],
      "context_version": "number",
      "last_updated": "Date",
      "stale_agents": ["string"]
    },
    "created_at": "Date",
    "updated_at": "Date"
  },
  "uploaded_files": {
    "_id": "ObjectId",
    "project_id": "ObjectId (ref: projects)",
    "uploaded_by": "ObjectId (ref: users)",
    "file_type": "string (pdf, docx, png, jpeg)",
    "storage_ref": "string (S3 key or similar)",
    "file_name": "string",
    "parsed_summary": "string",
    "extracted_facts": ["string"],
    "created_at": "Date"
  }
}
```

**Chat Collections**:

```json
{
  "chat_sessions": {
    "_id": "ObjectId",
    "project_id": "ObjectId (ref: projects)",
    "user_id": "ObjectId (ref: users)",
    "organization_id": "ObjectId (ref: organizations)",
    "title": "string",
    "status": "string (active, archived)",
    "metadata": "object",
    "created_at": "Date",
    "updated_at": "Date"
  },
  "chat_messages": {
    "_id": "ObjectId",
    "chat_session_id": "ObjectId (ref: chat_sessions)",
    "project_id": "ObjectId (ref: projects)",
    "role": "string (user, assistant, system, agent)",
    "content": "string",
    "message_type": "string (text, clarification_question, agent_result, file_ref)",
    "file_refs": ["ObjectId (ref: uploaded_files)"],
    "metadata": "object",
    "created_at": "Date"
  }
}
```

**AI Workflow Collections**:

```json
{
  "ai_workflow_runs": {
    "_id": "ObjectId",
    "project_id": "ObjectId (ref: projects)",
    "triggered_by_message_id": "ObjectId (ref: chat_messages)",
    "status": "string (running, completed, failed, awaiting_clarification)",
    "agents_executed": ["string"],
    "token_usage": {
      "input_tokens": "number",
      "output_tokens": "number",
      "total_tokens": "number"
    },
    "duration_ms": "number",
    "error_details": "string",
    "created_at": "Date",
    "updated_at": "Date"
  },
  "agent_outputs": {
    "_id": "ObjectId",
    "workflow_run_id": "ObjectId (ref: ai_workflow_runs)",
    "agent_name": "string",
    "input_assumptions": "object",
    "input_assumptions_hash": "string",
    "output_payload": "object",
    "confidence_notes": "string",
    "created_at": "Date"
  }
}
```

**Report Collections**:

```json
{
  "generated_reports": {
    "_id": "ObjectId",
    "project_id": "ObjectId (ref: projects)",
    "report_type": "string (prd, feasibility, roi, hr_plan, roadmap)",
    "current_version_id": "ObjectId (ref: report_versions)",
    "updated_at": "Date"
  },
  "report_versions": {
    "_id": "ObjectId",
    "report_id": "ObjectId (ref: generated_reports)",
    "report_type": "string",
    "version_number": "number",
    "content_snapshot": "object",
    "change_reason": "string",
    "created_by": "string (agent_name or user_id)",
    "edit_source": "string (ai, human)",
    "created_at": "Date"
  },
  "prd_documents": {
    "_id": "ObjectId",
    "project_id": "ObjectId (ref: projects)",
    "sections": {
      "overview": "object",
      "personas": ["object"],
      "user_stories": ["object"],
      "functional_requirements": ["object"],
      "non_functional_requirements": ["object"],
      "acceptance_criteria": ["object"],
      "success_metrics": ["object"],
      "mvp_definition": "object"
    },
    "version": "number",
    "last_edited_by": "ObjectId (ref: users) or string (agent_name)",
    "edit_source": "string (ai, human)",
    "created_at": "Date",
    "updated_at": "Date"
  }
}
```

### 2.2 Create MongoDB Indexes

Create `backend/app/db/indexes.py`:

```python
# Pseudo-code for MongoDB indexes
# In reality, use PyMongo or MongoDB CLI

indexes = {
    "users": [
        {"keys": [("email", 1)], "unique": True},
    ],
    "projects": [
        {"keys": [("organization_id", 1), ("created_at", -1)]},
        {"keys": [("owner_id", 1)]},
    ],
    "chat_messages": [
        {"keys": [("chat_session_id", 1), ("created_at", 1)]},
        {"keys": [("project_id", 1)]},
    ],
    "ai_workflow_runs": [
        {"keys": [("project_id", 1), ("created_at", -1)]},
    ],
    "members": [
        {"keys": [("organization_id", 1), ("user_id", 1)], "unique": True},
    ],
    "generated_reports": [
        {"keys": [("project_id", 1), ("report_type", 1)], "unique": True},
    ],
}
```

---

## Step 3: Authentication Infrastructure Setup

### 3.1 NextAuth Configuration

Create `frontend/auth.ts`:

```typescript
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "./lib/mongodb";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      return session;
    },
  },
});
```

### 3.2 FastAPI JWT Verification Middleware

Create `backend/app/middleware/auth.py`:

```python
from fastapi import HTTPException, Request, status
from fastapi.security import HTTPBearer
import jwt
from functools import wraps
import os

ALGORITHM = "HS256"
SECRET_KEY = os.getenv("JWT_SECRET", "dev-secret")

async def verify_jwt(token: str) -> dict:
    """Verify JWT signature and return claims"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

async def get_current_user(request: Request) -> dict:
    """Extract and verify user from Authorization header"""
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing Authorization header")
    
    try:
        scheme, token = auth_header.split()
        if scheme.lower() != "bearer":
            raise ValueError("Invalid scheme")
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Authorization header")
    
    claims = await verify_jwt(token)
    return {
        "user_id": claims.get("sub"),
        "email": claims.get("email"),
        "org_id": claims.get("org_id"),
    }
```

Register middleware in `backend/app/main.py`:

```python
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.middleware.auth import get_current_user

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom middleware to verify JWT on every request
@app.middleware("http")
async def auth_middleware(request: Request, call_next):
    # Skip auth for public routes
    public_routes = ["/health", "/auth/callback"]
    if request.url.path in public_routes:
        return await call_next(request)
    
    try:
        user = await get_current_user(request)
        request.state.user = user
    except HTTPException as e:
        return JSONResponse(status_code=e.status_code, content={"detail": e.detail})
    
    return await call_next(request)
```

---

## Step 4: Database Initialization

### 4.1 MongoDB Connection & Setup

Create `backend/app/db/mongodb.py`:

```python
import os
from motor.motor_asyncio import AsyncClient, AsyncDatabase

MONGODB_URL = os.getenv("DATABASE_URL", "mongodb://localhost:27017")
client = None
db: AsyncDatabase = None

async def connect_to_mongo():
    global client, db
    client = AsyncClient(MONGODB_URL)
    db = client.ai_platform
    print("Connected to MongoDB")

async def close_mongo_connection():
    global client
    if client:
        client.close()
        print("Closed MongoDB connection")

def get_database() -> AsyncDatabase:
    return db
```

Initialize in `backend/app/main.py`:

```python
from contextlib import asynccontextmanager
from app.db.mongodb import connect_to_mongo, close_mongo_connection

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await connect_to_mongo()
    yield
    # Shutdown
    await close_mongo_connection()

app = FastAPI(lifespan=lifespan)
```

### 4.2 Create Collections & Indexes

Create `backend/app/db/init_db.py`:

```python
from app.db.mongodb import get_database
import asyncio

async def init_indexes():
    """Initialize MongoDB indexes"""
    db = get_database()
    
    # Users index
    await db.users.create_index("email", unique=True)
    
    # Projects index
    await db.projects.create_index([("organization_id", 1), ("created_at", -1)])
    
    # Chat messages index
    await db.chat_messages.create_index([("chat_session_id", 1), ("created_at", 1)])
    
    # Workflow runs index
    await db.ai_workflow_runs.create_index([("project_id", 1), ("created_at", -1)])
    
    # Members unique index
    await db.members.create_index([("organization_id", 1), ("user_id", 1)], unique=True)
    
    # Reports unique index
    await db.generated_reports.create_index([("project_id", 1), ("report_type", 1)], unique=True)
    
    print("Indexes created successfully")

if __name__ == "__main__":
    asyncio.run(init_indexes())
```

---

## Step 5: Schema & Contract Definitions

### 5.1 Core Context Object Schema

Create `backend/app/schemas/context.py`:

```python
from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import datetime

class Constraint(BaseModel):
    budget: Optional[str] = None
    team_size: Optional[int] = None
    timeline: Optional[str] = None
    regulatory_context: Optional[str] = None

class ProjectContext(BaseModel):
    """The shared context object that flows through all agents"""
    domain: Optional[str] = None
    problem_statement: Optional[str] = None
    target_audience: Optional[str] = None
    known_facts: List[str] = []
    constraints: Constraint = Constraint()
    ambiguity_flags: List[str] = []
    context_version: int = 1
    last_updated: Optional[datetime] = None
    stale_agents: List[str] = []
    
    class Config:
        json_schema_extra = {
            "example": {
                "domain": "healthcare",
                "problem_statement": "Doctors spend too much time on administrative tasks",
                "target_audience": "primary care physicians",
                "known_facts": [
                    "Team has 2 founders with healthcare and software experience",
                    "No existing customer base",
                ],
                "constraints": {
                    "budget": "$500K seed funding",
                    "team_size": 5,
                    "timeline": "12 months to MVP",
                    "regulatory_context": "HIPAA compliance required",
                },
                "ambiguity_flags": [
                    "Unclear if B2C or B2B model",
                    "Specific revenue model not defined",
                ],
                "context_version": 2,
                "stale_agents": ["roi_agent", "roadmap_agent"],
            }
        }
```

### 5.2 Agent Output Schemas

Create `backend/app/schemas/agents.py`:

```python
from pydantic import BaseModel
from typing import List, Dict, Optional

class InputUnderstandingOutput(BaseModel):
    """Output from Input Understanding Agent"""
    domain: str
    idea_summary: str
    known_facts: List[str]
    ambiguity_flags: List[str]
    confidence: float

class ClarificationOutput(BaseModel):
    """Output from Clarification Agent"""
    sufficient_context: bool
    clarification_questions: Optional[List[str]] = None

class PRDSection(BaseModel):
    title: str
    content: str

class PRDOutput(BaseModel):
    """Output from PRD Agent"""
    overview: PRDSection
    problem_statement: PRDSection
    goals: List[str]
    personas: List[Dict]
    user_stories: List[str]
    functional_requirements: List[str]
    non_functional_requirements: List[str]
    acceptance_criteria: List[str]
    success_metrics: List[str]
    mvp_definition: str
    assumptions_stated: List[str]

class FeasibilityOutput(BaseModel):
    """Output from Feasibility Agent"""
    technical_approach: str
    complexity_signal: str  # low, medium, high
    key_risks: List[str]
    critical_dependencies: List[str]
    regulatory_notes: Optional[str] = None

# Add more agent schemas as needed
```

### 5.3 Chat & Message Schemas

Create `backend/app/schemas/chat.py`:

```python
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ChatMessage(BaseModel):
    """Chat message schema"""
    chat_session_id: str
    project_id: str
    role: str  # user, assistant, system, agent
    content: str
    message_type: str  # text, clarification_question, agent_result, file_ref
    file_refs: List[str] = []
    metadata: Optional[Dict] = None
    created_at: datetime

class ChatSession(BaseModel):
    """Chat session schema"""
    project_id: str
    user_id: str
    organization_id: str
    title: str
    status: str  # active, archived
    metadata: Optional[Dict] = None
    created_at: datetime
    updated_at: datetime

class SendMessageRequest(BaseModel):
    """Request to send a message"""
    content: str
    file_ids: Optional[List[str]] = None

class SendMessageResponse(BaseModel):
    """Response when message is received"""
    message_id: str
    status: str  # received, processing
    workflow_run_id: Optional[str] = None
```

---

## Step 6: Logging & Observability Setup

### 6.1 Structured Logging

Create `backend/app/logging_config.py`:

```python
import logging
import json
from pythonjsonlogger import jsonlogger
import uuid

class CorrelationIdFilter(logging.Filter):
    def filter(self, record):
        if not hasattr(record, 'correlation_id'):
            record.correlation_id = str(uuid.uuid4())
        return True

def setup_logging():
    # JSON logging for production
    logHandler = logging.StreamHandler()
    formatter = jsonlogger.JsonFormatter()
    logHandler.setFormatter(formatter)
    
    logger = logging.getLogger()
    logger.addHandler(logHandler)
    logger.setLevel(logging.INFO)
    
    # Add correlation ID filter
    logger.addFilter(CorrelationIdFilter())
    
    return logger
```

### 6.2 APM & Error Tracking

Create `backend/app/monitoring.py`:

```python
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
import os

def init_sentry():
    """Initialize Sentry for error tracking"""
    sentry_sdk.init(
        dsn=os.getenv("SENTRY_DSN"),
        integrations=[
            FastApiIntegration(),
            SqlalchemyIntegration(),
        ],
        traces_sample_rate=0.1,
        environment=os.getenv("ENVIRONMENT", "development"),
    )

def init_metrics():
    """Initialize metrics collection (DataDog, Prometheus, etc.)"""
    # Implementation depends on chosen metrics provider
    pass
```

---

## Step 7: Development Best Practices Setup

### 7.1 Code Quality & Linting

Create `backend/requirements-dev.txt`:

```
black==23.3.0          # Code formatter
flake8==6.0.0          # Linter
mypy==1.0.0            # Type checker
pytest==7.3.1          # Testing
pytest-asyncio==0.21.0 # Async testing
```

Create `backend/.flake8`:

```ini
[flake8]
max-line-length = 100
exclude = .git,__pycache__,venv
ignore = E203,W503
```

Create `pyproject.toml`:

```toml
[tool.black]
line-length = 100
target-version = ['py311']

[tool.mypy]
python_version = "3.11"
warn_return_any = true
warn_unused_configs = true
disallow_untyped_defs = true
```

### 7.2 Pre-Commit Hooks

Create `.pre-commit-config.yaml`:

```yaml
repos:
  - repo: https://github.com/psf/black
    rev: 23.3.0
    hooks:
      - id: black

  - repo: https://github.com/PyCQA/flake8
    rev: 6.0.0
    hooks:
      - id: flake8

  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.0.0
    hooks:
      - id: mypy
```

Install pre-commit:

```bash
cd backend
pip install pre-commit
pre-commit install
```

### 7.3 Frontend Linting

Create `frontend/.eslintrc.json`:

```json
{
  "extends": ["next/core-web-vitals"],
  "rules": {
    "react/react-in-jsx-scope": "off",
    "semi": ["error", "always"],
    "quotes": ["error", "double"]
  }
}
```

Create `frontend/prettier.config.js`:

```javascript
module.exports = {
  semi: true,
  singleQuote: false,
  trailingComma: "es5",
  printWidth: 100,
  tabWidth: 2,
};
```

---

## Step 8: Testing Framework Setup

### 8.1 Backend Testing

Create `backend/tests/test_auth.py`:

```python
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

@pytest.mark.asyncio
async def test_health_check():
    """Test health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

@pytest.mark.asyncio
async def test_jwt_verification():
    """Test JWT verification middleware"""
    # Request without token should fail
    response = client.get("/api/projects")
    assert response.status_code == 401
```

Create `backend/pytest.ini`:

```ini
[pytest]
asyncio_mode = auto
testpaths = tests
python_files = test_*.py
```

### 8.2 Frontend Testing

Create `frontend/__tests__/login.test.tsx`:

```typescript
import { render, screen } from "@testing-library/react";
import LoginPage from "@/app/(auth)/login/page";

describe("LoginPage", () => {
  it("renders login form", () => {
    render(<LoginPage />);
    expect(screen.getByText(/sign in/i)).toBeInTheDocument();
  });
});
```

---

## Phase 0 Deliverables Checklist

- [ ] Monorepo initialized with proper structure
- [ ] Docker Compose file allows `docker-compose up` to spin up full stack
- [ ] GitHub Actions CI/CD pipeline runs on every commit
- [x] MongoDB collections created with proper indexes
- [x] NextAuth configured with Google/GitHub OAuth
- [ ] FastAPI JWT verification middleware implemented
- [ ] Context object schema defined and validated
- [ ] All agent output schemas defined
- [ ] Logging, APM, and error tracking configured
- [ ] Code linting and formatting standards established
- [ ] Testing framework set up for both backend and frontend
- [ ] Documentation in place (architecture, schemas, API)

### Phase 0 Success Criteria

✅ **Developer Setup**: A new engineer can clone the repo and run `docker-compose up` without manual database setup or credential configuration  
✅ **Auth Works**: Users can sign up with Google/GitHub, JWT is verified on FastAPI side  
✅ **Monitoring Ready**: All requests are logged with correlation IDs; errors are tracked in Sentry  
✅ **CI/CD Functional**: Commits trigger linting and tests; merge to main deploys to staging  

---

---

# PHASE 1: MVP Core Loop

**Duration**: Weeks 5–16 (12 weeks)  
**Team**: 4–5 engineers + 1–2 product/design  
**Goal**: Prove end-to-end loop works: user → chat → clarification → reports

## Overview

Phase 1 delivers the core product: users can describe an idea, answer clarification questions, and receive a connected set of useful reports (PRD, feasibility, ROI, roadmap). This phase focuses entirely on quality and correctness, not breadth.

## Step 1: Authentication & Workspace (Weeks 5–6)

### 1.1 Personal Workspace Auto-Creation

**Backend Route**: `POST /auth/signup/complete`

```python
@router.post("/auth/signup/complete")
async def complete_signup(request: Request):
    """Auto-create personal workspace on signup"""
    user = request.state.user
    
    # Create personal organization
    personal_org = {
        "name": f"{user['email']}'s Workspace",
        "owner_id": ObjectId(user['user_id']),
        "type": "personal",
        "plan_tier": "free",
        "created_at": datetime.utcnow(),
    }
    
    result = await db.organizations.insert_one(personal_org)
    
    return {
        "organization_id": str(result.inserted_id),
        "message": "Personal workspace created",
    }
```

### 1.2 Project CRUD Routes

**Backend**: `backend/app/routes/projects.py`

```python
from fastapi import APIRouter, HTTPException
from bson import ObjectId
from app.schemas.project import CreateProjectRequest, ProjectResponse

router = APIRouter(prefix="/api/projects", tags=["projects"])

@router.post("")
async def create_project(request: Request, req_body: CreateProjectRequest):
    """Create a new project"""
    user = request.state.user
    db = get_database()
    
    # Validate user is member of organization
    member = await db.members.find_one({
        "organization_id": ObjectId(req_body.organization_id),
        "user_id": ObjectId(user['user_id']),
    })
    
    if not member and req_body.organization_id != user.get('default_org_id'):
        raise HTTPException(status_code=403, detail="Not authorized to create project in this organization")
    
    # Create project with empty context
    project = {
        "organization_id": ObjectId(req_body.organization_id),
        "owner_id": ObjectId(user['user_id']),
        "title": req_body.title,
        "description": req_body.description or "",
        "status": "active",
        "context_object": {
            "domain": None,
            "problem_statement": None,
            "known_facts": [],
            "constraints": {},
            "ambiguity_flags": [],
            "context_version": 1,
            "stale_agents": [],
        },
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    
    result = await db.projects.insert_one(project)
    
    # Auto-create chat session
    chat_session = {
        "project_id": result.inserted_id,
        "user_id": ObjectId(user['user_id']),
        "organization_id": ObjectId(req_body.organization_id),
        "title": f"Chat for {req_body.title}",
        "status": "active",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    
    chat_result = await db.chat_sessions.insert_one(chat_session)
    
    return {
        "project_id": str(result.inserted_id),
        "chat_session_id": str(chat_result.inserted_id),
        "message": "Project created successfully",
    }

@router.get("")
async def list_projects(request: Request):
    """List all projects for user's organizations"""
    user = request.state.user
    db = get_database()
    
    # Get all orgs user belongs to
    member_orgs = await db.members.find({
        "user_id": ObjectId(user['user_id']),
    }).to_list(None)
    
    org_ids = [ObjectId(m['organization_id']) for m in member_orgs]
    
    # Add personal org
    personal_org = await db.organizations.find_one({
        "owner_id": ObjectId(user['user_id']),
        "type": "personal",
    })
    
    if personal_org:
        org_ids.append(personal_org['_id'])
    
    # Get projects in these orgs
    projects = await db.projects.find({
        "organization_id": {"$in": org_ids},
    }).sort("updated_at", -1).to_list(None)
    
    return [{
        "id": str(p['_id']),
        "title": p['title'],
        "organization_id": str(p['organization_id']),
        "created_at": p['created_at'].isoformat(),
        "updated_at": p['updated_at'].isoformat(),
    } for p in projects]

@router.get("/{project_id}")
async def get_project(request: Request, project_id: str):
    """Get project details with authorization check"""
    user = request.state.user
    db = get_database()
    
    project = await db.projects.find_one({"_id": ObjectId(project_id)})
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Authorization check
    is_owner = str(project['owner_id']) == user['user_id']
    is_member = await db.members.find_one({
        "organization_id": project['organization_id'],
        "user_id": ObjectId(user['user_id']),
    })
    
    if not (is_owner or is_member):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return {
        "id": str(project['_id']),
        "title": project['title'],
        "description": project.get('description', ''),
        "context": project['context_object'],
        "created_at": project['created_at'].isoformat(),
    }
```

### 1.3 Frontend: Dashboard & Project Creation

**Frontend**: `frontend/app/dashboard/page.tsx`

```typescript
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState("");

  useEffect(() => {
    if (session) {
      fetchProjects();
    }
  }, [session]);

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects", {
        headers: { Authorization: `Bearer ${session?.user?.accessToken}` },
      });
      const data = await res.json();
      setProjects(data);
    } catch (error) {
      console.error("Failed to fetch projects", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.user?.accessToken}`,
        },
        body: JSON.stringify({
          title: newProjectTitle,
          organization_id: session?.user?.defaultOrgId,
        }),
      });

      const { project_id, chat_session_id } = await res.json();
      router.push(`/projects/${project_id}/chat`);
    } catch (error) {
      console.error("Failed to create project", error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Projects</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          New Project
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {projects.map((project) => (
          <Link key={project.id} href={`/projects/${project.id}/chat`}>
            <div className="border rounded-lg p-4 hover:shadow-lg cursor-pointer">
              <h3 className="font-semibold">{project.title}</h3>
              <p className="text-sm text-gray-500">
                Updated: {new Date(project.updated_at).toLocaleDateString()}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Create New Project</h2>
            <input
              type="text"
              placeholder="Project title"
              value={newProjectTitle}
              onChange={(e) => setNewProjectTitle(e.target.value)}
              className="w-full border rounded px-3 py-2 mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreateProject}
                className="flex-1 bg-blue-600 text-white py-2 rounded"
              >
                Create
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 bg-gray-200 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## Step 2: Chat System Foundation (Weeks 6–8)

### 2.1 Chat Routes

**Backend**: `backend/app/routes/chat.py`

```python
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from app.services.chat_service import ChatService

router = APIRouter(prefix="/api/projects/{project_id}/chat", tags=["chat"])

@router.post("/messages")
async def send_message(request: Request, project_id: str, req_body: SendMessageRequest):
    """Send a message and stream back AI response"""
    user = request.state.user
    db = get_database()
    
    # Verify project access
    project = await db.projects.find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Authorization check
    if (str(project['owner_id']) != user['user_id'] and 
        not await _verify_org_membership(user, project['organization_id'])):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get chat session
    chat_session = await db.chat_sessions.find_one({"project_id": ObjectId(project_id)})
    
    # Persist user message
    user_message = {
        "chat_session_id": chat_session['_id'],
        "project_id": ObjectId(project_id),
        "role": "user",
        "content": req_body.content,
        "message_type": "text",
        "file_refs": [ObjectId(fid) for fid in req_body.file_ids] if req_body.file_ids else [],
        "created_at": datetime.utcnow(),
    }
    
    msg_result = await db.chat_messages.insert_one(user_message)
    
    # Trigger LangGraph workflow (see Step 3)
    async def generate():
        async for chunk in invoke_langraph_workflow(
            project_id=project_id,
            message_id=str(msg_result.inserted_id),
            context=project['context_object'],
        ):
            yield chunk
    
    return StreamingResponse(generate(), media_type="text/event-stream")

@router.get("/messages")
async def get_messages(request: Request, project_id: str, limit: int = 50, skip: int = 0):
    """Get chat history"""
    user = request.state.user
    db = get_database()
    
    # Authorization check
    project = await db.projects.find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if (str(project['owner_id']) != user['user_id'] and 
        not await _verify_org_membership(user, project['organization_id'])):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get messages
    messages = await db.chat_messages.find({
        "project_id": ObjectId(project_id),
    }).sort("created_at", 1).skip(skip).limit(limit).to_list(None)
    
    return [{
        "id": str(m['_id']),
        "role": m['role'],
        "content": m['content'],
        "message_type": m['message_type'],
        "created_at": m['created_at'].isoformat(),
    } for m in messages]

async def _verify_org_membership(user: dict, org_id):
    """Helper: check if user is member of organization"""
    db = get_database()
    member = await db.members.find_one({
        "organization_id": ObjectId(org_id),
        "user_id": ObjectId(user['user_id']),
    })
    return member is not None
```

### 2.2 Frontend: Chat Interface

**Frontend**: `frontend/app/projects/[id]/chat/page.tsx`

```typescript
"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  message_type: string;
  created_at: string;
}

export default function ChatPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history on mount
  useEffect(() => {
    fetchMessages();
  }, [projectId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/chat/messages`, {
        headers: { Authorization: `Bearer ${session?.user?.accessToken}` },
      });
      const data = await res.json();
      setMessages(data);
    } catch (error) {
      console.error("Failed to fetch messages", error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      message_type: "text",
      created_at: new Date().toISOString(),
    };

    // Optimistic UI update
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setStreaming(true);

    try {
      const response = await fetch(`/api/projects/${projectId}/chat/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.user?.accessToken}`,
        },
        body: JSON.stringify({
          content: input,
          file_ids: [],
        }),
      });

      if (!response.ok) throw new Error("Failed to send message");

      // Stream response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";

      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: "",
        message_type: "text",
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        const chunk = decoder.decode(value);
        assistantContent += chunk;

        // Update last message with streamed content
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1].content = assistantContent;
          return updated;
        });
      }
    } catch (error) {
      console.error("Failed to send message", error);
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
    } finally {
      setLoading(false);
      setStreaming(false);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <h1 className="text-xl font-bold">Project Chat</h1>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-20">
            <p className="text-lg">Start by describing your project idea...</p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-xl px-4 py-2 rounded-lg ${
                message.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-black"
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              <p className="text-xs mt-1 opacity-70">
                {new Date(message.created_at).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}

        {streaming && (
          <div className="flex justify-start">
            <div className="bg-gray-200 text-black px-4 py-2 rounded-lg">
              <p className="animate-pulse">AI is thinking...</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t px-6 py-4">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your idea..."
            disabled={loading}
            className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
```

---

## Step 3: LangGraph Workflow Engine Setup (Weeks 7–9)

### 3.1 Define Workflow State Schema

**Backend**: `backend/app/agents/state.py`

```python
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
from app.schemas.context import ProjectContext

class WorkflowState(BaseModel):
    """Shared state object flowing through LangGraph"""
    # Input
    raw_user_message: str
    chat_history: List[Dict[str, str]]
    project_context: ProjectContext
    uploaded_file_summaries: List[str]
    
    # Execution tracking
    current_agent: Optional[str] = None
    agents_executed: List[str] = []
    
    # Outputs
    agent_outputs: Dict[str, Any] = {}
    routing_decision: Optional[str] = None
    
    # Status
    status: str = "running"  # running, awaiting_input, completed, failed
    error_message: Optional[str] = None
```

### 3.2 Input Understanding Agent

**Backend**: `backend/app/agents/input_understanding.py`

```python
from langchain.chat_models import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from app.schemas.agents import InputUnderstandingOutput
import json

llm = ChatOpenAI(model="gpt-4", temperature=0)

async def input_understanding_agent(state: WorkflowState) -> Dict[str, Any]:
    """Extract structured understanding from raw user input"""
    
    prompt = ChatPromptTemplate.from_template("""
    Analyze the user's description of their project idea and extract key information.
    
    User message: {user_message}
    
    Return a JSON object with:
    - domain: The industry/domain (e.g., healthcare, fintech, B2B SaaS)
    - idea_summary: A 1-2 sentence summary of the idea
    - known_facts: List of concrete facts mentioned (team size, budget, etc.)
    - ambiguity_flags: List of unclear or ambiguous aspects
    - confidence: Number 0-1 indicating confidence in the extraction
    
    Be concise. Flag anything unclear rather than inferring.
    """)
    
    message = prompt.format_prompt(user_message=state.raw_user_message).to_messages()
    response = await llm.ainvoke(message)
    
    # Parse response
    try:
        output_data = json.loads(response.content)
        output = InputUnderstandingOutput(**output_data)
    except:
        raise ValueError("Failed to parse agent output")
    
    # Update context
    state.project_context.domain = output.domain
    state.project_context.problem_statement = output.idea_summary
    state.project_context.known_facts = output.known_facts
    state.project_context.ambiguity_flags = output.ambiguity_flags
    
    return {
        "agent_outputs": {
            **state.agent_outputs,
            "input_understanding": output.dict(),
        },
        "agents_executed": [*state.agents_executed, "input_understanding_agent"],
        "project_context": state.project_context,
    }
```

### 3.3 Create LangGraph Workflow

**Backend**: `backend/app/agents/workflow.py`

```python
from langgraph.graph import StateGraph
from app.agents.state import WorkflowState
from app.agents.input_understanding import input_understanding_agent
from app.agents.clarification import clarification_agent
# ... import other agents

def create_workflow_graph():
    """Create the LangGraph workflow"""
    
    workflow = StateGraph(WorkflowState)
    
    # Add nodes
    workflow.add_node("input_understanding", input_understanding_agent)
    workflow.add_node("clarification", clarification_agent)
    # Add more nodes as they're implemented
    
    # Set entry point
    workflow.set_entry_point("input_understanding")
    
    # Add conditional edges
    workflow.add_conditional_edges(
        "clarification",
        lambda state: "awaiting_input" if not state.project_context.ambiguity_flags else "prd",
        {
            "awaiting_input": "clarification",  # Loop back if more clarification needed
            "prd": "prd_agent",  # Continue to next agent
        }
    )
    
    # Add normal edges
    workflow.add_edge("input_understanding", "clarification")
    
    return workflow.compile()

# Compile the graph
graph = create_workflow_graph()
```

### 3.4 Execute Workflow from Chat Route

**Backend**: Update `backend/app/routes/chat.py`

```python
from app.agents.workflow import graph
from app.db.mongodb import get_database
from bson import ObjectId

async def invoke_langraph_workflow(project_id: str, message_id: str, context: dict):
    """Execute LangGraph workflow and stream responses"""
    db = get_database()
    
    # Load chat history
    chat_messages = await db.chat_messages.find({
        "project_id": ObjectId(project_id),
    }).sort("created_at", 1).to_list(None)
    
    chat_history = [
        {"role": m['role'], "content": m['content']}
        for m in chat_messages[-10:]  # Last 10 messages
    ]
    
    # Create workflow state
    initial_state = WorkflowState(
        raw_user_message=chat_messages[-1]['content'],
        chat_history=chat_history,
        project_context=ProjectContext(**context),
        uploaded_file_summaries=[],
    )
    
    # Create workflow run record
    workflow_run = {
        "project_id": ObjectId(project_id),
        "triggered_by_message_id": ObjectId(message_id),
        "status": "running",
        "agents_executed": [],
        "token_usage": {"input_tokens": 0, "output_tokens": 0},
        "created_at": datetime.utcnow(),
    }
    
    run_result = await db.ai_workflow_runs.insert_one(workflow_run)
    
    try:
        # Invoke graph
        final_state = await graph.ainvoke(initial_state)
        
        # Persist agent outputs
        for agent_name, output in final_state.agent_outputs.items():
            await db.agent_outputs.insert_one({
                "workflow_run_id": run_result.inserted_id,
                "agent_name": agent_name,
                "output_payload": output,
                "created_at": datetime.utcnow(),
            })
        
        # Update workflow run
        await db.ai_workflow_runs.update_one(
            {"_id": run_result.inserted_id},
            {
                "$set": {
                    "status": "completed",
                    "agents_executed": final_state.agents_executed,
                    "updated_at": datetime.utcnow(),
                }
            }
        )
        
        # Stream responses to client
        if final_state.status == "awaiting_input":
            yield f"data: {json.dumps({'type': 'clarification', 'questions': final_state.routing_decision})}\n\n"
        else:
            yield f"data: {json.dumps({'type': 'completion', 'message': 'Reports generated'})}\n\n"
            
    except Exception as e:
        await db.ai_workflow_runs.update_one(
            {"_id": run_result.inserted_id},
            {
                "$set": {
                    "status": "failed",
                    "error_details": str(e),
                    "updated_at": datetime.utcnow(),
                }
            }
        )
        yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
```

---

## Step 4: Clarification Agent (Weeks 8–10)

### 4.1 Implement Clarification Agent

**Backend**: `backend/app/agents/clarification.py`

```python
from langchain.chat_models import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from app.schemas.agents import ClarificationOutput
import json

llm = ChatOpenAI(model="gpt-4", temperature=0)

async def clarification_agent(state: WorkflowState) -> Dict[str, Any]:
    """Ask clarification questions if critical info is missing"""
    
    context = state.project_context
    
    # Check what's missing
    missing_info = []
    if not context.domain:
        missing_info.append("domain")
    if not context.problem_statement:
        missing_info.append("problem statement")
    if not context.constraints.budget:
        missing_info.append("budget/resources")
    if not context.constraints.timeline:
        missing_info.append("timeline")
    
    if not missing_info:
        # Sufficient context
        return {
            "agent_outputs": {
                **state.agent_outputs,
                "clarification": {"sufficient_context": True},
            },
            "routing_decision": "prd",  # Route to next agent
            "agents_executed": [*state.agents_executed, "clarification_agent"],
        }
    
    # Generate clarification questions
    prompt = ChatPromptTemplate.from_template("""
    The user has described their project idea, but some critical information is missing:
    Missing: {missing_info}
    
    Current understanding:
    Domain: {domain}
    Problem: {problem}
    Known facts: {known_facts}
    
    Generate 3-5 HIGH-VALUE clarification questions (domain-specific if possible).
    For healthcare startups, ask about regulatory context and patient population.
    For B2B SaaS, ask about target persona and sales motion.
    For fintech, ask about compliance and regulatory requirements.
    
    Return a JSON object with:
    - sufficient_context: false
    - clarification_questions: List of 3-5 questions
    
    Do NOT ask generic questions. Each question should be specific to their domain.
    """)
    
    message = prompt.format_prompt(
        missing_info=", ".join(missing_info),
        domain=context.domain or "Unknown",
        problem=context.problem_statement or "Not stated",
        known_facts=", ".join(context.known_facts) or "None",
    ).to_messages()
    
    response = await llm.ainvoke(message)
    
    try:
        output_data = json.loads(response.content)
        output = ClarificationOutput(**output_data)
    except:
        # Fallback to generic questions
        output = ClarificationOutput(
            sufficient_context=False,
            clarification_questions=[
                "What domain/industry is this idea in?",
                "What is the core problem you're solving?",
                "What's your budget or available resources?",
                "What's your timeline to launch?",
            ]
        )
    
    return {
        "agent_outputs": {
            **state.agent_outputs,
            "clarification": output.dict(),
        },
        "routing_decision": "awaiting_input",  # Pause for user input
        "status": "awaiting_input",
        "agents_executed": [*state.agents_executed, "clarification_agent"],
    }
```

### 4.2 Frontend: Clarification Question UI

**Frontend**: Create `frontend/components/ClarificationPanel.tsx`

```typescript
import { useState } from "react";

interface ClarificationPanelProps {
  questions: string[];
  onSubmit: (answers: string[]) => void;
  loading: boolean;
}

export function ClarificationPanel({
  questions,
  onSubmit,
  loading,
}: ClarificationPanelProps) {
  const [answers, setAnswers] = useState<string[]>(Array(questions.length).fill(""));

  const handleAnswerChange = (index: number, value: string) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  const handleSubmit = () => {
    if (answers.some((a) => !a.trim())) {
      alert("Please answer all questions");
      return;
    }
    onSubmit(answers);
  };

  return (
    <div className="bg-blue-50 border-l-4 border-blue-600 p-4 my-4">
      <h3 className="font-semibold text-blue-900 mb-4">
        I need some more information to give you a better plan:
      </h3>

      <div className="space-y-4">
        {questions.map((question, index) => (
          <div key={index}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {index + 1}. {question}
            </label>
            <textarea
              value={answers[index]}
              onChange={(e) => handleAnswerChange(index, e.target.value)}
              disabled={loading}
              placeholder="Your answer..."
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
              rows={2}
            />
          </div>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg disabled:opacity-50"
      >
        {loading ? "Generating..." : "Submit Answers"}
      </button>
    </div>
  );
}
```

---

## Step 5: PRD Agent (Weeks 10–12)

### 5.1 PRD Agent Implementation

**Backend**: `backend/app/agents/prd_agent.py`

```python
from langchain.chat_models import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from app.schemas.agents import PRDOutput
import json

llm = ChatOpenAI(model="gpt-4", temperature=0.3)

async def prd_agent(state: WorkflowState) -> Dict[str, Any]:
    """Generate a comprehensive Product Requirements Document"""
    
    context = state.project_context
    
    prompt = ChatPromptTemplate.from_template("""
    You are a world-class Product Manager. Generate a detailed PRD for this project:
    
    Domain: {domain}
    Problem: {problem}
    Target Audience: {audience}
    Known Facts: {facts}
    Constraints: {constraints}
    
    Create a structured PRD with these sections:
    1. Overview: High-level description (2-3 sentences)
    2. Problem Statement: What problem are you solving and why it matters
    3. Goals: 3-5 specific, measurable goals
    4. Personas: 2-3 detailed user personas (name, role, needs, pain points)
    5. User Stories: 5-8 user stories in "As a... I want... so that..." format
    6. Functional Requirements: 8-12 specific features/capabilities
    7. Non-Functional Requirements: Performance, security, scalability needs
    8. Acceptance Criteria: How you'll know the MVP is successful
    9. Success Metrics: KPIs and measurement approach
    10. MVP Definition: What's in vs. out of the MVP
    
    **CRITICAL**: State all assumptions you're making in each section.
    If you lack information, note it explicitly rather than guessing.
    
    Return valid JSON matching this schema:
    {{
      "overview": {{"title": "...", "content": "..."}},
      "problem_statement": {{"title": "...", "content": "..."}},
      "goals": ["goal1", "goal2", ...],
      "personas": [{{"name": "...", "role": "...", "needs": [...], "pain_points": [...]}}],
      "user_stories": ["As a... I want... so that...", ...],
      "functional_requirements": ["req1", "req2", ...],
      "non_functional_requirements": ["req1", "req2", ...],
      "acceptance_criteria": ["criterion1", "criterion2", ...],
      "success_metrics": ["metric1", "metric2", ...],
      "mvp_definition": "...",
      "assumptions_stated": ["assumption1", "assumption2", ...]
    }}
    """)
    
    message = prompt.format_prompt(
        domain=context.domain or "Not specified",
        problem=context.problem_statement or "Not fully defined",
        audience=context.target_audience or "TBD",
        facts="\n".join(context.known_facts) if context.known_facts else "None provided",
        constraints=json.dumps(context.constraints.dict()) if context.constraints else "{}",
    ).to_messages()
    
    response = await llm.ainvoke(message)
    
    try:
        output_data = json.loads(response.content)
        output = PRDOutput(**output_data)
    except Exception as e:
        raise ValueError(f"Failed to parse PRD output: {str(e)}")
    
    return {
        "agent_outputs": {
            **state.agent_outputs,
            "prd": output.dict(),
        },
        "agents_executed": [*state.agents_executed, "prd_agent"],
    }
```

### 5.2 Persist PRD to Database

**Backend**: Add to `backend/app/routes/chat.py` after workflow completes

```python
# After workflow completes, persist reports
if "prd" in final_state.agent_outputs:
    prd_output = final_state.agent_outputs["prd"]
    
    # Check if report exists
    existing_report = await db.generated_reports.find_one({
        "project_id": ObjectId(project_id),
        "report_type": "prd",
    })
    
    if existing_report:
        # Update existing report
        version_number = existing_report.get("version_number", 1) + 1
    else:
        # Create new report
        version_number = 1
    
    # Create version record
    prd_version = {
        "project_id": ObjectId(project_id),
        "report_type": "prd",
        "version_number": version_number,
        "content_snapshot": prd_output,
        "change_reason": "Auto-generated from workflow",
        "created_by": "prd_agent_v1",
        "edit_source": "ai",
        "created_at": datetime.utcnow(),
    }
    
    version_result = await db.report_versions.insert_one(prd_version)
    
    # Update/create generated_reports
    if existing_report:
        await db.generated_reports.update_one(
            {"_id": existing_report["_id"]},
            {
                "$set": {
                    "current_version_id": version_result.inserted_id,
                    "updated_at": datetime.utcnow(),
                }
            }
        )
    else:
        await db.generated_reports.insert_one({
            "_id": ObjectId(),
            "project_id": ObjectId(project_id),
            "report_type": "prd",
            "current_version_id": version_result.inserted_id,
            "updated_at": datetime.utcnow(),
        })
```

---

## Step 6: Feasibility, ROI, Roadmap Agents (Weeks 11–15)

### 6.1 Feasibility Agent

**Backend**: `backend/app/agents/feasibility_agent.py`

```python
async def feasibility_agent(state: WorkflowState) -> Dict[str, Any]:
    """Assess technical feasibility and complexity"""
    
    # Only run if PRD is available
    if "prd" not in state.agent_outputs:
        return state
    
    prd = state.agent_outputs["prd"]
    
    prompt = ChatPromptTemplate.from_template("""
    You are a seasoned Solution Architect. Given this PRD, assess technical feasibility:
    
    Domain: {domain}
    Features: {features}
    Non-functional requirements: {non_functional}
    
    Provide a feasibility assessment including:
    1. Technical Approach: High-level technology strategy
    2. Complexity Signal: low/medium/high
    3. Key Risks: Technical risks and mitigation
    4. Critical Dependencies: External services or tools needed
    5. Regulatory Notes: Any compliance/regulatory considerations
    
    Be realistic. If something is hard, say it's hard.
    
    Return JSON:
    {{
      "technical_approach": "...",
      "complexity_signal": "low|medium|high",
      "key_risks": ["risk1", "risk2", ...],
      "critical_dependencies": ["dep1", "dep2", ...],
      "regulatory_notes": "..."
    }}
    """)
    
    # Format features
    features_text = "\n".join(prd.get("functional_requirements", []))
    non_func_text = "\n".join(prd.get("non_functional_requirements", []))
    
    # ... implement similarly to PRD agent
```

### 6.2 ROI Agent

**Backend**: `backend/app/agents/roi_agent.py`

```python
async def roi_agent(state: WorkflowState) -> Dict[str, Any]:
    """Generate financial model and ROI analysis"""
    
    # Dependencies: PRD, Feasibility
    if "prd" not in state.agent_outputs or "feasibility" not in state.agent_outputs:
        return state
    
    prd = state.agent_outputs["prd"]
    feasibility = state.agent_outputs["feasibility"]
    context = state.project_context
    
    prompt = ChatPromptTemplate.from_template("""
    You are a financial analyst. Create a realistic cost/revenue model:
    
    Domain: {domain}
    Complexity: {complexity}
    Features: {features}
    Budget Constraint: {budget}
    
    Estimate (use ranges, NOT precise numbers):
    1. Development Cost: Engineer salaries, timeline
    2. Infrastructure: Hosting, databases, AI APIs
    3. Team Cost: Full team composition, hiring plan
    4. Revenue Possibilities: Different go-to-market scenarios
    5. Break-even: Timeline to profitability
    
    **IMPORTANT**: State all assumptions. Use ranges (e.g., $50K-100K).
    Never give false-precision single numbers.
    
    Return JSON:
    {{
      "development_cost_range": "$X-$Y",
      "infrastructure_cost_estimate": "$X/month",
      "team_cost_estimate": "$X/month for N people",
      "revenue_assumptions": [...],
      "roi_scenarios": [{{"name": "bootstrapped|funded", "timeline_months": N, "breakeven": "..."}},  ...],
      "assumptions_stated": [...]
    }}
    """)
    
    # ... implement similarly
```

### 6.3 Roadmap Agent

**Backend**: `backend/app/agents/roadmap_agent.py`

```python
async def roadmap_agent(state: WorkflowState) -> Dict[str, Any]:
    """Generate project roadmap with phases and milestones"""
    
    # Dependencies: PRD, ROI
    if "prd" not in state.agent_outputs or "roi" not in state.agent_outputs:
        return state
    
    prd = state.agent_outputs["prd"]
    roi = state.agent_outputs["roi"]
    
    prompt = ChatPromptTemplate.from_template("""
    You are a product strategist. Create a realistic roadmap:
    
    MVP Definition: {mvp}
    Budget: {budget}
    Timeline: {timeline}
    
    Define phases (e.g., Foundation → MVP → Scale):
    1. Phase name
    2. Milestones (specific, measurable)
    3. Duration (weeks/months)
    4. Key deliverables
    
    Prioritize based on: MVP-first, dependency order, risk mitigation.
    
    Return JSON:
    {{
      "phases": [
        {{
          "phase_name": "...",
          "milestones": ["milestone1", ...],
          "duration_weeks": N,
          "description": "...",
          "deliverables": ["..."]
        }},
        ...
      ],
      "total_timeline_weeks": N,
      "critical_path": "...",
      "priority_rationale": "..."
    }}
    """)
    
    # ... implement similarly
```

---

## Step 7: Final Report Agent & Assembly (Weeks 14–16)

### 7.1 Final Report Agent

**Backend**: `backend/app/agents/final_report_agent.py`

```python
async def final_report_agent(state: WorkflowState) -> Dict[str, Any]:
    """Assemble and validate all agent outputs into a coherent report bundle"""
    
    # Collect all outputs
    prd = state.agent_outputs.get("prd", {})
    feasibility = state.agent_outputs.get("feasibility", {})
    roi = state.agent_outputs.get("roi", {})
    roadmap = state.agent_outputs.get("roadmap", {})
    
    # Check consistency
    consistency_issues = []
    
    # Example: Check if team size in roadmap makes sense given ROI
    # This is pseudo-code; actual implementation depends on data structures
    if roi and roadmap:
        roi_team_size = roi.get("team_cost_estimate", "").split(" ")[0]
        # ... check consistency
    
    return {
        "agent_outputs": {
            **state.agent_outputs,
            "final_report": {
                "prd_version": 1,
                "feasibility_version": 1,
                "roi_version": 1,
                "roadmap_version": 1,
                "consistency_issues": consistency_issues,
                "status": "ready" if not consistency_issues else "review_needed",
            }
        },
        "status": "completed",
        "routing_decision": "persist",
        "agents_executed": [*state.agents_executed, "final_report_agent"],
    }
```

### 7.2 Update LangGraph to Include All Agents

**Backend**: Update `backend/app/agents/workflow.py`

```python
from langgraph.graph import StateGraph, END
from app.agents.state import WorkflowState
from app.agents import (
    input_understanding,
    clarification,
    prd_agent,
    feasibility_agent,
    roi_agent,
    roadmap_agent,
    final_report_agent,
)

def create_workflow_graph():
    workflow = StateGraph(WorkflowState)
    
    # Add nodes
    workflow.add_node("input_understanding", input_understanding.input_understanding_agent)
    workflow.add_node("clarification", clarification.clarification_agent)
    workflow.add_node("prd", prd_agent.prd_agent)
    workflow.add_node("feasibility", feasibility_agent.feasibility_agent)
    workflow.add_node("roi", roi_agent.roi_agent)
    workflow.add_node("roadmap", roadmap_agent.roadmap_agent)
    workflow.add_node("final_report", final_report_agent.final_report_agent)
    
    # Set entry point
    workflow.set_entry_point("input_understanding")
    
    # Add edges
    workflow.add_edge("input_understanding", "clarification")
    
    # Conditional edge from clarification
    workflow.add_conditional_edges(
        "clarification",
        lambda state: state.routing_decision,  # "awaiting_input" or "prd"
        {
            "awaiting_input": END,  # Pause, wait for user response
            "prd": "prd",  # Continue
        }
    )
    
    # Linear chain for agents
    workflow.add_edge("prd", "feasibility")
    workflow.add_edge("feasibility", "roi")
    workflow.add_edge("roi", "roadmap")
    workflow.add_edge("roadmap", "final_report")
    workflow.add_edge("final_report", END)
    
    return workflow.compile()
```

---

## Step 8: Report Viewer UI (Weeks 15–16)

### 8.1 Report Pages

**Frontend**: `frontend/app/projects/[id]/reports/page.tsx`

```typescript
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ReportsPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { data: session } = useSession();
  const [reports, setReports] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, [projectId]);

  const fetchReports = async () => {
    try {
      const reportTypes = ["prd", "feasibility", "roi", "roadmap"];
      const data = await Promise.all(
        reportTypes.map((type) =>
          fetch(`/api/projects/${projectId}/reports/${type}`, {
            headers: { Authorization: `Bearer ${session?.user?.accessToken}` },
          }).then((r) => r.json())
        )
      );

      setReports({
        prd: data[0],
        feasibility: data[1],
        roi: data[2],
        roadmap: data[3],
      });
    } catch (error) {
      console.error("Failed to fetch reports", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading reports...</div>;

  return (
    <div className="max-w-6xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Project Reports</h1>

      <Tabs defaultValue="prd" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="prd">PRD</TabsTrigger>
          <TabsTrigger value="feasibility">Feasibility</TabsTrigger>
          <TabsTrigger value="roi">ROI</TabsTrigger>
          <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
        </TabsList>

        <TabsContent value="prd" className="space-y-4">
          <PRDViewer data={reports.prd} />
        </TabsContent>

        <TabsContent value="feasibility" className="space-y-4">
          <FeasibilityViewer data={reports.feasibility} />
        </TabsContent>

        <TabsContent value="roi" className="space-y-4">
          <ROIViewer data={reports.roi} />
        </TabsContent>

        <TabsContent value="roadmap" className="space-y-4">
          <RoadmapViewer data={reports.roadmap} />
        </TabsContent>
      </Tabs>

      <div className="mt-8 flex gap-2">
        <button className="bg-blue-600 text-white px-4 py-2 rounded">
          Export PDF
        </button>
        <button className="bg-green-600 text-white px-4 py-2 rounded">
          Export DOCX
        </button>
      </div>
    </div>
  );
}

// Component to render PRD
function PRDViewer({ data }: { data: any }) {
  if (!data) return <div>No PRD generated yet</div>;

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-2xl font-bold">{data.overview?.title}</h2>
        <p className="text-gray-700 mt-2">{data.overview?.content}</p>
      </section>

      <section>
        <h3 className="text-xl font-bold">Problem Statement</h3>
        <p className="text-gray-700 mt-2">{data.problem_statement?.content}</p>
      </section>

      <section>
        <h3 className="text-xl font-bold">Goals</h3>
        <ul className="list-disc list-inside space-y-1 mt-2">
          {data.goals?.map((goal: string, i: number) => (
            <li key={i} className="text-gray-700">
              {goal}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="text-xl font-bold">Personas</h3>
        <div className="space-y-4 mt-2">
          {data.personas?.map((persona: any, i: number) => (
            <div key={i} className="border-l-4 border-blue-600 pl-4">
              <h4 className="font-semibold">{persona.name}</h4>
              <p className="text-sm text-gray-600">{persona.role}</p>
              <p className="text-sm mt-2"><strong>Needs:</strong> {persona.needs?.join(", ")}</p>
              <p className="text-sm"><strong>Pain Points:</strong> {persona.pain_points?.join(", ")}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Continue with other sections */}
    </div>
  );
}

// Similar components for Feasibility, ROI, Roadmap
function FeasibilityViewer({ data }: { data: any }) {
  if (!data) return <div>No Feasibility assessment generated yet</div>;
  return <div>{/* Render feasibility data */}</div>;
}

function ROIViewer({ data }: { data: any }) {
  if (!data) return <div>No ROI model generated yet</div>;
  return <div>{/* Render ROI data */}</div>;
}

function RoadmapViewer({ data }: { data: any }) {
  if (!data) return <div>No Roadmap generated yet</div>;
  return <div>{/* Render roadmap data */}</div>;
}
```

---

## Phase 1 Deliverables Checklist

- [ ] Users can create projects
- [ ] Chat system works: send messages, receive streaming responses
- [ ] Input Understanding Agent extracts context from user message
- [ ] Clarification Agent asks high-value questions
- [ ] PRD Agent generates comprehensive PRD
- [ ] Feasibility Agent assesses technical complexity
- [ ] ROI Agent creates financial model
- [ ] Roadmap Agent creates project roadmap
- [ ] Final Report Agent assembles and checks consistency
- [ ] All reports are persisted and versioned
- [ ] Report viewer displays all 4 reports in clean UI
- [ ] Context object is updated as agents execute
- [ ] Workflow execution is traced and logged

### Phase 1 Success Criteria

✅ **Core Loop Works**: User sends message → answers clarifications → receives 4 connected reports  
✅ **PRD Quality**: PRD contains distinct personas, specific user stories (not templates), clear problem statement  
✅ **Clarification Value**: Questions are domain-specific, not generic checklists  
✅ **Reports Are Consistent**: Final Report Agent flags contradictions (e.g., team size vs. budget)  
✅ **Streaming UX Feels Responsive**: No 20-second blank screens; progressive rendering of results  
✅ **Durability**: Refresh the page; all chat and reports are still there  
✅ **Security**: User cannot access another user's project via direct API calls  

---

**[Continue to PHASE 2, PHASE 3, etc. with similar step-by-step detail...]**

---

# Quick Reference

## Key Files & Directories

```
backend/
├── app/
│   ├── main.py                 # FastAPI app entry
│   ├── agents/
│   │   ├── workflow.py         # LangGraph workflow definition
│   │   ├── input_understanding.py
│   │   ├── clarification.py
│   │   ├── prd_agent.py
│   │   ├── feasibility_agent.py
│   │   ├── roi_agent.py
│   │   ├── roadmap_agent.py
│   │   └── final_report_agent.py
│   ├── routes/
│   │   ├── auth.py
│   │   ├── projects.py
│   │   └── chat.py
│   ├── services/
│   │   ├── chat_service.py
│   │   └── project_service.py
│   ├── schemas/
│   │   ├── context.py
│   │   ├── agents.py
│   │   └── chat.py
│   ├── db/
│   │   ├── mongodb.py
│   │   └── init_db.py
│   └── middleware/
│       └── auth.py

frontend/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── dashboard/page.tsx
│   ├── projects/
│   │   └── [id]/
│   │       ├── chat/page.tsx
│   │       └── reports/page.tsx
│   └── layout.tsx
├── components/
│   ├── ChatInterface.tsx
│   ├── ClarificationPanel.tsx
│   ├── PRDViewer.tsx
│   └── ReportTabs.tsx
└── lib/
    ├── auth.ts
    └── api.ts
```

## Environment Variables Checklist

**Backend**:
```bash
DATABASE_URL=mongodb://...
JWT_SECRET=your-secret
REDIS_URL=redis://...
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_API_URL=http://localhost:8000
SENTRY_DSN=https://...
```

**Frontend**:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
```

## Deployment Checklist

- [ ] All environment variables set in staging/production
- [ ] MongoDB indexes created
- [ ] Redis cache configured
- [ ] Docker images built and pushed to registry
- [ ] Kubernetes manifests (or similar) configured
- [ ] Database backups enabled
- [ ] Monitoring & alerting set up (Sentry, DataDog, etc.)
- [ ] SSL certificates configured
- [ ] Logging configured (centralized)
- [ ] Rate limiting configured
- [ ] CORS configured to allow frontend origin only

---