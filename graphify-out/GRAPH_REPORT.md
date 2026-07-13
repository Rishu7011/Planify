# Graph Report - Planify  (2026-07-12)

## Corpus Check
- 80 files · ~34,629 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 550 nodes · 771 edges · 54 communities (37 shown, 17 thin omitted)
- Extraction: 86% EXTRACTED · 14% INFERRED · 0% AMBIGUOUS · INFERRED: 106 edges (avg confidence: 0.78)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c0ee63af`
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
- Request
- Next.js Breaking Changes Warning
- Next.js Conventions
- Next.js File Structure
- node_modules/next/dist/docs/
- input_understanding_agent
- roadmap_agent
- roi_agent

## God Nodes (most connected - your core abstractions)
1. `ProjectContext` - 26 edges
2. `get_database()` - 22 edges
3. `invoke_structured()` - 20 edges
4. `MongoCheckpointSaver` - 18 edges
5. `get_llm()` - 17 edges
6. `_assert_project_access()` - 15 edges
7. `route_incoming_message()` - 13 edges
8. `get_graph()` - 12 edges
9. `_stream_project_workflow()` - 10 edges
10. `clarification_agent()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `get_graph()` --calls--> `MongoCheckpointSaver`  [INFERRED]
  backend/app/agents/workflow.py → backend/app/agents/checkpointer.py
- `clarification_agent()` --indirect_call--> `ClarificationOutput`  [INFERRED]
  backend/app/agents/clarification.py → backend/app/schemas/agents.py
- `competitor_analysis_agent()` --indirect_call--> `CompetitorAnalysisOutput`  [INFERRED]
  backend/app/agents/competitor_analysis.py → backend/app/schemas/agents.py
- `general_chat_handler()` --calls--> `get_llm()`  [INFERRED]
  backend/app/agents/conversation.py → backend/app/agents/llm.py
- `feasibility_agent()` --indirect_call--> `FeasibilityOutput`  [INFERRED]
  backend/app/agents/feasibility_agent.py → backend/app/schemas/agents.py

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Next.js Breaking Change Surfaces** — frontend_agents_nextjs_apis, frontend_agents_nextjs_conventions, frontend_agents_nextjs_file_structure, frontend_agents_deprecation_notices [EXTRACTED 1.00]

## Communities (54 total, 17 thin omitted)

### Community 0 - "Frontend Dependencies"
Cohesion: 0.06
Nodes (33): @auth/mongodb-adapter, @base-ui/react, class-variance-authority, clsx, framer-motion, dependencies, @auth/mongodb-adapter, @base-ui/react (+25 more)

### Community 1 - "Dev Tooling"
Cohesion: 0.07
Nodes (27): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node (+19 more)

### Community 3 - "Agent Schemas"
Cohesion: 0.09
Nodes (34): Citation, ClarificationOutput, CompetitorAnalysisOutput, CompetitorProfile, FeasibilityOutput, FinalReportOutput, HiringRole, HRPlanningOutput (+26 more)

### Community 5 - "Chat Schemas"
Cohesion: 0.27
Nodes (9): ChatMessage, ChatSession, BaseModel, Represents an active chat session tied to a project., Request body to send a new message in a chat session., Response returned immediately after a message is accepted., Represents a single message in a chat session., SendMessageRequest (+1 more)

### Community 6 - "Health Tests"
Cohesion: 0.20
Nodes (8): mock_mongo(), GET /health should return 200 with status ok., Request to a protected route without a token should return 401., Request with an invalid bearer token should return 401., Patch MongoDB connect/disconnect so tests run without a real DB., test_health_check(), test_protected_route_invalid_token(), test_protected_route_no_token()

### Community 8 - "Logging Config"
Cohesion: 0.10
Nodes (16): init_indexes(), Create all MongoDB indexes for the planify database., close_mongo_connection(), connect_to_mongo(), Open async MongoDB connection on app startup., Close MongoDB connection on app shutdown., CorrelationIdFilter, Configure structured JSON logging for the application. (+8 more)

### Community 9 - "Auth Middleware"
Cohesion: 0.36
Nodes (7): auth_middleware(), get_current_user(), Request, Verify HS256 JWT signature and return decoded claims., Extract bearer token from Authorization header and return verified user claims., Global HTTP middleware — verifies JWT on all non-public routes., verify_jwt()

### Community 11 - "App Layout"
Cohesion: 0.33
Nodes (4): geistMono, geistSans, metadata, Providers()

### Community 12 - "Context Schemas"
Cohesion: 0.09
Nodes (25): DashboardPage(), AGENT_META, AGENT_ORDER, AgentKey, ChatPage(), getMemoryTone(), isWorkflowEvent(), MemoryItem (+17 more)

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
Cohesion: 0.08
Nodes (49): AsyncIOMotorDatabase, get_database(), Return the active database instance. Call after connect_to_mongo()., complete_signup(), Request, Auth-related routes.  POST /auth/signup/complete     Called from the Next.js sig, Auto-create a personal workspace (Organization) for a brand-new user.      Idemp, get_messages() (+41 more)

### Community 27 - "MongoCheckpointSaver"
Cohesion: 0.11
Nodes (10): AsyncIOMotorClient, generate_checkpointer(), MongoCheckpointSaver, Any, BaseCheckpointSaver, ChannelVersions, Checkpoint, CheckpointMetadata (+2 more)

### Community 28 - "run_workflow_and_stream"
Cohesion: 0.09
Nodes (33): general_chat_handler(), intent_classifier(), IntentClassification, meta_command_handler(), Any, BaseModel, Answers general questions or smalltalk, then halts graph to wait for user's next, Handles settings, workspace switches, or workflow cancellations. (+25 more)

### Community 29 - "project.py"
Cohesion: 0.07
Nodes (37): hr_planning_agent(), Any, Generates organizational hierarchy, hiring prioritisation, and roll-out schedule, _resolve_constraints(), _resolve_context(), input_understanding_agent(), _merge_context(), Any (+29 more)

### Community 32 - "get_graph"
Cohesion: 0.16
Nodes (19): LangGraph WorkflowState — the shared state object that flows through every agent, Shared state flowing through the LangGraph pipeline.      LangGraph passes this, WorkflowState, build_analysis_graph(), build_export_graph(), build_reporting_graph(), build_research_planning_graph(), get_graph() (+11 more)

### Community 33 - "clarification_agent"
Cohesion: 0.05
Nodes (49): clarification_agent(), _format_constraints(), _format_conversation(), Any, Clarification Agent.  Decides whether we have enough context to generate reports, Render prior chat history plus the latest message as one block.      Using raw_u, Render budget/timeline/team_size as an explicit, LLM-friendly summary     so the, LangGraph node: check context completeness and generate targeted questions. (+41 more)

### Community 34 - "feasibility_agent"
Cohesion: 0.33
Nodes (9): _check_consistency(), final_report_agent(), Any, Final Report Agent.  Assembles all agent outputs into a coherent bundle. Runs co, Extract (domain, timeline) from context, whether Pydantic model or dict., Run basic cross-report consistency checks. Returns list of issue strings., LangGraph node: assemble all reports and run consistency checks.     Sets status, _resolve_context() (+1 more)

### Community 40 - "providers.tsx"
Cohesion: 0.16
Nodes (16): get_workflow_context(), Any, Read pause/resume context from the latest workflow run — no LangGraph init., _build_summary(), Chat Service.  Orchestrates incoming chat messages: 1. Fast intent routing (no w, Handle greetings, small talk, and meta commands without workflow infrastructure., Create workflow run + LangGraph execution for project-related messages., Format a dict as an SSE data line. (+8 more)

### Community 51 - "input_understanding_agent"
Cohesion: 0.36
Nodes (7): export_renderer(), _generate_markdown(), push_notifier(), Any, Renders all reports into a unified Markdown document., Pre-compiles PDF, DOCX, Markdown, and JSON representations to verify export pipe, Prepares execution status update and pushes complete notification state.

### Community 52 - "roadmap_agent"
Cohesion: 0.43
Nodes (6): Any, Roadmap Agent.  Generates a phase-by-phase project roadmap with milestones, dura, LangGraph node: generate prioritized project roadmap with milestones., _resolve_budget_timeline(), _resolve_context(), roadmap_agent()

### Community 53 - "roi_agent"
Cohesion: 0.50
Nodes (3): Any, Generates technical approach, feasibility, stack recommendations, and dependenci, technical_architecture_agent()

## Knowledge Gaps
- **77 isolated node(s):** `handler`, `geistSans`, `geistMono`, `metadata`, `Message` (+72 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ProjectContext` connect `project.py` to `get_graph`, `clarification_agent`, `feasibility_agent`, `providers.tsx`, `roadmap_agent`?**
  _High betweenness centrality (0.167) - this node is a cross-community bridge._
- **Why does `_stream_project_workflow()` connect `providers.tsx` to `get_graph`, `ObjectId`, `project.py`?**
  _High betweenness centrality (0.103) - this node is a cross-community bridge._
- **Why does `get_graph()` connect `get_graph` to `Logging Config`, `providers.tsx`, `ObjectId`, `MongoCheckpointSaver`?**
  _High betweenness centrality (0.102) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `ProjectContext` (e.g. with `WorkflowState` and `CreateProjectRequest`) actually correct?**
  _`ProjectContext` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Are the 19 inferred relationships involving `get_database()` (e.g. with `get_graph()` and `init_indexes()`) actually correct?**
  _`get_database()` has 19 INFERRED edges - model-reasoned connections that need verification._
- **Are the 14 inferred relationships involving `ObjectId` (e.g. with `get_workflow_context()` and `complete_signup()`) actually correct?**
  _`ObjectId` has 14 INFERRED edges - model-reasoned connections that need verification._
- **Are the 12 inferred relationships involving `invoke_structured()` (e.g. with `clarification_agent()` and `competitor_analysis_agent()`) actually correct?**
  _`invoke_structured()` has 12 INFERRED edges - model-reasoned connections that need verification._