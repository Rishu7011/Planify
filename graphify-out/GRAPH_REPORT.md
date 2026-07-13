# Graph Report - Planify  (2026-07-14)

## Corpus Check
- 83 files · ~30,216 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 457 nodes · 634 edges · 50 communities (28 shown, 22 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 53 edges (avg confidence: 0.79)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b664efea`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Frontend Dependencies
- Dev Tooling
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
- roi_agent
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
- agents.ts
- __init__.py
- prompts.py

## God Nodes (most connected - your core abstractions)
1. `get_database()` - 20 edges
2. `run_workflow_and_stream()` - 17 edges
3. `_assert_project_access()` - 14 edges
4. `build_graph()` - 10 edges
5. `WorkflowState` - 10 edges
6. `ProjectRepository` - 9 edges
7. `ChatPage()` - 9 edges
8. `route_after_project_workflow()` - 8 edges
9. `lifespan()` - 7 edges
10. `ConversationRepository` - 6 edges

## Surprising Connections (you probably didn't know these)
- `build_graph()` --calls--> `get_checkpointer()`  [INFERRED]
  backend/app/agent/graph.py → backend/app/agent/db.py
- `run_turn()` --calls--> `build_initial_state()`  [INFERRED]
  backend/app/agent/main.py → backend/app/agent/state.py
- `test_route_after_project_workflow_discovery_complete_report_allowed()` --calls--> `route_after_project_workflow()`  [INFERRED]
  backend/app/agent/test_router.py → backend/app/agent/router.py
- `test_route_after_project_workflow_discovery_incomplete_report_blocked()` --calls--> `route_after_project_workflow()`  [INFERRED]
  backend/app/agent/test_router.py → backend/app/agent/router.py
- `test_route_after_project_workflow_general_no_action()` --calls--> `route_after_project_workflow()`  [INFERRED]
  backend/app/agent/test_router.py → backend/app/agent/router.py

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Next.js Breaking Change Surfaces** — frontend_agents_nextjs_apis, frontend_agents_nextjs_conventions, frontend_agents_nextjs_file_structure, frontend_agents_deprecation_notices [EXTRACTED 1.00]

## Communities (50 total, 22 thin omitted)

### Community 0 - "Frontend Dependencies"
Cohesion: 0.05
Nodes (37): @auth/mongodb-adapter, @base-ui/react, class-variance-authority, clsx, framer-motion, dependencies, @auth/mongodb-adapter, @base-ui/react (+29 more)

### Community 1 - "Dev Tooling"
Cohesion: 0.07
Nodes (27): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node (+19 more)

### Community 5 - "Chat Schemas"
Cohesion: 0.47
Nodes (5): ChatHistoryResponse, ChatMessageResponse, BaseModel, Chat-related schemas., SendMessageRequest

### Community 6 - "Health Tests"
Cohesion: 0.07
Nodes (25): ConversationRepository, get_checkpointer(), get_db(), get_sync_db(), init_db(), _now(), ProjectRepository, Any (+17 more)

### Community 8 - "Logging Config"
Cohesion: 0.11
Nodes (21): get_settings(), Application configuration via environment variables., Settings, init_indexes(), MongoDB index initialization., Create an index, ignoring conflicts with existing equivalent indexes., _safe_create_index(), close_mongo_connection() (+13 more)

### Community 9 - "Auth Middleware"
Cohesion: 0.12
Nodes (19): ConversationCategory, ConversationUnderstandingOutput, NextWorkflow, ProjectAction, ProjectContext, ProjectWorkflowOutput, Any, BaseModel (+11 more)

### Community 11 - "App Layout"
Cohesion: 0.33
Nodes (4): geistMono, geistSans, metadata, Providers()

### Community 12 - "Context Schemas"
Cohesion: 0.18
Nodes (17): DashboardPage(), Comment, ReportsPage(), SAMPLE_COMMENTS, Version, Props, ReportMarkdownBody(), api (+9 more)

### Community 13 - "NextAuth Integration"
Cohesion: 0.40
Nodes (3): handler, authOptions, options

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
Cohesion: 0.10
Nodes (39): AsyncIOMotorDatabase, get_database(), complete_signup(), Request, get_messages(), Request, send_message(), get_dashboard_stats() (+31 more)

### Community 29 - "project.py"
Cohesion: 0.50
Nodes (4): CreateProjectRequest, ProjectDetailResponse, BaseModel, Project-related schemas.

### Community 32 - "get_graph"
Cohesion: 0.08
Nodes (30): build_graph(), graph.py -------- Assembles the LangGraph StateGraph.  Flow:      START       │, Builds and compiles the top-level workflow graph., conversation_understanding_node(), nodes/conversation_understanding.py ------------------------------------ The ent, Classifies the user's message and routes / responds accordingly.      Returns a, _deep_merge(), project_workflow_node() (+22 more)

### Community 42 - "__init__.py"
Cohesion: 0.07
Nodes (38): ChatHistoryResponse, ChatPage(), createStreamingMessage(), getMemoryTone(), isWorkflowEvent(), MemoryItem, Message, WorkflowEvent (+30 more)

### Community 55 - "ProjectContext"
Cohesion: 0.21
Nodes (19): _build_report_content(), _default_discovery_options(), _emit_content_deltas(), _extract_ai_content(), _extract_clarification_questions(), _frontend_agent_for_node(), _messages_to_history(), _persist_assistant_message() (+11 more)

### Community 65 - "llm.py"
Cohesion: 0.27
Nodes (9): _best_ollama_model(), get_base_llm(), get_provider_info(), get_structured_llm(), llm.py ------ LLM instantiation — Ollama only, model: mistral:latest.  Change OL, Returns the configured Ollama model name (env override or default)., Returns a cached ChatOllama instance using the best available model., Returns a structured-output chain backed by the best Ollama model.      Ollama s (+1 more)

### Community 66 - "agents.ts"
Cohesion: 0.33
Nodes (5): CorrelationIdFilter, Structured JSON logging configuration., setup_logging(), Logger, LogRecord

## Knowledge Gaps
- **86 isolated node(s):** `handler`, `geistSans`, `geistMono`, `metadata`, `Message` (+81 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **22 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `get_database()` connect `ObjectId` to `Logging Config`, `ProjectContext`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Why does `run_workflow_and_stream()` connect `ProjectContext` to `get_graph`, `ObjectId`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Why does `build_initial_state()` connect `get_graph` to `Health Tests`, `ProjectContext`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Are the 18 inferred relationships involving `get_database()` (e.g. with `init_indexes()` and `complete_signup()`) actually correct?**
  _`get_database()` has 18 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `run_workflow_and_stream()` (e.g. with `send_message()` and `build_initial_state()`) actually correct?**
  _`run_workflow_and_stream()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Are the 7 inferred relationships involving `_assert_project_access()` (e.g. with `get_messages()` and `send_message()`) actually correct?**
  _`_assert_project_access()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **Are the 7 inferred relationships involving `build_graph()` (e.g. with `get_checkpointer()` and `conversation_understanding_node()`) actually correct?**
  _`build_graph()` has 7 INFERRED edges - model-reasoned connections that need verification._