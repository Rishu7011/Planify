# Graph Report - Planify  (2026-07-14)

## Corpus Check
- 114 files · ~49,957 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 700 nodes · 1118 edges · 71 communities (47 shown, 24 thin omitted)
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 104 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `07a87aae`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Frontend Dependencies
- Dev Tooling
- apply_workflow_guards
- Graphify Documentation
- route_after_project_workflow
- Health Tests
- Package Metadata
- Logging Config
- Auth Middleware
- Next.js Agent Docs
- App Layout
- Context Schemas
- NextAuth Integration
- DB Check Script
- ProjectsView.tsx
- Home Page
- mongodb.ts
- NextAuth Types
- App Init
- Schemas Init
- ObjectId
- Request
- page.tsx
- project.py
- final_report_agent
- WorkflowState
- get_graph
- route_after_project_workflow
- agents.ts
- input_understanding_agent
- get_llm
- prd_agent
- roadmap_agent
- page.tsx
- api.ts
- mongodb.ts
- __init__.py
- __init__.py
- Request
- Next.js Breaking Changes Warning
- Next.js Conventions
- Next.js File Structure
- node_modules/next/dist/docs/
- constants.ts
- providers.tsx
- useChatScroll.ts
- ProjectContext
- agents.ts
- export.py
- gather_rag_context
- mongodb.py
- project.py
- project_context.py
- get_embeddings
- init_db.py
- check-db.js
- llm.py
- route.ts
- ScrollToBottomButton.tsx
- __init__.py
- prompts.py

## God Nodes (most connected - your core abstractions)
1. `parse_object_id()` - 28 edges
2. `get_settings()` - 20 edges
3. `apply_workflow_guards()` - 19 edges
4. `_run_workflow_and_stream_locked()` - 18 edges
5. `_assert_project_access()` - 17 edges
6. `loginHref()` - 12 edges
7. `project_workflow_node()` - 11 edges
8. `WorkflowState` - 11 edges
9. `ProjectRepository` - 10 edges
10. `save_upload()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `test_should_run_web_search()` --calls--> `should_run_web_search()`  [INFERRED]
  backend/app/agent/test_workflow_guards.py → backend/app/agent/web_search.py
- `connect_to_mongo()` --calls--> `get_settings()`  [INFERRED]
  backend/app/db/mongodb.py → backend/app/config.py
- `get_sync_db()` --calls--> `get_settings()`  [INFERRED]
  backend/app/agent/db.py → backend/app/config.py
- `get_checkpointer()` --calls--> `get_settings()`  [INFERRED]
  backend/app/agent/db.py → backend/app/config.py
- `build_graph()` --calls--> `get_checkpointer()`  [INFERRED]
  backend/app/agent/graph.py → backend/app/agent/db.py

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Next.js Breaking Change Surfaces** — frontend_agents_nextjs_apis, frontend_agents_nextjs_conventions, frontend_agents_nextjs_file_structure, frontend_agents_deprecation_notices [EXTRACTED 1.00]

## Communities (71 total, 24 thin omitted)

### Community 0 - "Frontend Dependencies"
Cohesion: 0.05
Nodes (39): @auth/mongodb-adapter, @base-ui/react, bcryptjs, class-variance-authority, clsx, framer-motion, dependencies, @auth/mongodb-adapter (+31 more)

### Community 1 - "Dev Tooling"
Cohesion: 0.07
Nodes (29): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/bcryptjs (+21 more)

### Community 3 - "apply_workflow_guards"
Cohesion: 0.12
Nodes (33): Unit tests for deterministic workflow guards., test_apply_guards_forces_report_without_stack_or_budget(), test_apply_guards_rewrites_budget_questionnaire(), test_apply_guards_stops_discovery_loop(), test_detect_prd_request(), test_discovery_complete_soft_gates(), test_filter_drops_optional_budget_and_answered_features(), test_should_run_web_search() (+25 more)

### Community 5 - "route_after_project_workflow"
Cohesion: 0.31
Nodes (8): _normalize(), nodes/report_generator.py -------------------------- Universal report generator, Infer the primary report type from the user's message phrasing., Choose which report to generate this turn.      Priority:       1. Explicit matc, Universal report generator — trusts whatever the project_workflow LLM queued., _report_from_user_text(), report_generator_node(), _select_report_type()

### Community 6 - "Health Tests"
Cohesion: 0.09
Nodes (20): ConversationRepository, get_checkpointer(), get_conversation_repo(), get_db(), get_project_repo(), get_sync_db(), init_db(), _now() (+12 more)

### Community 8 - "Logging Config"
Cohesion: 0.17
Nodes (14): pdf.py ------ Standalone script to load, split, embed, and store document chunks, run_rag_indexing(), _extract_dimensions(), _get_client(), get_vector_store(), init_vector_search_index(), Any, vector_store.py --------------- MongoDB Atlas Vector Search for Planify's RAG sy (+6 more)

### Community 9 - "Auth Middleware"
Cohesion: 0.12
Nodes (21): ConversationCategory, ConversationUnderstandingOutput, FileIntent, NextWorkflow, ProjectAction, ProjectContext, ProjectWorkflowOutput, Any (+13 more)

### Community 11 - "App Layout"
Cohesion: 0.29
Nodes (5): geistMono, geistSans, metadata, viewport, Providers()

### Community 12 - "Context Schemas"
Cohesion: 0.14
Nodes (21): assetAccent(), assetIcon(), AssetsView(), AssetsViewProps, DashboardAsset, LayoutMode, normalizeType(), prettyLabel() (+13 more)

### Community 13 - "NextAuth Integration"
Cohesion: 0.18
Nodes (23): POST(), POST(), POST(), appBaseUrl(), POST(), GET(), getTransporter(), sendPasswordOtpEmail() (+15 more)

### Community 14 - "DB Check Script"
Cohesion: 0.38
Nodes (6): _deep_merge(), _history_text(), project_workflow_node(), nodes/project_workflow.py -------------------------- The Project Workflow Agent, Merge the LLM's extracted context patch into the existing context dict.      Rul, Full Project Workflow Agent.      Reads project_context → invokes LLM → merges c

### Community 15 - "ProjectsView.tsx"
Cohesion: 0.27
Nodes (9): DashboardProject, LayoutMode, matchesStatus(), ProjectsView(), ProjectsViewProps, SortKey, StatusFilter, statusMeta() (+1 more)

### Community 16 - "Home Page"
Cohesion: 0.10
Nodes (24): ForgotPasswordPage(), LoginForm(), SetPasswordForm(), SignupPage(), AppEntryCta(), AppEntryCtaProps, AuthShell(), ChangePasswordOtpForm() (+16 more)

### Community 17 - "mongodb.ts"
Cohesion: 0.16
Nodes (12): build_graph(), graph.py -------- Assembles the LangGraph StateGraph.  Flow:      START       │, Builds and compiles the top-level workflow graph., Routes to project_workflow for PROJECT messages, END for general chat., route_after_conversation_understanding(), build_initial_state(), state.py -------- Defines the shared LangGraph workflow state.  This is the sing, Central state object shared across all graph nodes.      Attributes:         use (+4 more)

### Community 18 - "NextAuth Types"
Cohesion: 0.40
Nodes (4): JWT, next-auth, next-auth/jwt, Session

### Community 26 - "ObjectId"
Cohesion: 0.06
Nodes (68): complete_signup(), get_me(), BaseModel, Request, update_workspace(), UpdateWorkspaceRequest, get_messages(), Request (+60 more)

### Community 27 - "Request"
Cohesion: 0.27
Nodes (10): get_settings(), Application configuration via environment variables., Settings, auth_middleware(), get_current_user(), _is_public_path(), Request, JWT authentication middleware. (+2 more)

### Community 28 - "page.tsx"
Cohesion: 0.33
Nodes (5): CorrelationIdFilter, Structured JSON logging configuration., setup_logging(), Logger, LogRecord

### Community 29 - "project.py"
Cohesion: 0.26
Nodes (13): extract_text_from_bytes(), format_files_for_prompt(), load_files_for_message(), project_upload_dir(), Any, ObjectId, UploadFile, Project file uploads — disk storage + text extraction for agent context. (+5 more)

### Community 32 - "get_graph"
Cohesion: 0.18
Nodes (16): build_project_search_queries(), clean_user_message(), gather_web_intel(), get_duckduckgo_search_tool(), is_light_message(), Any, web_search.py ------------- DuckDuckGo web search via LangChain Community:    fr, Run DuckDuckGoSearchTool and return a plain-text result string. (+8 more)

### Community 33 - "route_after_project_workflow"
Cohesion: 0.29
Nodes (9): router.py --------- Conditional-edge routing functions. Kept separate from node, Routes to report_generator only for real report workflow names.      Non-report, route_after_project_workflow(), test_route_after_project_workflow_discovery_complete_report_allowed(), test_route_after_project_workflow_discovery_incomplete_report_blocked(), test_route_after_project_workflow_general_no_action(), test_route_after_project_workflow_user_requested_report_allowed_even_if_discovery_incomplete(), test_route_ends_when_only_non_report_workflows() (+1 more)

### Community 34 - "agents.ts"
Cohesion: 0.38
Nodes (5): conversation_understanding_node(), _has_active_project(), nodes/conversation_understanding.py ------------------------------------ The ent, True when enough project context already exists that a follow-up     should neve, Classifies the user's message and routes / responds accordingly.

### Community 39 - "page.tsx"
Cohesion: 0.36
Nodes (6): ChatHistoryResponse, ChatMessageResponse, FileAttachmentMeta, BaseModel, Chat-related schemas., SendMessageRequest

### Community 40 - "api.ts"
Cohesion: 0.50
Nodes (4): main(), main.py ------- Simple CLI runner for local testing. Requires a running Ollama s, Runs a single conversational turn through the graph with persistence., run_turn()

### Community 42 - "__init__.py"
Cohesion: 0.08
Nodes (40): DashboardPage(), NavView, ChatHistoryResponse, ChatPage(), createStreamingMessage(), getMemoryTone(), isWorkflowEvent(), MemoryItem (+32 more)

### Community 51 - "constants.ts"
Cohesion: 0.21
Nodes (5): FADE_UP, MESSAGE_SPRING, Props, Props, Props

### Community 55 - "ProjectContext"
Cohesion: 0.27
Nodes (6): create_app(), lifespan(), Planify FastAPI application entry point., ObjectId parsing helpers — return 400 instead of raw InvalidId 500s., Health check endpoint tests., FastAPI

### Community 56 - "agents.ts"
Cohesion: 0.20
Nodes (7): AGENT_META, AGENT_ORDER, AgentKey, AgentMeta, DISCOVERY_META, FALLBACK_META, SIDEBAR_STAGES

### Community 57 - "export.py"
Cohesion: 0.44
Nodes (8): export_docx(), export_pdf(), _load_all_reports(), Request, Export routes — PDF and DOCX download., _report_markdown(), _reports_to_html(), _safe_filename()

### Community 58 - "gather_rag_context"
Cohesion: 0.39
Nodes (7): _build_query(), gather_rag_context(), Any, retrieve.py ----------- Retrieve relevant chunks from the Planify knowledge base, Skip retrieval on greetings / empty turns unless forced (reports)., Return formatted knowledge-base excerpts, or a stub when unavailable., should_run_rag()

### Community 59 - "mongodb.py"
Cohesion: 0.33
Nodes (4): AsyncIOMotorDatabase, connect_to_mongo(), get_database(), Async MongoDB connection for FastAPI.

### Community 60 - "project.py"
Cohesion: 0.47
Nodes (5): CreateProjectRequest, ProjectDetailResponse, BaseModel, Project-related schemas., UpdateProjectRequest

### Community 61 - "project_context.py"
Cohesion: 0.53
Nodes (5): build_memory_items(), empty_context_object(), enrich_project_response(), Any, Helpers for mapping agent project context to API responses.

### Community 62 - "get_embeddings"
Cohesion: 0.40
Nodes (4): get_embeddings(), embeddings.py ------------- Instantiates the embedding provider (Gemini, Mistral, Returns the configured langchain Embeddings instance., Embeddings

### Community 63 - "init_db.py"
Cohesion: 0.50
Nodes (4): init_indexes(), MongoDB index initialization., Create an index, ignoring conflicts with existing equivalent indexes., _safe_create_index()

### Community 64 - "check-db.js"
Cohesion: 0.60
Nodes (4): fs, loadEnv(), main(), { MongoClient }

### Community 65 - "llm.py"
Cohesion: 0.28
Nodes (8): _active_model_name(), get_base_llm(), get_provider_info(), get_structured_llm(), llm.py ------ Multi-provider LLM instantiation for Planify agents.  Switch provi, Returns a structured-output chain backed by the active provider.      Wrapped wi, Returns provider metadata for logging / health checks., Returns a cached LLM instance for the configured provider.

## Knowledge Gaps
- **114 isolated node(s):** `NavView`, `Message`, `ChatHistoryResponse`, `MemoryItem`, `WorkflowEventType` (+109 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **24 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `project_workflow_node()` connect `DB Check Script` to `get_graph`, `agents.ts`, `apply_workflow_guards`, `mongodb.ts`, `gather_rag_context`?**
  _High betweenness centrality (0.089) - this node is a cross-community bridge._
- **Why does `get_settings()` connect `Request` to `ObjectId`, `Health Tests`, `Logging Config`, `ProjectContext`, `gather_rag_context`, `mongodb.py`, `project.py`, `get_embeddings`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **Why does `apply_workflow_guards()` connect `apply_workflow_guards` to `Auth Middleware`, `DB Check Script`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._
- **Are the 26 inferred relationships involving `parse_object_id()` (e.g. with `complete_signup()` and `get_me()`) actually correct?**
  _`parse_object_id()` has 26 INFERRED edges - model-reasoned connections that need verification._
- **Are the 18 inferred relationships involving `get_settings()` (e.g. with `get_checkpointer()` and `get_db()`) actually correct?**
  _`get_settings()` has 18 INFERRED edges - model-reasoned connections that need verification._
- **Are the 4 inferred relationships involving `apply_workflow_guards()` (e.g. with `project_workflow_node()` and `test_apply_guards_forces_report_without_stack_or_budget()`) actually correct?**
  _`apply_workflow_guards()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `_run_workflow_and_stream_locked()` (e.g. with `build_initial_state()` and `format_files_for_prompt()`) actually correct?**
  _`_run_workflow_and_stream_locked()` has 3 INFERRED edges - model-reasoned connections that need verification._