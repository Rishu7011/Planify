# Graph Report - Planify  (2026-07-14)

## Corpus Check
- 114 files · ~48,360 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 693 nodes · 1192 edges · 58 communities (36 shown, 22 thin omitted)
- Extraction: 89% EXTRACTED · 11% INFERRED · 0% AMBIGUOUS · INFERRED: 131 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `db0f5145`
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
- providers.tsx
- useChatScroll.ts
- ProjectContext
- llm.py
- __init__.py
- prompts.py

## God Nodes (most connected - your core abstractions)
1. `parse_object_id()` - 28 edges
2. `get_database()` - 26 edges
3. `get_settings()` - 20 edges
4. `apply_workflow_guards()` - 19 edges
5. `_run_workflow_and_stream_locked()` - 19 edges
6. `_assert_project_access()` - 17 edges
7. `ChatPage()` - 12 edges
8. `loginHref()` - 12 edges
9. `project_workflow_node()` - 11 edges
10. `WorkflowState` - 11 edges

## Surprising Connections (you probably didn't know these)
- `get_sync_db()` --calls--> `get_settings()`  [INFERRED]
  backend/app/agent/db.py → backend/app/config.py
- `get_checkpointer()` --calls--> `get_settings()`  [INFERRED]
  backend/app/agent/db.py → backend/app/config.py
- `build_graph()` --calls--> `get_checkpointer()`  [INFERRED]
  backend/app/agent/graph.py → backend/app/agent/db.py
- `get_db()` --calls--> `get_settings()`  [INFERRED]
  backend/app/agent/db.py → backend/app/config.py
- `init_db()` --calls--> `get_settings()`  [INFERRED]
  backend/app/agent/db.py → backend/app/config.py

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Next.js Breaking Change Surfaces** — frontend_agents_nextjs_apis, frontend_agents_nextjs_conventions, frontend_agents_nextjs_file_structure, frontend_agents_deprecation_notices [EXTRACTED 1.00]

## Communities (58 total, 22 thin omitted)

### Community 0 - "Frontend Dependencies"
Cohesion: 0.05
Nodes (39): @auth/mongodb-adapter, @base-ui/react, bcryptjs, class-variance-authority, clsx, framer-motion, dependencies, @auth/mongodb-adapter (+31 more)

### Community 1 - "Dev Tooling"
Cohesion: 0.07
Nodes (29): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/bcryptjs (+21 more)

### Community 3 - "apply_workflow_guards"
Cohesion: 0.13
Nodes (30): Unit tests for deterministic workflow guards., test_apply_guards_forces_report_without_stack_or_budget(), test_apply_guards_rewrites_budget_questionnaire(), test_apply_guards_stops_discovery_loop(), test_detect_prd_request(), test_discovery_complete_soft_gates(), test_filter_drops_optional_budget_and_answered_features(), apply_workflow_guards() (+22 more)

### Community 5 - "route_after_project_workflow"
Cohesion: 0.31
Nodes (8): _normalize(), nodes/report_generator.py -------------------------- Universal report generator, Infer the primary report type from the user's message phrasing., Choose which report to generate this turn.      Priority:       1. Explicit matc, Universal report generator — trusts whatever the project_workflow LLM queued., _report_from_user_text(), report_generator_node(), _select_report_type()

### Community 6 - "Health Tests"
Cohesion: 0.09
Nodes (20): ConversationRepository, get_checkpointer(), get_conversation_repo(), get_db(), get_project_repo(), get_sync_db(), init_db(), _now() (+12 more)

### Community 8 - "Logging Config"
Cohesion: 0.05
Nodes (49): get_embeddings(), embeddings.py ------------- Instantiates the embedding provider (Gemini, Mistral, Returns the configured langchain Embeddings instance., pdf.py ------ Standalone script to load, split, embed, and store document chunks, run_rag_indexing(), _build_query(), gather_rag_context(), Any (+41 more)

### Community 9 - "Auth Middleware"
Cohesion: 0.12
Nodes (19): ConversationCategory, ConversationUnderstandingOutput, NextWorkflow, ProjectAction, ProjectContext, ProjectWorkflowOutput, Any, BaseModel (+11 more)

### Community 11 - "App Layout"
Cohesion: 0.29
Nodes (5): geistMono, geistSans, metadata, viewport, Providers()

### Community 12 - "Context Schemas"
Cohesion: 0.13
Nodes (25): Comment, ReportsPage(), SAMPLE_COMMENTS, Version, assetAccent(), assetIcon(), AssetsView(), AssetsViewProps (+17 more)

### Community 13 - "NextAuth Integration"
Cohesion: 0.15
Nodes (26): handler, POST(), POST(), POST(), appBaseUrl(), POST(), GET(), authOptions (+18 more)

### Community 14 - "DB Check Script"
Cohesion: 0.36
Nodes (6): _deep_merge(), _history_text(), project_workflow_node(), nodes/project_workflow.py -------------------------- The Project Workflow Agent, Merge the LLM's extracted context patch into the existing context dict.      Rul, Full Project Workflow Agent.      Reads project_context → invokes LLM → merges c

### Community 15 - "ProjectsView.tsx"
Cohesion: 0.27
Nodes (9): DashboardProject, LayoutMode, matchesStatus(), ProjectsView(), ProjectsViewProps, SortKey, StatusFilter, statusMeta() (+1 more)

### Community 16 - "Home Page"
Cohesion: 0.11
Nodes (22): ForgotPasswordPage(), LoginForm(), SetPasswordForm(), SignupPage(), AppEntryCta(), AppEntryCtaProps, AuthShell(), Footer() (+14 more)

### Community 17 - "mongodb.ts"
Cohesion: 0.29
Nodes (6): build_graph(), graph.py -------- Assembles the LangGraph StateGraph.  Flow:      START       │, Builds and compiles the top-level workflow graph., Routes to project_workflow for PROJECT messages, END for general chat., route_after_conversation_understanding(), CompiledStateGraph

### Community 18 - "NextAuth Types"
Cohesion: 0.40
Nodes (4): JWT, next-auth, next-auth/jwt, Session

### Community 26 - "ObjectId"
Cohesion: 0.07
Nodes (62): AsyncIOMotorDatabase, get_database(), complete_signup(), get_me(), BaseModel, Request, update_workspace(), UpdateWorkspaceRequest (+54 more)

### Community 27 - "Request"
Cohesion: 0.33
Nodes (6): build_initial_state(), state.py -------- Defines the shared LangGraph workflow state.  This is the sing, Central state object shared across all graph nodes.      Attributes:         use, Convenience factory for a fresh conversation state., WorkflowState, TypedDict

### Community 28 - "page.tsx"
Cohesion: 0.33
Nodes (5): CorrelationIdFilter, Structured JSON logging configuration., setup_logging(), Logger, LogRecord

### Community 29 - "project.py"
Cohesion: 0.26
Nodes (13): extract_text_from_bytes(), format_files_for_prompt(), load_files_for_message(), project_upload_dir(), Any, ObjectId, UploadFile, Project file uploads — disk storage + text extraction for agent context. (+5 more)

### Community 32 - "get_graph"
Cohesion: 0.20
Nodes (14): build_project_search_queries(), gather_web_intel(), get_duckduckgo_search_tool(), is_light_message(), Any, web_search.py ------------- DuckDuckGo web search via LangChain Community:    fr, Run DuckDuckGoSearchTool and return a plain-text result string., Build a small set of search queries (default 1 — keep latency low). (+6 more)

### Community 33 - "route_after_project_workflow"
Cohesion: 0.29
Nodes (9): router.py --------- Conditional-edge routing functions. Kept separate from node, Routes to report_generator only for real report workflow names.      Non-report, route_after_project_workflow(), test_route_after_project_workflow_discovery_complete_report_allowed(), test_route_after_project_workflow_discovery_incomplete_report_blocked(), test_route_after_project_workflow_general_no_action(), test_route_after_project_workflow_user_requested_report_allowed_even_if_discovery_incomplete(), test_route_ends_when_only_non_report_workflows() (+1 more)

### Community 34 - "agents.ts"
Cohesion: 0.40
Nodes (5): conversation_understanding_node(), _has_active_project(), nodes/conversation_understanding.py ------------------------------------ The ent, True when enough project context already exists that a follow-up     should neve, Classifies the user's message and routes / responds accordingly.

### Community 39 - "page.tsx"
Cohesion: 0.36
Nodes (6): ChatHistoryResponse, ChatMessageResponse, FileAttachmentMeta, BaseModel, Chat-related schemas., SendMessageRequest

### Community 40 - "api.ts"
Cohesion: 0.50
Nodes (4): main(), main.py ------- Simple CLI runner for local testing. Requires a running Ollama s, Runs a single conversational turn through the graph with persistence., run_turn()

### Community 42 - "__init__.py"
Cohesion: 0.05
Nodes (58): DashboardPage(), NavView, ChatHistoryResponse, ChatPage(), createStreamingMessage(), getMemoryTone(), isWorkflowEvent(), MemoryItem (+50 more)

### Community 55 - "ProjectContext"
Cohesion: 0.14
Nodes (28): _build_report_content(), _default_discovery_options(), _discovery_options_for_question(), _emit_content_deltas(), _extract_ai_content(), _extract_clarification_questions(), _frontend_agent_for_node(), _lock_for_project() (+20 more)

### Community 65 - "llm.py"
Cohesion: 0.27
Nodes (9): _best_ollama_model(), get_base_llm(), get_provider_info(), get_structured_llm(), llm.py ------ LLM instantiation — Ollama only, model: mistral:latest.  Change OL, Returns the configured Ollama model name (env override or default)., Returns a cached ChatOllama instance using the best available model., Returns a structured-output chain backed by the best Ollama model.      Ollama s (+1 more)

## Knowledge Gaps
- **107 isolated node(s):** `handler`, `NavView`, `geistSans`, `geistMono`, `metadata` (+102 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **22 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `project_workflow_node()` connect `DB Check Script` to `get_graph`, `apply_workflow_guards`, `Logging Config`, `mongodb.ts`, `Request`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Why does `get_settings()` connect `Logging Config` to `ObjectId`, `project.py`, `Health Tests`?**
  _High betweenness centrality (0.080) - this node is a cross-community bridge._
- **Why does `apply_workflow_guards()` connect `apply_workflow_guards` to `Auth Middleware`, `DB Check Script`?**
  _High betweenness centrality (0.069) - this node is a cross-community bridge._
- **Are the 26 inferred relationships involving `parse_object_id()` (e.g. with `complete_signup()` and `get_me()`) actually correct?**
  _`parse_object_id()` has 26 INFERRED edges - model-reasoned connections that need verification._
- **Are the 24 inferred relationships involving `get_database()` (e.g. with `init_indexes()` and `complete_signup()`) actually correct?**
  _`get_database()` has 24 INFERRED edges - model-reasoned connections that need verification._
- **Are the 18 inferred relationships involving `get_settings()` (e.g. with `get_checkpointer()` and `get_db()`) actually correct?**
  _`get_settings()` has 18 INFERRED edges - model-reasoned connections that need verification._
- **Are the 4 inferred relationships involving `apply_workflow_guards()` (e.g. with `project_workflow_node()` and `test_apply_guards_forces_report_without_stack_or_budget()`) actually correct?**
  _`apply_workflow_guards()` has 4 INFERRED edges - model-reasoned connections that need verification._