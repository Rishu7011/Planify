# Graph Report - Planify  (2026-07-14)

## Corpus Check
- 89 files · ~36,205 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 543 nodes · 819 edges · 48 communities (28 shown, 20 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 67 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8265bdf9`
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
- build_initial_state
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
1. `get_database()` - 20 edges
2. `apply_workflow_guards()` - 19 edges
3. `run_workflow_and_stream()` - 17 edges
4. `_assert_project_access()` - 14 edges
5. `WorkflowState` - 11 edges
6. `build_graph()` - 10 edges
7. `project_workflow_node()` - 10 edges
8. `route_after_project_workflow()` - 10 edges
9. `ProjectRepository` - 9 edges
10. `ChatPage()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `build_graph()` --calls--> `get_checkpointer()`  [INFERRED]
  backend/app/agent/graph.py → backend/app/agent/db.py
- `main()` --calls--> `init_db()`  [INFERRED]
  backend/app/agent/main.py → backend/app/agent/db.py
- `build_graph()` --indirect_call--> `route_after_project_workflow()`  [INFERRED]
  backend/app/agent/graph.py → backend/app/agent/router.py
- `project_workflow_node()` --calls--> `apply_workflow_guards()`  [INFERRED]
  backend/app/agent/nodes/project_workflow.py → backend/app/agent/workflow_guards.py
- `test_route_after_project_workflow_discovery_complete_report_allowed()` --calls--> `route_after_project_workflow()`  [INFERRED]
  backend/app/agent/test_router.py → backend/app/agent/router.py

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Next.js Breaking Change Surfaces** — frontend_agents_nextjs_apis, frontend_agents_nextjs_conventions, frontend_agents_nextjs_file_structure, frontend_agents_deprecation_notices [EXTRACTED 1.00]

## Communities (48 total, 20 thin omitted)

### Community 0 - "Frontend Dependencies"
Cohesion: 0.05
Nodes (37): @auth/mongodb-adapter, @base-ui/react, class-variance-authority, clsx, framer-motion, dependencies, @auth/mongodb-adapter, @base-ui/react (+29 more)

### Community 1 - "Dev Tooling"
Cohesion: 0.07
Nodes (27): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node (+19 more)

### Community 3 - "apply_workflow_guards"
Cohesion: 0.13
Nodes (30): Unit tests for deterministic workflow guards., test_apply_guards_forces_report_without_stack_or_budget(), test_apply_guards_rewrites_budget_questionnaire(), test_apply_guards_stops_discovery_loop(), test_detect_prd_request(), test_discovery_complete_soft_gates(), test_filter_drops_optional_budget_and_answered_features(), apply_workflow_guards() (+22 more)

### Community 5 - "route_after_project_workflow"
Cohesion: 0.29
Nodes (9): router.py --------- Conditional-edge routing functions. Kept separate from node, Routes to report_generator only for real report workflow names.      Non-report, route_after_project_workflow(), test_route_after_project_workflow_discovery_complete_report_allowed(), test_route_after_project_workflow_discovery_incomplete_report_blocked(), test_route_after_project_workflow_general_no_action(), test_route_after_project_workflow_user_requested_report_allowed_even_if_discovery_incomplete(), test_route_ends_when_only_non_report_workflows() (+1 more)

### Community 6 - "Health Tests"
Cohesion: 0.09
Nodes (22): ConversationRepository, get_checkpointer(), get_db(), get_sync_db(), init_db(), _now(), ProjectRepository, Any (+14 more)

### Community 8 - "Logging Config"
Cohesion: 0.08
Nodes (28): get_settings(), Application configuration via environment variables., Settings, init_indexes(), MongoDB index initialization., Create an index, ignoring conflicts with existing equivalent indexes., _safe_create_index(), close_mongo_connection() (+20 more)

### Community 9 - "Auth Middleware"
Cohesion: 0.12
Nodes (19): ConversationCategory, ConversationUnderstandingOutput, NextWorkflow, ProjectAction, ProjectContext, ProjectWorkflowOutput, Any, BaseModel (+11 more)

### Community 11 - "App Layout"
Cohesion: 0.33
Nodes (4): geistMono, geistSans, metadata, Providers()

### Community 12 - "Context Schemas"
Cohesion: 0.10
Nodes (29): DashboardPage(), NavView, Comment, ReportsPage(), SAMPLE_COMMENTS, Version, DashboardProject, LayoutMode (+21 more)

### Community 13 - "NextAuth Integration"
Cohesion: 0.40
Nodes (3): handler, authOptions, options

### Community 14 - "DB Check Script"
Cohesion: 0.60
Nodes (4): fs, loadEnv(), main(), { MongoClient }

### Community 15 - "build_initial_state"
Cohesion: 0.25
Nodes (7): main(), main.py ------- Simple CLI runner for local testing. Requires a running Ollama s, Runs a single conversational turn through the graph with persistence., run_turn(), build_initial_state(), state.py -------- Defines the shared LangGraph workflow state.  This is the sing, Convenience factory for a fresh conversation state.

### Community 16 - "Home Page"
Cohesion: 0.14
Nodes (18): LoginForm(), AppEntryCta(), AppEntryCtaProps, Footer(), Navbar(), Button(), buttonVariants, appEntryHref() (+10 more)

### Community 18 - "NextAuth Types"
Cohesion: 0.40
Nodes (4): JWT, next-auth, next-auth/jwt, Session

### Community 26 - "ObjectId"
Cohesion: 0.09
Nodes (41): AsyncIOMotorDatabase, get_database(), get_messages(), Request, send_message(), get_dashboard_stats(), get_recent_runs(), Request (+33 more)

### Community 29 - "project.py"
Cohesion: 0.50
Nodes (4): CreateProjectRequest, ProjectDetailResponse, BaseModel, Project-related schemas.

### Community 32 - "get_graph"
Cohesion: 0.06
Nodes (42): build_graph(), graph.py -------- Assembles the LangGraph StateGraph.  Flow:      START       │, Builds and compiles the top-level workflow graph., conversation_understanding_node(), _has_active_project(), nodes/conversation_understanding.py ------------------------------------ The ent, True when enough project context already exists that a follow-up     should neve, Classifies the user's message and routes / responds accordingly. (+34 more)

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
- **93 isolated node(s):** `handler`, `NavView`, `geistSans`, `geistMono`, `metadata` (+88 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **20 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `project_workflow_node()` connect `get_graph` to `apply_workflow_guards`?**
  _High betweenness centrality (0.101) - this node is a cross-community bridge._
- **Why does `run_workflow_and_stream()` connect `ProjectContext` to `ObjectId`, `build_initial_state`?**
  _High betweenness centrality (0.095) - this node is a cross-community bridge._
- **Why does `WorkflowState` connect `get_graph` to `route_after_project_workflow`, `build_initial_state`?**
  _High betweenness centrality (0.092) - this node is a cross-community bridge._
- **Are the 18 inferred relationships involving `get_database()` (e.g. with `init_indexes()` and `complete_signup()`) actually correct?**
  _`get_database()` has 18 INFERRED edges - model-reasoned connections that need verification._
- **Are the 4 inferred relationships involving `apply_workflow_guards()` (e.g. with `project_workflow_node()` and `test_apply_guards_forces_report_without_stack_or_budget()`) actually correct?**
  _`apply_workflow_guards()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `run_workflow_and_stream()` (e.g. with `send_message()` and `build_initial_state()`) actually correct?**
  _`run_workflow_and_stream()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Are the 7 inferred relationships involving `_assert_project_access()` (e.g. with `get_messages()` and `send_message()`) actually correct?**
  _`_assert_project_access()` has 7 INFERRED edges - model-reasoned connections that need verification._