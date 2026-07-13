# Graph Report - Planify  (2026-07-13)

## Corpus Check
- 81 files · ~30,403 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 467 nodes · 537 edges · 91 communities (30 shown, 61 thin omitted)
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 46 edges (avg confidence: 0.79)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0a1e15ca`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Frontend Dependencies
- Dev Tooling
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
- Home Page
- NextAuth Types
- App Init
- Schemas Init
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
- providers.tsx
- mongodb.ts
- __init__.py
- __init__.py
- Request
- Next.js Breaking Changes Warning
- Next.js Conventions
- Next.js File Structure
- node_modules/next/dist/docs/
- input_understanding_agent
- roadmap_agent
- roi_agent
- input_understanding_agent
- ProjectContext
- roi_agent
- roadmap_agent
- feasibility_agent
- quality_validation_agent
- technical_architecture_agent
- competitor_analysis_agent
- market_research_agent
- risk_analysis_agent
- prd_agent
- llm.py
- agents.ts
- ScrollToBottomButton.tsx
- __init__.py
- prompts.py
- Any
- BaseModel
- Any
- BaseModel
- Any
- Any
- Any
- BaseModel
- BaseCheckpointSaver
- BaseMessage
- ChannelVersions
- Checkpoint
- CheckpointMetadata
- CheckpointTuple
- ObjectId
- RouteKind
- RunnableConfig
- SchemaT
- StateGraph

## God Nodes (most connected - your core abstractions)
1. `get_database()` - 20 edges
2. `_assert_project_access()` - 14 edges
3. `run_workflow_and_stream()` - 12 edges
4. `build_graph()` - 10 edges
5. `WorkflowState` - 10 edges
6. `ProjectRepository` - 9 edges
7. `route_after_project_workflow()` - 8 edges
8. `ConversationRepository` - 6 edges
9. `project_workflow_node()` - 6 edges
10. `lifespan()` - 6 edges

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

## Communities (91 total, 61 thin omitted)

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
Cohesion: 0.09
Nodes (22): init_indexes(), MongoDB index initialization., Create an index, ignoring conflicts with existing equivalent indexes., _safe_create_index(), close_mongo_connection(), connect_to_mongo(), Async MongoDB connection for FastAPI., CorrelationIdFilter (+14 more)

### Community 9 - "Auth Middleware"
Cohesion: 0.12
Nodes (19): ConversationCategory, ConversationUnderstandingOutput, NextWorkflow, ProjectAction, ProjectContext, ProjectWorkflowOutput, Any, BaseModel (+11 more)

### Community 11 - "App Layout"
Cohesion: 0.40
Nodes (3): geistMono, geistSans, metadata

### Community 12 - "Context Schemas"
Cohesion: 0.10
Nodes (22): DashboardPage(), ChatHistoryResponse, ChatPage(), getMemoryTone(), isWorkflowEvent(), MemoryItem, Message, WorkflowEvent (+14 more)

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
Cohesion: 0.11
Nodes (34): AsyncIOMotorDatabase, get_database(), complete_signup(), Request, get_messages(), Request, send_message(), get_dashboard_stats() (+26 more)

### Community 29 - "project.py"
Cohesion: 0.50
Nodes (4): CreateProjectRequest, ProjectDetailResponse, BaseModel, Project-related schemas.

### Community 32 - "get_graph"
Cohesion: 0.09
Nodes (27): build_graph(), graph.py -------- Assembles the LangGraph StateGraph.  Flow:      START       │, Builds and compiles the top-level workflow graph., conversation_understanding_node(), nodes/conversation_understanding.py ------------------------------------ The ent, Classifies the user's message and routes / responds accordingly.      Returns a, _deep_merge(), project_workflow_node() (+19 more)

### Community 42 - "__init__.py"
Cohesion: 0.12
Nodes (10): Props, ChatMarkdown(), Props, AgentMeta, ChatMessageData, Props, FADE_UP, MESSAGE_SPRING (+2 more)

### Community 55 - "ProjectContext"
Cohesion: 0.23
Nodes (14): build_initial_state(), state.py -------- Defines the shared LangGraph workflow state.  This is the sing, Convenience factory for a fresh conversation state., _build_report_content(), _default_discovery_options(), _extract_ai_content(), _messages_to_history(), _persist_assistant_message() (+6 more)

### Community 65 - "llm.py"
Cohesion: 0.27
Nodes (9): _best_ollama_model(), get_base_llm(), get_provider_info(), get_structured_llm(), llm.py ------ LLM instantiation — Ollama only, model: mistral:latest.  Change OL, Returns the configured Ollama model name (env override or default)., Returns a cached ChatOllama instance using the best available model., Returns a structured-output chain backed by the best Ollama model.      Ollama s (+1 more)

### Community 66 - "agents.ts"
Cohesion: 0.20
Nodes (7): AGENT_META, AGENT_ORDER, AgentKey, AgentMeta, DISCOVERY_META, FALLBACK_META, SIDEBAR_STAGES

## Knowledge Gaps
- **93 isolated node(s):** `geistSans`, `geistMono`, `metadata`, `Message`, `ChatHistoryResponse` (+88 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **61 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `get_database()` connect `ObjectId` to `Logging Config`, `ProjectContext`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Why does `run_workflow_and_stream()` connect `ProjectContext` to `ObjectId`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Why does `build_initial_state()` connect `ProjectContext` to `get_graph`, `Health Tests`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Are the 18 inferred relationships involving `get_database()` (e.g. with `init_indexes()` and `complete_signup()`) actually correct?**
  _`get_database()` has 18 INFERRED edges - model-reasoned connections that need verification._
- **Are the 7 inferred relationships involving `_assert_project_access()` (e.g. with `get_messages()` and `send_message()`) actually correct?**
  _`_assert_project_access()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `run_workflow_and_stream()` (e.g. with `send_message()` and `build_initial_state()`) actually correct?**
  _`run_workflow_and_stream()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Are the 7 inferred relationships involving `build_graph()` (e.g. with `get_checkpointer()` and `conversation_understanding_node()`) actually correct?**
  _`build_graph()` has 7 INFERRED edges - model-reasoned connections that need verification._