# Graph Report - Planify  (2026-07-12)

## Corpus Check
- 78 files · ~31,395 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 501 nodes · 617 edges · 51 communities (36 shown, 15 thin omitted)
- Extraction: 88% EXTRACTED · 12% INFERRED · 0% AMBIGUOUS · INFERRED: 72 edges (avg confidence: 0.78)
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
- Next.js Breaking Changes Warning
- Next.js Conventions
- Next.js File Structure
- node_modules/next/dist/docs/

## God Nodes (most connected - your core abstractions)
1. `get_database()` - 22 edges
2. `MongoCheckpointSaver` - 18 edges
3. `_assert_project_access()` - 15 edges
4. `ProjectContext` - 15 edges
5. `run_workflow_and_stream()` - 11 edges
6. `get_llm()` - 10 edges
7. `send_message()` - 8 edges
8. `clarification_agent()` - 7 edges
9. `feasibility_agent()` - 7 edges
10. `input_understanding_agent()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `get_graph()` --calls--> `MongoCheckpointSaver`  [INFERRED]
  backend/app/agents/workflow.py → backend/app/agents/checkpointer.py
- `clarification_agent()` --calls--> `ClarificationOutput`  [INFERRED]
  backend/app/agents/clarification.py → backend/app/schemas/agents.py
- `clarification_agent()` --calls--> `ProjectContext`  [INFERRED]
  backend/app/agents/clarification.py → backend/app/schemas/context.py
- `feasibility_agent()` --calls--> `get_llm()`  [INFERRED]
  backend/app/agents/feasibility_agent.py → backend/app/agents/llm.py
- `feasibility_agent()` --calls--> `FeasibilityOutput`  [INFERRED]
  backend/app/agents/feasibility_agent.py → backend/app/schemas/agents.py

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Next.js Breaking Change Surfaces** — frontend_agents_nextjs_apis, frontend_agents_nextjs_conventions, frontend_agents_nextjs_file_structure, frontend_agents_deprecation_notices [EXTRACTED 1.00]

## Communities (51 total, 15 thin omitted)

### Community 0 - "Frontend Dependencies"
Cohesion: 0.06
Nodes (33): @auth/mongodb-adapter, @base-ui/react, class-variance-authority, clsx, framer-motion, dependencies, @auth/mongodb-adapter, @base-ui/react (+25 more)

### Community 1 - "Dev Tooling"
Cohesion: 0.07
Nodes (27): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node (+19 more)

### Community 2 - "Backend MongoDB API"
Cohesion: 0.06
Nodes (31): AgentStatus, AI_AGENTS, AI_OUTPUTS, AIAgent, AIOutput, BadgeType, DASHBOARD_KPIS, DASHBOARD_PROJECTS (+23 more)

### Community 3 - "Agent Schemas"
Cohesion: 0.10
Nodes (26): Any, Roadmap Agent.  Generates a phase-by-phase project roadmap with milestones, dura, Strip markdown code fences from LLM output., LangGraph node: generate prioritized project roadmap with milestones., roadmap_agent(), _strip_fences(), ClarificationOutput, FeasibilityOutput (+18 more)

### Community 5 - "Chat Schemas"
Cohesion: 0.27
Nodes (9): ChatMessage, ChatSession, BaseModel, Represents an active chat session tied to a project., Request body to send a new message in a chat session., Response returned immediately after a message is accepted., Represents a single message in a chat session., SendMessageRequest (+1 more)

### Community 6 - "Health Tests"
Cohesion: 0.20
Nodes (8): mock_mongo(), GET /health should return 200 with status ok., Request to a protected route without a token should return 401., Request with an invalid bearer token should return 401., Patch MongoDB connect/disconnect so tests run without a real DB., test_health_check(), test_protected_route_invalid_token(), test_protected_route_no_token()

### Community 7 - "Package Metadata"
Cohesion: 0.06
Nodes (28): Project, Comment, REPORT_TABS, ReportsPage(), SAMPLE_COMMENTS, SAMPLE_VERSIONS, TabKey, Version (+20 more)

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
Nodes (20): AGENT_LABELS, AGENT_ORDER, ChatPage(), Message, WorkflowEvent, AGENTS, AgentState, AgentTimeline() (+12 more)

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
Cohesion: 0.06
Nodes (58): AsyncIOMotorDatabase, get_database(), Return the active database instance. Call after connect_to_mongo()., complete_signup(), Request, Auth-related routes.  POST /auth/signup/complete     Called from the Next.js sig, Auto-create a personal workspace (Organization) for a brand-new user.      Idemp, get_messages() (+50 more)

### Community 27 - "MongoCheckpointSaver"
Cohesion: 0.11
Nodes (10): AsyncIOMotorClient, generate_checkpointer(), MongoCheckpointSaver, Any, BaseCheckpointSaver, ChannelVersions, Checkpoint, CheckpointMetadata (+2 more)

### Community 28 - "run_workflow_and_stream"
Cohesion: 0.29
Nodes (7): CHART_DATA, formatDate(), Project, Props, RecentProjects(), SAMPLE, STATUS_MAP

### Community 29 - "project.py"
Cohesion: 0.09
Nodes (25): _check_consistency(), final_report_agent(), Any, Final Report Agent.  Assembles all agent outputs into a coherent bundle. Runs co, Run basic cross-report consistency checks. Returns list of issue strings., LangGraph node: assemble all reports and run consistency checks.     Sets status, prd_agent(), Any (+17 more)

### Community 32 - "get_graph"
Cohesion: 0.18
Nodes (10): LangGraph WorkflowState — the shared state object that flows through every agent, Shared state flowing through the LangGraph pipeline.      LangGraph passes this, WorkflowState, get_graph(), Any, LangGraph Workflow Definition.  Compiles the full agent pipeline:   input_unders, Conditional edge: go to PRD or pause for user input.     Reads routing_decision, Build and compile the full LangGraph agent pipeline, attaching the checkpointer. (+2 more)

### Community 33 - "clarification_agent"
Cohesion: 0.08
Nodes (26): clarification_agent(), Any, Clarification Agent.  Decides whether we have enough context to generate reports, Strip markdown code fences from LLM output., LangGraph node: check context completeness and generate targeted questions., _strip_fences(), input_understanding_agent(), Any (+18 more)

### Community 34 - "feasibility_agent"
Cohesion: 0.33
Nodes (6): feasibility_agent(), Any, Feasibility Agent.  Assesses technical complexity, risks, and critical dependenc, Strip markdown code fences from LLM output., LangGraph node: assess technical feasibility from PRD., _strip_fences()

## Knowledge Gaps
- **129 isolated node(s):** `handler`, `Project`, `geistSans`, `geistMono`, `metadata` (+124 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ProjectContext` connect `project.py` to `get_graph`, `clarification_agent`, `feasibility_agent`, `Agent Schemas`, `ObjectId`?**
  _High betweenness centrality (0.115) - this node is a cross-community bridge._
- **Why does `run_workflow_and_stream()` connect `ObjectId` to `get_graph`, `project.py`?**
  _High betweenness centrality (0.089) - this node is a cross-community bridge._
- **Why does `get_database()` connect `ObjectId` to `get_graph`, `Logging Config`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **Are the 19 inferred relationships involving `get_database()` (e.g. with `get_graph()` and `init_indexes()`) actually correct?**
  _`get_database()` has 19 INFERRED edges - model-reasoned connections that need verification._
- **Are the 11 inferred relationships involving `ObjectId` (e.g. with `complete_signup()` and `get_messages()`) actually correct?**
  _`ObjectId` has 11 INFERRED edges - model-reasoned connections that need verification._
- **Are the 7 inferred relationships involving `_assert_project_access()` (e.g. with `get_messages()` and `send_message()`) actually correct?**
  _`_assert_project_access()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Clarification Agent.  Decides whether we have enough context to generate reports`, `Strip markdown code fences from LLM output.`, `LangGraph node: check context completeness and generate targeted questions.` to the rest of the system?**
  _215 weakly-connected nodes found - possible documentation gaps or missing edges._