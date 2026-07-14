# Planify

AI project intelligence platform — turn ideas into structured plans, reports, and workspace artifacts through a connected frontend, API backend, and multi-agent workflow.

This README is derived from the **graphify knowledge graph** ([`graphify-out/graph.html`](./graphify-out/graph.html)). Open that file in a browser to explore symbols, dependencies, and communities interactively.

---

## Repository at a glance

| Area | Role (from graph) | Symbol count* |
|------|---------------------|---------------|
| [`frontend/`](./frontend/) | Next.js app — landing, auth, dashboard, project chat, reports | ~290 code nodes |
| [`backend/`](./backend/) | FastAPI app — routes, agents, MongoDB, workflow orchestration | ~275 code nodes |
| [`graphify-out/`](./graphify-out/) | Generated architecture graph (618 nodes, 929 edges, 58 communities) | — |

\*Approximate node counts by top-level path in `graph.html`.

**Graph stats:** 618 nodes · 929 edges · 58 communities

---

## How the codebase connects

The graph models relationships such as `contains`, `calls`, `imports`, `imports_from`, `references`, and `rationale_for`. High-traffic hubs (most connected symbols) include:

| Symbol | File | Connections |
|--------|------|-------------|
| `dependencies` | `frontend/package.json` | 20 |
| `get_database()` | `backend/app/db/mongodb.py` | 20 |
| `apply_workflow_guards()` | `backend/app/agent/workflow_guards.py` | 19 |
| `chat_service.py` | `backend/app/services/chat_service.py` | 18 |
| `run_workflow_and_stream()` | `backend/app/services/chat_service.py` | 17 |
| `routes.ts` | `frontend/lib/routes.ts` | 16 |
| `password-auth.ts` | `frontend/lib/password-auth.ts` | 14 |
| `_assert_project_access()` | `backend/app/routes/projects.py` | 14 |

These hubs sit at the center of auth, routing, database access, and the AI chat workflow.

---

## Frontend (Next.js)

### App routes

| Route | Source |
|-------|--------|
| `/` | `frontend/app/(root)/page.tsx` |
| `/dashboard` | `frontend/app/dashboard/page.tsx` |
| `/login` | `frontend/app/(auth)/login/page.tsx` |
| `/signup` | `frontend/app/(auth)/signup/page.tsx` |
| `/forgot-password` | `frontend/app/(auth)/forgot-password/page.tsx` |
| `/set-password` | `frontend/app/(auth)/set-password/page.tsx` |
| `/projects/[id]/chat` | `frontend/app/projects/[id]/chat/page.tsx` |
| `/projects/[id]/reports` | `frontend/app/projects/[id]/reports/page.tsx` |

### UI communities (graph clusters)

- **Home Page** — landing (`navbar`, `mainSection`, `footer`) and entry CTAs
- **App Layout / Root Layout** — root shell and providers
- **NextAuth Integration** — session, password auth, crypto helpers
- **ProjectsView / SettingsView / AssetsView** — dashboard workspace views
- **agents.ts / Chat workspace** — agent metadata, chat UI, scroll, composer, markdown
- **Report viewers** — PRD, feasibility, ROI, roadmap, markdown body

### Shared libraries

- `frontend/lib/routes.ts` — route helpers and protected paths
- `frontend/lib/api.ts` — API client and streaming
- `frontend/lib/password-auth.ts` / `password-crypto.ts` — credential flows
- `frontend/proxy.ts` — request proxy / middleware boundary

---

## Backend (FastAPI)

### HTTP route modules

| Module | Path |
|--------|------|
| Auth | `backend/app/routes/auth.py` |
| Projects | `backend/app/routes/projects.py` |
| Chat | `backend/app/routes/chat.py` |
| Reports | `backend/app/routes/reports.py` |
| Dashboard | `backend/app/routes/dashboard.py` |
| Export | `backend/app/routes/export.py` |

### AI & workflow (graph communities)

- **apply_workflow_guards** / **route_after_project_workflow** — LangGraph routing and guard rails
- **ProjectContext** — shared context passed through chat and generation
- **Agent nodes** — e.g. `input_understanding_agent`, `prd_agent`, `roadmap_agent`, `final_report_agent`
- **llm.py / get_llm** — model access layer
- **chat_service.py** — orchestrates workflow runs and SSE streaming

### Data & infrastructure

- **ObjectId / Backend MongoDB API** — MongoDB persistence
- **Auth Middleware** — request authentication
- **Logging Config** — application logging
- **Health Tests** — service health coverage

Entry point: `backend/main.py`

---

## Architecture graph

Explore the full dependency map locally:

```bash
open graphify-out/graph.html
```

The visualization includes:

- **58 communities** — logical clusters (auth, chat workflow, dashboard, agents, etc.)
- **Search** — find any symbol by name
- **Click-to-inspect** — source file, community, and neighbors per node
- **Community legend** — filter by cluster

Largest communities in the current graph:

| Community | Nodes |
|-----------|-------|
| get_graph | 52 |
| ObjectId | 50 |
| Home Page | 46 |
| Health Tests | 40 |
| Logging Config | 40 |
| Frontend Dependencies | 39 |
| NextAuth Integration | 35 |
| apply_workflow_guards | 32 |
| Dev Tooling | 30 |
| ProjectContext | 26 |

---

## Getting started

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
# See backend/README.md for Python env setup
uvicorn app.main:app --reload --port 8000
```

The frontend expects the API at `http://localhost:8000` (see `frontend/lib/api.ts` in the graph).

---

## Related docs in repo

| Document | Notes |
|----------|-------|
| [`graphify-out/graph.html`](./graphify-out/graph.html) | **Primary architecture map** for this README |
| [`frontend/README.md`](./frontend/README.md) | Frontend-specific setup |
| [`backend/README.md`](./backend/README.md) | Backend-specific setup |
| [`plan.md`](./plan.md) | Extended product & engineering blueprint |
| [`phase.md`](./phase.md) | Phased delivery roadmap |

---

## License

TBD.
