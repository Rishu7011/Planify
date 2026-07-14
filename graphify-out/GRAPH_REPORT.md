# Graph Report - Planify  (2026-07-14)

## Corpus Check
- 114 files · ~51,011 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 708 nodes · 1066 edges · 66 communities (42 shown, 24 thin omitted)
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 104 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `10d4a78c`
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
- api.ts
- input_understanding_agent
- get_llm
- prd_agent
- roadmap_agent
- ChatMessage.tsx
- page.tsx
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
- project_context.py
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
6. `project_workflow_node()` - 11 edges
7. `WorkflowState` - 11 edges
8. `ProjectRepository` - 10 edges
9. `save_upload()` - 10 edges
10. `build_graph()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `test_should_run_web_search()` --calls--> `should_run_web_search()`  [INFERRED]
  backend/app/agent/test_workflow_guards.py → backend/app/agent/web_search.py
- `get_sync_db()` --calls--> `get_settings()`  [INFERRED]
  backend/app/agent/db.py → backend/app/config.py
- `get_checkpointer()` --calls--> `get_settings()`  [INFERRED]
  backend/app/agent/db.py → backend/app/config.py
- `build_graph()` --calls--> `get_checkpointer()`  [INFERRED]
  backend/app/agent/graph.py → backend/app/agent/db.py
- `get_db()` --calls--> `get_settings()`  [INFERRED]
  backend/app/agent/db.py → backend/app/config.py

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Next.js Breaking Change Surfaces** — frontend_agents_nextjs_apis, frontend_agents_nextjs_conventions, frontend_agents_nextjs_file_structure, frontend_agents_deprecation_notices [EXTRACTED 1.00]

## Communities (66 total, 24 thin omitted)

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
Cohesion: 0.12
Nodes (9): AppEntryCta(), AppEntryCtaProps, FOOTER_COLS, SOCIAL, containerVariants, FEATURES, itemVariants, LOGOS (+1 more)

### Community 6 - "Health Tests"
Cohesion: 0.08
Nodes (24): ConversationRepository, get_checkpointer(), get_conversation_repo(), get_db(), get_project_repo(), get_sync_db(), init_db(), _now() (+16 more)

### Community 8 - "Logging Config"
Cohesion: 0.05
Nodes (49): AsyncIOMotorDatabase, get_embeddings(), embeddings.py ------------- Instantiates the embedding provider (Gemini, Mistral, Returns the configured langchain Embeddings instance., pdf.py ------ Standalone script to load, split, embed, and store document chunks, run_rag_indexing(), _build_query(), gather_rag_context() (+41 more)

### Community 9 - "Auth Middleware"
Cohesion: 0.12
Nodes (21): ConversationCategory, ConversationUnderstandingOutput, FileIntent, NextWorkflow, ProjectAction, ProjectContext, ProjectWorkflowOutput, Any (+13 more)

### Community 11 - "App Layout"
Cohesion: 0.29
Nodes (5): geistMono, geistSans, metadata, viewport, Providers()

### Community 12 - "Context Schemas"
Cohesion: 0.22
Nodes (11): Props, ReportMarkdownBody(), ChatMarkdown(), Props, hasReportContent(), REPORT_TABS, ReportContent, reportMarkdownBody() (+3 more)

### Community 13 - "NextAuth Integration"
Cohesion: 0.18
Nodes (23): POST(), POST(), POST(), appBaseUrl(), POST(), GET(), getTransporter(), sendPasswordOtpEmail() (+15 more)

### Community 14 - "DB Check Script"
Cohesion: 0.32
Nodes (9): AUTH_PAGES, isAuthPage(), isProtectedPath(), loginHref(), PROTECTED_PREFIXES, ROUTES, safeCallbackUrl(), config (+1 more)

### Community 15 - "ProjectsView.tsx"
Cohesion: 0.13
Nodes (20): NavView, assetAccent(), assetIcon(), AssetsView(), AssetsViewProps, DashboardAsset, LayoutMode, normalizeType() (+12 more)

### Community 16 - "Home Page"
Cohesion: 0.11
Nodes (11): AuthShell(), ChangePasswordOtpForm(), ChangePasswordOtpFormProps, DEFAULT_PREFS, loadPrefs(), MeResponse, Prefs, savePrefs() (+3 more)

### Community 17 - "mongodb.ts"
Cohesion: 0.12
Nodes (31): build_initial_state(), state.py -------- Defines the shared LangGraph workflow state.  This is the sing, Convenience factory for a fresh conversation state., _build_report_content(), _default_discovery_options(), _discovery_options_for_question(), _emit_content_deltas(), _extract_ai_content() (+23 more)

### Community 18 - "NextAuth Types"
Cohesion: 0.40
Nodes (4): JWT, next-auth, next-auth/jwt, Session

### Community 26 - "ObjectId"
Cohesion: 0.07
Nodes (49): complete_signup(), get_me(), BaseModel, Request, update_workspace(), UpdateWorkspaceRequest, get_dashboard_stats(), get_recent_runs() (+41 more)

### Community 27 - "Request"
Cohesion: 0.25
Nodes (9): get_messages(), Request, ChatHistoryResponse, ChatMessageResponse, FileAttachmentMeta, BaseModel, Chat-related schemas., SendMessageRequest (+1 more)

### Community 28 - "page.tsx"
Cohesion: 0.33
Nodes (5): CorrelationIdFilter, Structured JSON logging configuration., setup_logging(), Logger, LogRecord

### Community 29 - "project.py"
Cohesion: 0.25
Nodes (14): extract_text_from_bytes(), format_files_for_prompt(), load_files_for_message(), project_upload_dir(), Any, ObjectId, UploadFile, Project file uploads — disk storage + text extraction for agent context. (+6 more)

### Community 32 - "get_graph"
Cohesion: 0.05
Nodes (53): build_graph(), graph.py -------- Assembles the LangGraph StateGraph.  Flow:      START       │, Builds and compiles the top-level workflow graph., conversation_understanding_node(), _has_active_project(), nodes/conversation_understanding.py ------------------------------------ The ent, True when enough project context already exists that a follow-up     should neve, Classifies the user's message and routes / responds accordingly. (+45 more)

### Community 33 - "route_after_project_workflow"
Cohesion: 0.70
Nodes (3): Button(), buttonVariants, cn()

### Community 34 - "api.ts"
Cohesion: 0.33
Nodes (8): api, ApiError, apiFetch(), apiStream(), apiUpload(), formatApiError(), isApiError(), readErrorDetail()

### Community 39 - "ChatMessage.tsx"
Cohesion: 0.40
Nodes (5): AgentMeta, ChatMessage(), ChatMessageData, formatBytes(), Props

### Community 40 - "page.tsx"
Cohesion: 0.40
Nodes (3): Comment, SAMPLE_COMMENTS, Version

### Community 42 - "__init__.py"
Cohesion: 0.27
Nodes (9): ChatHistoryResponse, ChatPage(), createStreamingMessage(), getMemoryTone(), isWorkflowEvent(), MemoryItem, Message, WorkflowEvent (+1 more)

### Community 51 - "constants.ts"
Cohesion: 0.21
Nodes (5): FADE_UP, MESSAGE_SPRING, Props, Props, Props

### Community 55 - "ProjectContext"
Cohesion: 0.50
Nodes (4): ChatComposer(), formatBytes(), PendingAttachment, Props

### Community 56 - "agents.ts"
Cohesion: 0.20
Nodes (7): AGENT_META, AGENT_ORDER, AgentKey, AgentMeta, DISCOVERY_META, FALLBACK_META, SIDEBAR_STAGES

### Community 61 - "project_context.py"
Cohesion: 0.53
Nodes (5): build_memory_items(), empty_context_object(), enrich_project_response(), Any, Helpers for mapping agent project context to API responses.

### Community 64 - "check-db.js"
Cohesion: 0.60
Nodes (4): fs, loadEnv(), main(), { MongoClient }

### Community 65 - "llm.py"
Cohesion: 0.28
Nodes (8): _active_model_name(), get_base_llm(), get_provider_info(), get_structured_llm(), llm.py ------ Multi-provider LLM instantiation for Planify agents.  Switch provi, Returns a structured-output chain backed by the active provider.      Wrapped wi, Returns provider metadata for logging / health checks., Returns a cached LLM instance for the configured provider.

## Knowledge Gaps
- **122 isolated node(s):** `NavView`, `Message`, `ChatHistoryResponse`, `MemoryItem`, `WorkflowEventType` (+117 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **24 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `project_workflow_node()` connect `get_graph` to `Logging Config`, `apply_workflow_guards`?**
  _High betweenness centrality (0.087) - this node is a cross-community bridge._
- **Why does `get_settings()` connect `Logging Config` to `project.py`, `Health Tests`?**
  _High betweenness centrality (0.077) - this node is a cross-community bridge._
- **Why does `apply_workflow_guards()` connect `apply_workflow_guards` to `get_graph`, `Auth Middleware`?**
  _High betweenness centrality (0.069) - this node is a cross-community bridge._
- **Are the 26 inferred relationships involving `parse_object_id()` (e.g. with `complete_signup()` and `get_me()`) actually correct?**
  _`parse_object_id()` has 26 INFERRED edges - model-reasoned connections that need verification._
- **Are the 18 inferred relationships involving `get_settings()` (e.g. with `get_checkpointer()` and `get_db()`) actually correct?**
  _`get_settings()` has 18 INFERRED edges - model-reasoned connections that need verification._
- **Are the 4 inferred relationships involving `apply_workflow_guards()` (e.g. with `project_workflow_node()` and `test_apply_guards_forces_report_without_stack_or_budget()`) actually correct?**
  _`apply_workflow_guards()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `_run_workflow_and_stream_locked()` (e.g. with `build_initial_state()` and `format_files_for_prompt()`) actually correct?**
  _`_run_workflow_and_stream_locked()` has 3 INFERRED edges - model-reasoned connections that need verification._