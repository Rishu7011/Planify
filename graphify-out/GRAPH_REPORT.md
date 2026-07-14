# Graph Report - Planify  (2026-07-14)

## Corpus Check
- 104 files · ~43,380 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 616 nodes · 1004 edges · 48 communities (28 shown, 20 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 70 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `146becc0`
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
- NextAuth Types
- App Init
- Schemas Init
- ObjectId
- project.py
- final_report_agent
- WorkflowState
- get_graph
- input_understanding_agent
- get_llm
- prd_agent
- roadmap_agent
- mongodb.ts
- __init__.py
- __init__.py
- Request
- Next.js Breaking Changes Warning
- Next.js Conventions
- Next.js File Structure
- node_modules/next/dist/docs/
- ProjectContext
- llm.py
- __init__.py
- prompts.py

## God Nodes (most connected - your core abstractions)
1. `get_database()` - 23 edges
2. `apply_workflow_guards()` - 19 edges
3. `run_workflow_and_stream()` - 17 edges
4. `_assert_project_access()` - 14 edges
5. `loginHref()` - 12 edges
6. `WorkflowState` - 11 edges
7. `usersCollection()` - 11 edges
8. `ROUTES` - 11 edges
9. `build_graph()` - 10 edges
10. `project_workflow_node()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `build_graph()` --calls--> `get_checkpointer()`  [INFERRED]
  backend/app/agent/graph.py → backend/app/agent/db.py
- `main()` --calls--> `init_db()`  [INFERRED]
  backend/app/agent/main.py → backend/app/agent/db.py
- `project_workflow_node()` --calls--> `apply_workflow_guards()`  [INFERRED]
  backend/app/agent/nodes/project_workflow.py → backend/app/agent/workflow_guards.py
- `test_route_after_project_workflow_discovery_complete_report_allowed()` --calls--> `route_after_project_workflow()`  [INFERRED]
  backend/app/agent/test_router.py → backend/app/agent/router.py
- `test_route_after_project_workflow_discovery_incomplete_report_blocked()` --calls--> `route_after_project_workflow()`  [INFERRED]
  backend/app/agent/test_router.py → backend/app/agent/router.py

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Next.js Breaking Change Surfaces** — frontend_agents_nextjs_apis, frontend_agents_nextjs_conventions, frontend_agents_nextjs_file_structure, frontend_agents_deprecation_notices [EXTRACTED 1.00]

## Communities (48 total, 20 thin omitted)

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
Cohesion: 0.25
Nodes (7): main(), main.py ------- Simple CLI runner for local testing. Requires a running Ollama s, Runs a single conversational turn through the graph with persistence., run_turn(), build_initial_state(), state.py -------- Defines the shared LangGraph workflow state.  This is the sing, Convenience factory for a fresh conversation state.

### Community 6 - "Health Tests"
Cohesion: 0.09
Nodes (22): ConversationRepository, get_checkpointer(), get_db(), get_sync_db(), init_db(), _now(), ProjectRepository, Any (+14 more)

### Community 8 - "Logging Config"
Cohesion: 0.09
Nodes (26): get_settings(), Application configuration via environment variables., Settings, init_indexes(), MongoDB index initialization., Create an index, ignoring conflicts with existing equivalent indexes., _safe_create_index(), close_mongo_connection() (+18 more)

### Community 9 - "Auth Middleware"
Cohesion: 0.12
Nodes (19): ConversationCategory, ConversationUnderstandingOutput, NextWorkflow, ProjectAction, ProjectContext, ProjectWorkflowOutput, Any, BaseModel (+11 more)

### Community 11 - "App Layout"
Cohesion: 0.33
Nodes (4): geistMono, geistSans, metadata, Providers()

### Community 12 - "Context Schemas"
Cohesion: 0.07
Nodes (40): DashboardPage(), NavView, Comment, ReportsPage(), SAMPLE_COMMENTS, Version, ChangePasswordOtpForm(), ChangePasswordOtpFormProps (+32 more)

### Community 13 - "NextAuth Integration"
Cohesion: 0.15
Nodes (26): handler, POST(), POST(), POST(), appBaseUrl(), POST(), GET(), authOptions (+18 more)

### Community 14 - "DB Check Script"
Cohesion: 0.60
Nodes (4): fs, loadEnv(), main(), { MongoClient }

### Community 15 - "ProjectsView.tsx"
Cohesion: 0.27
Nodes (9): DashboardProject, LayoutMode, matchesStatus(), ProjectsView(), ProjectsViewProps, SortKey, StatusFilter, statusMeta() (+1 more)

### Community 16 - "Home Page"
Cohesion: 0.11
Nodes (22): ForgotPasswordPage(), LoginForm(), SetPasswordForm(), SignupPage(), AppEntryCta(), AppEntryCtaProps, AuthShell(), Footer() (+14 more)

### Community 18 - "NextAuth Types"
Cohesion: 0.40
Nodes (4): JWT, next-auth, next-auth/jwt, Session

### Community 26 - "ObjectId"
Cohesion: 0.08
Nodes (47): AsyncIOMotorDatabase, get_database(), complete_signup(), get_me(), Request, update_workspace(), get_messages(), Request (+39 more)

### Community 29 - "project.py"
Cohesion: 0.50
Nodes (4): CreateProjectRequest, ProjectDetailResponse, BaseModel, Project-related schemas.

### Community 32 - "get_graph"
Cohesion: 0.05
Nodes (51): build_graph(), graph.py -------- Assembles the LangGraph StateGraph.  Flow:      START       │, Builds and compiles the top-level workflow graph., conversation_understanding_node(), _has_active_project(), nodes/conversation_understanding.py ------------------------------------ The ent, True when enough project context already exists that a follow-up     should neve, Classifies the user's message and routes / responds accordingly. (+43 more)

### Community 42 - "__init__.py"
Cohesion: 0.07
Nodes (36): ChatHistoryResponse, ChatPage(), createStreamingMessage(), getMemoryTone(), isWorkflowEvent(), MemoryItem, Message, WorkflowEvent (+28 more)

### Community 55 - "ProjectContext"
Cohesion: 0.16
Nodes (25): _build_report_content(), _default_discovery_options(), _discovery_options_for_question(), _emit_content_deltas(), _extract_ai_content(), _extract_clarification_questions(), _frontend_agent_for_node(), _looks_like_field_label() (+17 more)

### Community 65 - "llm.py"
Cohesion: 0.27
Nodes (9): _best_ollama_model(), get_base_llm(), get_provider_info(), get_structured_llm(), llm.py ------ LLM instantiation — Ollama only, model: mistral:latest.  Change OL, Returns the configured Ollama model name (env override or default)., Returns a cached ChatOllama instance using the best available model., Returns a structured-output chain backed by the best Ollama model.      Ollama s (+1 more)

## Knowledge Gaps
- **107 isolated node(s):** `handler`, `NavView`, `geistSans`, `geistMono`, `metadata` (+102 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **20 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `project_workflow_node()` connect `get_graph` to `apply_workflow_guards`?**
  _High betweenness centrality (0.080) - this node is a cross-community bridge._
- **Why does `run_workflow_and_stream()` connect `ProjectContext` to `ObjectId`, `route_after_project_workflow`?**
  _High betweenness centrality (0.077) - this node is a cross-community bridge._
- **Why does `WorkflowState` connect `get_graph` to `route_after_project_workflow`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **Are the 21 inferred relationships involving `get_database()` (e.g. with `init_indexes()` and `complete_signup()`) actually correct?**
  _`get_database()` has 21 INFERRED edges - model-reasoned connections that need verification._
- **Are the 4 inferred relationships involving `apply_workflow_guards()` (e.g. with `project_workflow_node()` and `test_apply_guards_forces_report_without_stack_or_budget()`) actually correct?**
  _`apply_workflow_guards()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `run_workflow_and_stream()` (e.g. with `send_message()` and `build_initial_state()`) actually correct?**
  _`run_workflow_and_stream()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Are the 7 inferred relationships involving `_assert_project_access()` (e.g. with `get_messages()` and `send_message()`) actually correct?**
  _`_assert_project_access()` has 7 INFERRED edges - model-reasoned connections that need verification._