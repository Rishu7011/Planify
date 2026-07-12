# Graph Report - Planify  (2026-07-11)

## Corpus Check
- 63 files · ~15,736 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 377 nodes · 455 edges · 46 communities (42 shown, 4 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 37 edges (avg confidence: 0.79)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `277940ee`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Frontend Dependencies
- Dev Tooling
- Backend MongoDB API
- Agent Schemas
- Graphify Documentation
- Chat Schemas
- Health Tests
- Package Metadata
- Logging Config
- Auth Middleware
- Next.js Agent Docs
- App Layout
- Context Schemas
- NextAuth Integration
- DB Check Script
- UI Components
- NextAuth Types
- ObjectId
- MongoCheckpointSaver
- run_workflow_and_stream
- project.py
- final_report_agent
- WorkflowState
- get_graph
- clarification_agent
- feasibility_agent
- input_understanding_agent
- get_llm
- prd_agent
- roadmap_agent
- roi_agent
- mongodb.ts
- Request

## God Nodes (most connected - your core abstractions)
1. `MongoCheckpointSaver` - 18 edges
2. `_assert_project_access()` - 14 edges
3. `WorkflowState` - 13 edges
4. `get_llm()` - 9 edges
5. `run_workflow_and_stream()` - 9 edges
6. `send_message()` - 7 edges
7. `clarification_agent()` - 6 edges
8. `feasibility_agent()` - 6 edges
9. `final_report_agent()` - 6 edges
10. `input_understanding_agent()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `get_graph()` --calls--> `MongoCheckpointSaver`  [INFERRED]
  backend/app/agents/workflow.py → backend/app/agents/checkpointer.py
- `clarification_agent()` --calls--> `get_llm()`  [INFERRED]
  backend/app/agents/clarification.py → backend/app/agents/llm.py
- `clarification_agent()` --calls--> `ClarificationOutput`  [INFERRED]
  backend/app/agents/clarification.py → backend/app/schemas/agents.py
- `feasibility_agent()` --calls--> `get_llm()`  [INFERRED]
  backend/app/agents/feasibility_agent.py → backend/app/agents/llm.py
- `feasibility_agent()` --calls--> `FeasibilityOutput`  [INFERRED]
  backend/app/agents/feasibility_agent.py → backend/app/schemas/agents.py

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Next.js Breaking Change Surfaces** — frontend_agents_nextjs_apis, frontend_agents_nextjs_conventions, frontend_agents_nextjs_file_structure, frontend_agents_deprecation_notices [EXTRACTED 1.00]

## Communities (46 total, 4 thin omitted)

### Community 0 - "Frontend Dependencies"
Cohesion: 0.07
Nodes (29): @auth/mongodb-adapter, @base-ui/react, class-variance-authority, clsx, dependencies, @auth/mongodb-adapter, @base-ui/react, class-variance-authority (+21 more)

### Community 1 - "Dev Tooling"
Cohesion: 0.07
Nodes (27): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node (+19 more)

### Community 2 - "Backend MongoDB API"
Cohesion: 0.25
Nodes (7): AsyncIOMotorDatabase, close_mongo_connection(), connect_to_mongo(), get_database(), Open async MongoDB connection on app startup., Close MongoDB connection on app shutdown., Return the active database instance. Call after connect_to_mongo().

### Community 3 - "Agent Schemas"
Cohesion: 0.14
Nodes (20): ClarificationOutput, FeasibilityOutput, FinalReportOutput, InputUnderstandingOutput, Persona, PRDOutput, PRDSection, BaseModel (+12 more)

### Community 5 - "Chat Schemas"
Cohesion: 0.27
Nodes (9): ChatMessage, ChatSession, BaseModel, Represents an active chat session tied to a project., Request body to send a new message in a chat session., Response returned immediately after a message is accepted., Represents a single message in a chat session., SendMessageRequest (+1 more)

### Community 6 - "Health Tests"
Cohesion: 0.20
Nodes (8): mock_mongo(), GET /health should return 200 with status ok., Request to a protected route without a token should return 401., Request with an invalid bearer token should return 401., Patch MongoDB connect/disconnect so tests run without a real DB., test_health_check(), test_protected_route_invalid_token(), test_protected_route_no_token()

### Community 7 - "Package Metadata"
Cohesion: 0.06
Nodes (25): Project, ChatPage(), Message, WorkflowEvent, ReportsPage(), TabKey, TABS, ClarificationPanel() (+17 more)

### Community 8 - "Logging Config"
Cohesion: 0.08
Nodes (25): init_indexes(), Create all MongoDB indexes for the planify database., CorrelationIdFilter, Configure structured JSON logging for the application., Attach a unique correlation_id to every log record., setup_logging(), health_check(), lifespan() (+17 more)

### Community 9 - "Auth Middleware"
Cohesion: 0.36
Nodes (7): auth_middleware(), get_current_user(), Request, Verify HS256 JWT signature and return decoded claims., Extract bearer token from Authorization header and return verified user claims., Global HTTP middleware — verifies JWT on all non-public routes., verify_jwt()

### Community 10 - "Next.js Agent Docs"
Cohesion: 0.32
Nodes (8): frontend/AGENTS.md, Deprecation Notices, Next.js APIs, Next.js Breaking Changes Warning, Next.js Conventions, Next.js File Structure, node_modules/next/dist/docs/, frontend/CLAUDE.md

### Community 11 - "App Layout"
Cohesion: 0.40
Nodes (3): geistMono, geistSans, metadata

### Community 12 - "Context Schemas"
Cohesion: 0.40
Nodes (5): Constraint, ProjectContext, BaseModel, The shared context object that flows through all AI agents.     Changing one fie, Resource and regulatory constraints for a project.

### Community 14 - "DB Check Script"
Cohesion: 0.60
Nodes (4): fs, loadEnv(), main(), { MongoClient }

### Community 15 - "UI Components"
Cohesion: 0.70
Nodes (3): Button(), buttonVariants, cn()

### Community 18 - "NextAuth Types"
Cohesion: 0.40
Nodes (4): JWT, next-auth, next-auth/jwt, Session

### Community 26 - "ObjectId"
Cohesion: 0.14
Nodes (26): get_messages(), Request, Chat routes.  POST /api/projects/{id}/chat/messages  — send message + stream AI, Persists user message, then streams SSE events from the LangGraph workflow., send_message(), _assert_project_access(), create_project(), delete_project() (+18 more)

### Community 27 - "MongoCheckpointSaver"
Cohesion: 0.11
Nodes (10): AsyncIOMotorClient, generate_checkpointer(), MongoCheckpointSaver, Any, BaseCheckpointSaver, ChannelVersions, Checkpoint, CheckpointMetadata (+2 more)

### Community 28 - "run_workflow_and_stream"
Cohesion: 0.27
Nodes (9): _build_summary(), Chat Service.  Orchestrates the LangGraph workflow: 1. Load chat history from Mo, Format a dict as an SSE data line., Insert or update a generated_reports + report_versions entry., Build a human-readable assistant message summarising what was generated., Execute the LangGraph workflow and yield SSE data strings.     Persists all outp, run_workflow_and_stream(), _sse() (+1 more)

### Community 29 - "project.py"
Cohesion: 0.28
Nodes (8): CreateProjectRequest, ProjectListItem, ProjectResponse, BaseModel, Project-related Pydantic schemas for request/response models., Request body for creating a new project., Response schema for a single project., Lightweight project entry for list views.

### Community 30 - "final_report_agent"
Cohesion: 0.38
Nodes (6): _check_consistency(), final_report_agent(), Any, Final Report Agent.  Assembles all agent outputs into a coherent bundle. Runs co, Run basic cross-report consistency checks. Returns list of issue strings., LangGraph node: assemble all reports and run consistency checks.     Sets status

### Community 31 - "WorkflowState"
Cohesion: 0.33
Nodes (5): Config, BaseModel, LangGraph WorkflowState — the shared state object that flows through every agent, Shared state flowing through the LangGraph pipeline.      LangGraph passes this, WorkflowState

### Community 32 - "get_graph"
Cohesion: 0.40
Nodes (5): get_graph(), LangGraph Workflow Definition.  Compiles the full agent pipeline:   input_unders, Conditional edge: go to PRD or pause for user input., Build and compile the full LangGraph agent pipeline, attaching the checkpointer., _route_after_clarification()

### Community 33 - "clarification_agent"
Cohesion: 0.40
Nodes (4): clarification_agent(), Any, Clarification Agent.  Decides whether we have enough context to generate reports, LangGraph node: check context completeness and generate targeted questions.

### Community 34 - "feasibility_agent"
Cohesion: 0.40
Nodes (4): feasibility_agent(), Any, Feasibility Agent.  Assesses technical complexity, risks, and critical dependenc, LangGraph node: assess technical feasibility from PRD.

### Community 35 - "input_understanding_agent"
Cohesion: 0.40
Nodes (4): input_understanding_agent(), Any, Input Understanding Agent.  Extracts structured meaning from the raw user messag, LangGraph node: parse raw user input into structured project understanding.

### Community 36 - "get_llm"
Cohesion: 0.40
Nodes (4): get_llm(), LLM Provider Factory — Gemini → Mistral → Ollama fallback chain.  Usage:     fro, Return the best available LLM:       1. Google Gemini (GOOGLE_API_KEY)       2., BaseChatModel

### Community 37 - "prd_agent"
Cohesion: 0.40
Nodes (4): prd_agent(), Any, PRD Agent.  Generates a comprehensive Product Requirements Document from Project, LangGraph node: generate a comprehensive Product Requirements Document.

### Community 38 - "roadmap_agent"
Cohesion: 0.40
Nodes (4): Any, Roadmap Agent.  Generates a phase-by-phase project roadmap with milestones, dura, LangGraph node: generate prioritized project roadmap with milestones., roadmap_agent()

### Community 39 - "roi_agent"
Cohesion: 0.40
Nodes (4): Any, ROI Agent.  Generates a realistic financial model — cost ranges, team estimates,, LangGraph node: generate financial model and ROI scenarios., roi_agent()

## Knowledge Gaps
- **60 isolated node(s):** `Config`, `Project`, `geistSans`, `geistMono`, `metadata` (+55 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `run_workflow_and_stream()` connect `run_workflow_and_stream` to `get_graph`, `ObjectId`, `WorkflowState`?**
  _High betweenness centrality (0.129) - this node is a cross-community bridge._
- **Why does `WorkflowState` connect `WorkflowState` to `get_graph`, `clarification_agent`, `feasibility_agent`, `input_understanding_agent`, `prd_agent`, `roadmap_agent`, `roi_agent`, `run_workflow_and_stream`, `final_report_agent`?**
  _High betweenness centrality (0.128) - this node is a cross-community bridge._
- **Why does `get_graph()` connect `get_graph` to `MongoCheckpointSaver`, `run_workflow_and_stream`, `WorkflowState`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **Are the 9 inferred relationships involving `ObjectId` (e.g. with `complete_signup()` and `get_messages()`) actually correct?**
  _`ObjectId` has 9 INFERRED edges - model-reasoned connections that need verification._
- **Are the 7 inferred relationships involving `_assert_project_access()` (e.g. with `get_messages()` and `send_message()`) actually correct?**
  _`_assert_project_access()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `WorkflowState` (e.g. with `get_graph()` and `run_workflow_and_stream()`) actually correct?**
  _`WorkflowState` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Clarification Agent.  Decides whether we have enough context to generate reports`, `LangGraph node: check context completeness and generate targeted questions.`, `Feasibility Agent.  Assesses technical complexity, risks, and critical dependenc` to the rest of the system?**
  _133 weakly-connected nodes found - possible documentation gaps or missing edges._