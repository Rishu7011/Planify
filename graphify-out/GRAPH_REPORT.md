# Graph Report - .  (2026-07-11)

## Corpus Check
- Corpus is ~3,388 words - fits in a single context window. You may not need a graph.

## Summary
- 196 nodes · 213 edges · 26 communities (25 shown, 1 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

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

## God Nodes (most connected - your core abstractions)
1. `lifespan()` - 6 edges
2. `Next.js Breaking Changes Warning` - 6 edges
3. `get_current_user()` - 5 edges
4. `scripts` - 5 edges
5. `graphify` - 5 edges
6. `Knowledge Graph at graphify-out/` - 5 edges
7. `graphify query` - 5 edges
8. `Graphify-First Codebase Exploration Workflow` - 5 edges
9. `init_indexes()` - 4 edges
10. `get_database()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `init_indexes()` --calls--> `get_database()`  [INFERRED]
  backend/app/db/init_db.py → backend/app/db/mongodb.py
- `lifespan()` --calls--> `init_indexes()`  [INFERRED]
  backend/app/main.py → backend/app/db/init_db.py
- `lifespan()` --calls--> `connect_to_mongo()`  [INFERRED]
  backend/app/main.py → backend/app/db/mongodb.py
- `lifespan()` --calls--> `close_mongo_connection()`  [INFERRED]
  backend/app/main.py → backend/app/db/mongodb.py
- `Button()` --calls--> `cn()`  [EXTRACTED]
  frontend/components/ui/button.tsx → frontend/lib/utils.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Graphify CLI Tooling** — gemini_graphify_query, gemini_graphify_path, gemini_graphify_explain, gemini_graphify_update [EXTRACTED 1.00]
- **Knowledge Graph Structural Components** — gemini_knowledge_graph, gemini_god_nodes, gemini_community_structure, gemini_cross_file_relationships [EXTRACTED 1.00]
- **Next.js Breaking Change Surfaces** — frontend_agents_nextjs_apis, frontend_agents_nextjs_conventions, frontend_agents_nextjs_file_structure, frontend_agents_deprecation_notices [EXTRACTED 1.00]

## Communities (26 total, 1 thin omitted)

### Community 0 - "Frontend Dependencies"
Cohesion: 0.07
Nodes (29): @auth/mongodb-adapter, @base-ui/react, class-variance-authority, clsx, dependencies, @auth/mongodb-adapter, @base-ui/react, class-variance-authority (+21 more)

### Community 1 - "Dev Tooling"
Cohesion: 0.11
Nodes (19): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node (+11 more)

### Community 2 - "Backend MongoDB API"
Cohesion: 0.14
Nodes (14): AsyncIOMotorDatabase, init_indexes(), Create all MongoDB indexes for the planify database., close_mongo_connection(), connect_to_mongo(), get_database(), Open async MongoDB connection on app startup., Close MongoDB connection on app shutdown. (+6 more)

### Community 3 - "Agent Schemas"
Cohesion: 0.18
Nodes (15): ClarificationOutput, FeasibilityOutput, InputUnderstandingOutput, PRDOutput, PRDSection, BaseModel, Output from the Clarification Agent., Output from the PRD Agent. (+7 more)

### Community 4 - "Graphify Documentation"
Cohesion: 0.27
Nodes (13): Graphify-First Codebase Exploration Workflow, Community Structure, Cross-File Relationships, God Nodes, graphify, graphify explain, graphify path, graphify query (+5 more)

### Community 5 - "Chat Schemas"
Cohesion: 0.27
Nodes (9): ChatMessage, ChatSession, BaseModel, Represents an active chat session tied to a project., Request body to send a new message in a chat session., Response returned immediately after a message is accepted., Represents a single message in a chat session., SendMessageRequest (+1 more)

### Community 6 - "Health Tests"
Cohesion: 0.20
Nodes (8): mock_mongo(), GET /health should return 200 with status ok., Request to a protected route without a token should return 401., Request with an invalid bearer token should return 401., Patch MongoDB connect/disconnect so tests run without a real DB., test_health_check(), test_protected_route_invalid_token(), test_protected_route_no_token()

### Community 7 - "Package Metadata"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 8 - "Logging Config"
Cohesion: 0.29
Nodes (6): CorrelationIdFilter, Configure structured JSON logging for the application., Attach a unique correlation_id to every log record., setup_logging(), Logger, LogRecord

### Community 9 - "Auth Middleware"
Cohesion: 0.36
Nodes (7): auth_middleware(), get_current_user(), Verify HS256 JWT signature and return decoded claims., Extract bearer token from Authorization header and return verified user claims., Global HTTP middleware — verifies JWT on all non-public routes., verify_jwt(), Request

### Community 10 - "Next.js Agent Docs"
Cohesion: 0.32
Nodes (8): frontend/AGENTS.md, Deprecation Notices, Next.js APIs, Next.js Breaking Changes Warning, Next.js Conventions, Next.js File Structure, node_modules/next/dist/docs/, frontend/CLAUDE.md

### Community 11 - "App Layout"
Cohesion: 0.33
Nodes (4): geistMono, geistSans, metadata, Providers()

### Community 12 - "Context Schemas"
Cohesion: 0.40
Nodes (5): Constraint, ProjectContext, BaseModel, The shared context object that flows through all AI agents.     Changing one fie, Resource and regulatory constraints for a project.

### Community 13 - "NextAuth Integration"
Cohesion: 0.40
Nodes (3): handler, authOptions, options

### Community 14 - "DB Check Script"
Cohesion: 0.60
Nodes (4): fs, loadEnv(), main(), { MongoClient }

### Community 15 - "UI Components"
Cohesion: 0.70
Nodes (3): Button(), buttonVariants, cn()

## Knowledge Gaps
- **44 isolated node(s):** `handler`, `geistSans`, `geistMono`, `metadata`, `fs` (+39 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `Frontend Dependencies` to `Package Metadata`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `Dev Tooling` to `Package Metadata`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `lifespan()` (e.g. with `init_indexes()` and `close_mongo_connection()`) actually correct?**
  _`lifespan()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Create all MongoDB indexes for the planify database.`, `Open async MongoDB connection on app startup.`, `Close MongoDB connection on app shutdown.` to the rest of the system?**
  _71 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Frontend Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._
- **Should `Dev Tooling` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Should `Backend MongoDB API` be split into smaller, more focused modules?**
  _Cohesion score 0.13970588235294118 - nodes in this community are weakly interconnected._