# Planify Backend

Production-ready FastAPI backend for the Planify AI Project Intelligence Platform.

## Quick start

```bash
cd backend
cp .env.example .env   # edit with your MongoDB URI and JWT secret
uv sync
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API docs: http://localhost:8000/docs

## Architecture

```
app/
├── main.py              # FastAPI app, CORS, lifespan
├── config.py            # Settings (pydantic-settings)
├── agent/               # LangGraph workflow (conversation → project → reports)
├── db/                  # Async MongoDB (Motor)
├── middleware/          # JWT auth
├── routes/              # REST + SSE endpoints
├── schemas/             # Pydantic models
└── services/            # Chat orchestration, context mapping
```

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check (public) |
| POST | `/auth/signup/complete` | Create personal workspace |
| GET/POST | `/api/projects` | List / create projects |
| GET/PATCH/DELETE | `/api/projects/{id}` | Project CRUD |
| POST | `/api/projects/{id}/chat/messages` | Send message (SSE stream) |
| GET | `/api/projects/{id}/chat/messages` | Chat history |
| GET | `/api/projects/{id}/reports` | Generated reports |
| GET | `/api/dashboard/stats` | Dashboard KPIs |
| GET | `/api/dashboard/runs` | Recent AI runs |

## Requirements

- Python 3.11+
- MongoDB (local or Atlas)
- Ollama with `mistral:latest` (or set `OLLAMA_MODEL`)
