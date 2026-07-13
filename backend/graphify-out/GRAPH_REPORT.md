# Graph Report - backend  (2026-07-14)

## Corpus Check
- 42 files · ~16,507 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 300 nodes · 624 edges · 18 communities (14 shown, 4 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 15 edges (avg confidence: 0.78)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8265bdf9`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- apply_workflow_guards
- project_workflow.py
- get_database
- db.py
- main.py
- chat_service.py
- ProjectRepository
- ProjectWorkflowOutput
- route_after_project_workflow
- logging_config.py
- __init__.py
- __init__.py
- __init__.py
- __init__.py

## God Nodes (most connected - your core abstractions)
1. `get_database()` - 29 edges
2. `apply_workflow_guards()` - 21 edges
3. `run_workflow_and_stream()` - 18 edges
4. `_assert_project_access()` - 17 edges
5. `WorkflowState` - 16 edges
6. `project_workflow_node()` - 11 edges
7. `route_after_project_workflow()` - 11 edges
8. `build_graph()` - 10 edges
9. `gather_web_intel()` - 10 edges
10. `ProjectRepository` - 9 edges

## Surprising Connections (you probably didn't know these)
- `build_graph()` --indirect_call--> `conversation_understanding_node()`  [INFERRED]
  app/agent/graph.py → app/agent/nodes/conversation_understanding.py
- `build_graph()` --indirect_call--> `project_workflow_node()`  [INFERRED]
  app/agent/graph.py → app/agent/nodes/project_workflow.py
- `build_graph()` --indirect_call--> `route_after_project_workflow()`  [INFERRED]
  app/agent/graph.py → app/agent/router.py
- `test_route_after_project_workflow_discovery_complete_report_allowed()` --calls--> `route_after_project_workflow()`  [INFERRED]
  app/agent/test_router.py → app/agent/router.py
- `test_route_after_project_workflow_discovery_incomplete_report_blocked()` --calls--> `route_after_project_workflow()`  [INFERRED]
  app/agent/test_router.py → app/agent/router.py

## Import Cycles
- None detected.

## Communities (18 total, 4 thin omitted)

### Community 0 - "apply_workflow_guards"
Cohesion: 0.10
Nodes (40): router.py --------- Conditional-edge routing functions. Kept separate from node, ConversationCategory, NextWorkflow, ProjectAction, schemas.py ---------- Pydantic models used for structured LLM output via `.with_, The only two routing categories the Conversation Understanding     node is allow, What the user is doing in this turn relative to the project lifecycle.      The, Downstream specialist agents this node can route to. (+32 more)

### Community 1 - "project_workflow.py"
Cohesion: 0.08
Nodes (35): _best_ollama_model(), get_base_llm(), get_provider_info(), get_structured_llm(), llm.py ------ LLM instantiation — Ollama only, model: mistral:latest.  Change OL, Returns the configured Ollama model name (env override or default)., Returns a cached ChatOllama instance using the best available model., Returns a structured-output chain backed by the best Ollama model.      Ollama s (+27 more)

### Community 2 - "get_database"
Cohesion: 0.14
Nodes (33): get_database(), export_docx(), export_pdf(), _load_all_reports(), Request, Export routes — PDF and DOCX download., _report_markdown(), _reports_to_html() (+25 more)

### Community 3 - "db.py"
Cohesion: 0.09
Nodes (30): get_checkpointer(), get_db(), init_db(), Call once at application startup to create indexes., Returns a cached MongoDBSaver checkpointer using the sync MongoClient., Returns a cached asynchronous Motor database handle., build_graph(), graph.py -------- Assembles the LangGraph StateGraph.  Flow:      START       │ (+22 more)

### Community 4 - "main.py"
Cohesion: 0.11
Nodes (26): get_settings(), Application configuration via environment variables., Settings, init_indexes(), MongoDB index initialization., Create an index, ignoring conflicts with existing equivalent indexes., _safe_create_index(), close_mongo_connection() (+18 more)

### Community 5 - "chat_service.py"
Cohesion: 0.12
Nodes (33): get_messages(), Request, send_message(), ChatHistoryResponse, ChatMessageResponse, BaseModel, Chat-related schemas., SendMessageRequest (+25 more)

### Community 6 - "ProjectRepository"
Cohesion: 0.10
Nodes (16): ConversationRepository, get_sync_db(), _now(), ProjectRepository, Any, Sync CRUD operations for the `projects` collection., Inserts a new project document and returns its string ID., Returns the most recent project for a given session, or None. (+8 more)

### Community 7 - "ProjectWorkflowOutput"
Cohesion: 0.18
Nodes (10): ConversationUnderstandingOutput, ProjectContext, ProjectWorkflowOutput, Any, BaseModel, The single source of truth for all accumulated project knowledge.      Rules:, Structured output contract for the Project Workflow Agent node.      Matches the, Enforce the ≤3 clarification questions hard limit. (+2 more)

### Community 8 - "route_after_project_workflow"
Cohesion: 0.36
Nodes (8): Routes to report_generator only for real report workflow names.      Non-report, route_after_project_workflow(), test_route_after_project_workflow_discovery_complete_report_allowed(), test_route_after_project_workflow_discovery_incomplete_report_blocked(), test_route_after_project_workflow_general_no_action(), test_route_after_project_workflow_user_requested_report_allowed_even_if_discovery_incomplete(), test_route_ends_when_only_non_report_workflows(), test_route_ignores_non_report_workflows()

### Community 9 - "logging_config.py"
Cohesion: 0.33
Nodes (5): CorrelationIdFilter, Structured JSON logging configuration., setup_logging(), Logger, LogRecord

## Knowledge Gaps
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `get_database()` connect `get_database` to `main.py`, `chat_service.py`?**
  _High betweenness centrality (0.095) - this node is a cross-community bridge._
- **Why does `apply_workflow_guards()` connect `apply_workflow_guards` to `project_workflow.py`?**
  _High betweenness centrality (0.081) - this node is a cross-community bridge._
- **Why does `ProjectRepository` connect `ProjectRepository` to `db.py`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **What connects `Planify backend — FastAPI application package.`, `LangGraph agent workflow for Planify.`, `Returns a cached synchronous PyMongo database handle.` to the rest of the system?**
  _86 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `apply_workflow_guards` be split into smaller, more focused modules?**
  _Cohesion score 0.10042283298097252 - nodes in this community are weakly interconnected._
- **Should `project_workflow.py` be split into smaller, more focused modules?**
  _Cohesion score 0.08048780487804878 - nodes in this community are weakly interconnected._
- **Should `get_database` be split into smaller, more focused modules?**
  _Cohesion score 0.13513513513513514 - nodes in this community are weakly interconnected._