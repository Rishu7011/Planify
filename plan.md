# AI Project Intelligence Platform — Technical Architecture Blueprint

**Document type:** Architectural planning document (no code, no implementation)
**Audience:** Engineering leadership, founding engineers, AI architects
**Status:** v1.0 — Foundational blueprint

---

## 0. Document Purpose

This document translates the product vision (raw idea → enterprise-grade PRD, feasibility study, business intelligence, ROI model, org plan, and roadmap) into a concrete technical architecture. It covers system design, data design, AI orchestration design, security, and a phased delivery roadmap. It intentionally excludes code, specific library versions, and schema syntax — this is the blueprint from which those get built.

---

## 1. Product Understanding Summary

### 1.1 What we are building
An AI system that behaves like a **fused team of a Product Manager, Business Analyst, Solution Architect, and Strategy Consultant**, operating over a persistent, multi-turn conversation tied to a "Project." The system ingests unstructured input (text, chat, images, PDFs, documents) and produces a **connected set of enterprise planning artifacts** — not isolated documents, but outputs that stay logically consistent with one another as assumptions change.

### 1.2 What makes this different from "an AI writes a document" tool
Three properties define this product technically:

1. **Statefulness** — the system maintains a durable, evolving understanding of "what this project is" across a long-lived conversation, not a single-shot prompt.
2. **Interconnection** — every generated artifact (PRD, ROI model, hiring plan, roadmap) is derived from a **shared context object**, so changing one assumption (e.g., budget) triggers re-derivation of dependent artifacts.
3. **Multi-agent reasoning** — different specialized agents own different reasoning domains (technical feasibility vs. financial modeling vs. market research), coordinated by an orchestration layer, rather than one generalist prompt trying to do everything at once.

### 1.3 Core entities in the system
- **User** — an individual account holder.
- **Organization / Workspace** — a billing and collaboration boundary (personal or team).
- **Project** — the unit of work; represents one "idea" being planned.
- **Chat Session** — the conversational interface through which a Project is developed.
- **AI Workflow Run** — one execution of the LangGraph pipeline against a Project's context.
- **Generated Reports** — versioned, structured outputs (PRD, feasibility, BI, ROI, HR plan, roadmap) tied to a Project.

### 1.4 Non-goals (explicitly out of scope for the platform itself)
- The platform does not execute the project (it does not write the healthcare app's code) — it plans it.
- The platform does not claim legal, financial, or regulatory certification — outputs are advisory.
- The platform is not a general-purpose chatbot — every conversation is scoped to a Project context.

---

## 2. System Architecture

### 2.1 Layered overview

```
User (Browser / Mobile Web)
        ↓
Next.js Application (Presentation + Auth + Session Layer)
        ↓  (authenticated HTTPS requests, signed identity)
FastAPI Backend (API, Business Logic, Orchestration Trigger)
        ↓
LangGraph Workflow Engine (Stateful AI Orchestration)
        ↓
AI Agents (Specialized reasoning units)
        ↓
MongoDB (System of record) ⇄ Vector Store (semantic memory/RAG) ⇄ External Tools (search, file parsing)
        ↓
Generated Reports (persisted, versioned, streamed back to user)
```

### 2.2 Responsibility of every layer

**Next.js Application**
- Renders UI, owns all authentication UX (login, signup, OAuth, session state).
- Manages client-side routing, protected routes, optimistic UI for chat.
- Never contains business logic or AI orchestration — it is a thin, secure presentation and identity layer.
- Responsible for streaming AI responses to the UI (via SSE/streaming proxy from FastAPI).

**FastAPI Backend**
- The single source of business logic: project CRUD, file ingestion, permission enforcement, billing/usage checks.
- Validates identity on every request (see Section 3).
- Triggers and monitors LangGraph workflow runs; does not itself contain agent prompt logic (that lives in the AI orchestration layer, though it's deployed as part of the same backend service in early phases).
- Writes all durable state to MongoDB; never trusts the frontend for authorization decisions.

**LangGraph Workflow Engine**
- Owns the *stateful* execution of the multi-agent pipeline for a given user turn.
- Holds transient execution state (which agent is running, intermediate reasoning, retry state) — this state is workflow-scoped, not permanent.
- Emits structured outputs back to FastAPI for persistence.

**AI Agents**
- Each agent is a bounded reasoning unit with a defined input contract, output schema, and tool access (see Section 7).

**MongoDB / Vector Store / External Tools**
- MongoDB: permanent system of record — users, projects, chats, generated reports, versions.
- Vector store: semantic memory for RAG over uploaded documents and prior project context (introduced when documents/long context exceed prompt-window practicality — not needed in MVP).
- External tools: web/market search, file/image parsing utilities, currency/cost reference data.

### 2.3 Complete request lifecycle (example: user sends a chat message)

1. User types message in Next.js chat UI → client calls FastAPI endpoint with session token attached.
2. Next.js middleware confirms an active session exists before allowing the call (UX-layer gate).
3. FastAPI middleware verifies the identity token cryptographically (trust boundary — see Section 3.4), resolves `user_id` + `organization_id`, and checks authorization (does this user have write access to this project?).
4. FastAPI persists the raw user message to `chat_messages`, then loads Project context (prior messages, uploaded file summaries, existing report state) from MongoDB.
5. FastAPI invokes the LangGraph workflow, passing in: chat history, project context, uploaded file references, current assumption set.
6. LangGraph routes execution: input-understanding → (clarification needed? → ask) or (sufficient info? → fan out to specialist agents).
7. Agents execute (sequentially or in parallel per dependency graph), each producing structured output validated against a schema.
8. Final Report Agent assembles/updates the connected artifact set.
9. FastAPI persists agent outputs and report versions to MongoDB, streams the assistant's response back to Next.js.
10. Next.js renders the response and updates any visible report panels in real time.

### 2.4 Data movement summary
- **Hot path** (chat turn): Next.js ⇄ FastAPI ⇄ LangGraph ⇄ MongoDB. Optimized for low latency and streaming.
- **Cold path** (report generation/regeneration): FastAPI ⇄ LangGraph ⇄ multiple agents ⇄ MongoDB. Can be async/background for longer-running multi-agent fan-outs.
- **File path**: Next.js uploads → FastAPI file service → object storage (not MongoDB itself for binary content) → parsed text/summary stored in MongoDB, referenced by `uploaded_files`.

### 2.5 Scaling approach
- **Frontend**: stateless, horizontally scaled behind CDN/edge; no server-side session storage beyond what NextAuth requires.
- **Backend**: stateless FastAPI instances behind a load balancer; horizontal scaling is straightforward since all durable state lives in MongoDB.
- **AI orchestration**: the LangGraph execution is the most resource- and latency-sensitive component. Long-running multi-agent workflows should be moved to a **background job/queue model** (Section 8) rather than held open on a synchronous HTTP request, so the API layer scales independently from AI compute.
- **Database**: MongoDB scales via replica sets initially, sharding by `organization_id` if/when multi-tenant volume requires it (not an MVP concern).
- **Vector store**: scaled independently, introduced only when RAG becomes necessary (large documents, long project histories).

---

## 3. Authentication Architecture

### 3.1 Principle
Next.js (via NextAuth/Auth.js) is the **sole owner of authentication**. FastAPI never handles passwords, OAuth handshakes, or login logic — it only **verifies identity** on incoming requests. This separation keeps credential-handling surface area in one well-audited place.

### 3.2 MongoDB Adapter collections (owned by NextAuth)
- `users` — canonical identity record (id, email, name, image, emailVerified, createdAt).
- `accounts` — linked OAuth provider identities (Google, GitHub) per user.
- `sessions` — active session records (if using database session strategy).
- `verification_tokens` — email verification / passwordless flow tokens.

These collections are **owned and written by NextAuth's adapter**, not directly by FastAPI's data layer, to avoid two systems mutating auth state inconsistently.

### 3.3 JWT vs. database session strategy — recommendation

| Aspect | JWT strategy | Database session strategy |
|---|---|---|
| Backend verification | Backend can verify signature locally, no DB round-trip | Requires DB lookup or shared session store |
| Revocation | Harder — token valid until expiry unless a blocklist is maintained | Easy — delete session row |
| Scaling | Excellent — fully stateless | Requires session store accessible to all services |
| Complexity | Lower initial complexity | Slightly more moving parts |

**Recommendation:** Use **JWT session strategy** for the primary session token (fast, stateless, scales cleanly across Next.js and FastAPI), but back it with a **short expiry + refresh pattern**, and maintain a minimal server-side revocation list for high-sensitivity actions (e.g., org ownership transfer, billing changes) rather than relying on JWT alone everywhere. This gives the scaling benefits of JWT without giving up the ability to kill a compromised session for critical actions.

### 3.4 Next.js ↔ FastAPI communication (the trust boundary)

This is the most security-critical integration point in the system, so it deserves explicit treatment:

1. NextAuth issues a signed JWT (or session cookie referencing a DB session) after successful login.
2. When Next.js calls FastAPI, it attaches the **signed JWT** as a bearer token (never the raw session cookie, and never user-supplied IDs).
3. FastAPI has a shared secret (or public key, if using asymmetric signing) to **independently verify the JWT signature** — it does not call back to Next.js to check validity, and it does not trust any `user_id` sent in a request body.
4. Once verified, FastAPI extracts `user_id` (and `org_id` if present) from the **verified token claims only**, and uses that as the sole source of identity for all downstream authorization checks.
5. Every FastAPI route explicitly re-checks: does this verified user have permission for this specific project/organization/resource? (Never assume frontend-level route protection is sufficient — the API must independently enforce authorization on every call.)
6. Generated AI data (reports, chat messages, workflow runs) is always written with the **verified `user_id`/`org_id`** attached at write time, not passed in as trusted client data — this is what makes "how generated AI data connects with users" secure rather than spoofable.

**Golden rule:** Next.js is the identity issuer; FastAPI is the identity verifier and authorization enforcer. Neither layer trusts unverified client-supplied identity fields.

---

## 4. SaaS Authorization System

### 4.1 Workspace model
- **Personal workspace** — created automatically per user, always exists, cannot be deleted, single-member.
- **Organization workspace** — created explicitly, supports multiple members, has its own billing entity.
- A user can belong to multiple organizations; every resource (project, chat, report) belongs to exactly one workspace (personal or organization), never both.

### 4.2 Roles
| Role | Description |
|---|---|
| **OWNER** | Full control, including billing and org deletion. Usually the org creator. |
| **ADMIN** | Full operational control except billing/org deletion. |
| **MEMBER** | Can create/edit projects and participate in chats/reports they have access to. |
| **VIEWER** | Read-only access to shared projects/reports; cannot edit or trigger AI workflows. |

### 4.3 Permission matrix

| Resource | OWNER | ADMIN | MEMBER | VIEWER |
|---|---|---|---|---|
| Create project | ✅ | ✅ | ✅ | ❌ |
| Edit/delete own project | ✅ | ✅ | ✅ | ❌ |
| Edit others' projects | ✅ | ✅ | ⚠️ (if shared with edit rights) | ❌ |
| View shared projects | ✅ | ✅ | ✅ | ✅ |
| Start/continue AI chat | ✅ | ✅ | ✅ | ❌ |
| Export reports | ✅ | ✅ | ✅ | ✅ (view-export only, no regenerate) |
| Invite/remove members | ✅ | ✅ | ❌ | ❌ |
| Change member roles | ✅ | ✅ (cannot elevate to OWNER) | ❌ | ❌ |
| Billing/subscription | ✅ | ❌ | ❌ | ❌ |
| Org settings | ✅ | ✅ | ❌ | ❌ |
| Delete organization | ✅ | ❌ | ❌ | ❌ |

Authorization checks live in the FastAPI service layer (never trusted from the client), evaluated per-request against the verified `user_id` + the resource's `organization_id`/`project_id` ownership and sharing metadata.

---

## 5. User Journey (Worked Example)

**Scenario:** User enters "I want to create an AI healthcare startup."

1. **Account creation** — user signs up via Google/GitHub OAuth or credentials (NextAuth handles this entirely).
2. **Workspace context** — user lands in their personal workspace by default; can create/switch to an Organization workspace.
3. **Project creation** — user creates a new Project ("AI Healthcare Startup"), which initializes an empty context object and a new `chat_session`.
4. **Chat begins** — user types the idea as a first message; can also drop in supporting images, PDFs, or documents in the same turn or later turns.
5. **Ingestion** — uploaded files go through the Document/Image Agent, which extracts and summarizes relevant content into the shared project context (not stored as raw dumps in the prompt — summarized/structured first).
6. **Clarification** — rather than generating immediately, the Clarification Agent identifies missing critical information and asks targeted questions: *Who is this for — patients, doctors, hospitals? What's the core problem — triage, monitoring, diagnosis support? What region/regulatory context? Approximate budget appetite? Team stage?*
7. **User responds** — answers are appended to chat history and merged into the structured project context object (this object, not raw chat text, is what agents primarily reason over).
8. **Workflow trigger** — FastAPI invokes the LangGraph workflow with: full chat history, structured context, file summaries, and any existing report state (for regeneration cases).
9. **Agent execution** — specialist agents run per the dependency graph (Section 7), each producing validated structured output.
10. **Report assembly** — the Final Report Agent merges outputs into the connected artifact set (PRD, feasibility, BI, ROI, HR plan, roadmap) and writes versioned records.
11. **Persistence** — all reports, agent outputs, and workflow run metadata are stored in MongoDB, tied to the Project.
12. **Continued interaction** — user can keep chatting ("assume we only have $50K, not $500K"), which triggers **incremental re-derivation**: only the affected agents (ROI, HR planning, roadmap) re-run, not the entire pipeline — this is a key architectural requirement, not an afterthought (see Section 7.4).
13. **Editing & export** — user can manually edit generated report sections (edits are tracked as a distinct version/source, so future AI regenerations don't silently overwrite human edits without confirmation).
14. **Sharing** — user shares the project with teammates at appropriate role/permission levels; teammates can view, comment, or continue the conversation depending on role.

---

## 6. Chat System Architecture

### 6.1 Design intent
A ChatGPT/Claude-Projects-style experience: persistent, project-scoped conversations that accumulate context over time, rather than stateless single Q&A.

### 6.2 `chat_sessions` collection
**Purpose:** represents one conversation thread tied to a Project.
**Key fields:** `_id`, `project_id`, `user_id`, `organization_id`, `title`, `status` (active/archived), `metadata` (e.g., last agent state summary), `created_at`, `updated_at`.
**Relationship:** one Project can have one primary chat session (simplest model) or multiple (if supporting parallel exploration threads later) — MVP should assume **one primary session per project** to avoid premature complexity.

### 6.3 `chat_messages` collection
**Purpose:** the durable, complete conversation log.
**Key fields:** `_id`, `chat_session_id`, `project_id`, `role` (user/assistant/system/agent), `content`, `message_type` (text/clarification_question/agent_result_summary/file_reference), `file_refs` (array of `uploaded_files` ids), `metadata` (e.g., which agent produced this, confidence notes), `created_at`.
**Indexing:** compound index on `(chat_session_id, created_at)` for efficient ordered retrieval.

### 6.4 How the pieces connect
- **Chat ↔ Projects**: every chat session and message is scoped by `project_id`; this is the anchor for all context assembly.
- **Chat ↔ Users/Organizations**: every message/session carries `user_id` and `organization_id` for authorization and multi-tenant isolation.
- **Chat ↔ LangGraph**: on each turn, FastAPI assembles a **context payload** (recent messages + structured project context + file summaries) and passes it into the LangGraph invocation. LangGraph does not read MongoDB directly in early phases — FastAPI is the mediator, keeping the AI layer decoupled from the persistence layer.
- **Chat ↔ AI memory**: MongoDB is the **permanent source of truth** for everything that has been said and generated. LangGraph state is **temporary, execution-scoped memory** — it exists only for the duration of a workflow run (routing decisions, intermediate agent outputs before they're finalized) and is discarded/persisted-out at the end of each run. This distinction matters for scaling: LangGraph state should never be treated as a database.
- **Chat ↔ Generated reports**: reports are **not** stored inline in chat messages — they are separate, versioned documents (`generated_reports`, `report_versions`) that the chat references (e.g., "I've updated the ROI section" links to a specific report version).

---

## 7. LangGraph AI Architecture

### 7.1 Design principles
- **Explicit state schema**: a single shared state object flows through the graph, containing (at minimum): raw input references, structured project context, conversation summary, per-agent outputs, current assumption set, missing-information flags, and a confidence/version marker.
- **Conditional routing over rigid pipelines**: the graph should route based on state (e.g., "is required info present?") rather than always running all 12 agents in a fixed sequence — this controls cost and latency.
- **Incremental re-derivation**: changing one assumption should route only to affected agents (dependency-aware), not restart the full pipeline. This is the technical backbone of the "interconnected reports" promise.
- **Error handling**: every agent node should have a retry/fallback path (e.g., malformed structured output → one retry with corrective instruction → fallback to flagging the section as "needs review" rather than silently failing).
- **Memory strategy**: LangGraph state is short-lived per run; long-term memory (prior project context, accumulated assumptions) is reloaded from MongoDB at the start of each run and written back at the end — LangGraph is not the system of record.

### 7.2 High-level graph flow

```
Entry
  → Input Understanding Agent
  → [conditional] Missing critical info?
        Yes → Clarification Agent → (pause for user response)
        No  → continue
  → Document/Image Agent (if new files present)
  → Fan-out (parallel where independent):
        PRD Agent
        Market Research Agent
        Competitor Analysis Agent
        Technical Architecture Agent
        Risk Analysis Agent
  → Fan-in dependent agents (need outputs above):
        ROI/Finance Agent (needs PRD scope + technical architecture complexity)
        HR Planning Agent (needs PRD scope + technical architecture)
        Roadmap Agent (needs PRD, ROI, HR outputs)
  → Final Report Agent (assembles/merges/version-stamps everything)
  → Persist + respond
```

### 7.3 Agent specifications

**1. Input Understanding Agent**
- *Responsibility:* Parse raw user input into a structured initial project context (idea summary, apparent domain, apparent stage).
- *Input:* latest user message(s), prior context if any.
- *Output:* structured context draft (JSON schema: domain, idea_summary, known_facts, ambiguity_flags).
- *Tools:* none required beyond the LLM itself; may use light classification.
- *Prompt strategy:* extraction-style prompting with strict output schema, explicitly instructed to flag uncertainty rather than infer.
- *Dependencies:* none (entry node).
- *Communicates with:* Clarification Agent (passes ambiguity_flags).

**2. Clarification Agent**
- *Responsibility:* Determine if critical information is missing before generation can be meaningful; if so, generate a small set of targeted questions.
- *Input:* structured context draft, ambiguity_flags.
- *Output:* either `sufficient_context: true` (continue) or a list of clarification questions (pause workflow, return to user).
- *Tools:* none.
- *Prompt strategy:* constrained to ask only high-value questions (max 3–5), never a generic checklist — quality here is the single biggest lever against generic output.
- *Dependencies:* Input Understanding Agent.
- *Communicates with:* halts graph execution and hands control back to the chat layer until user responds.

**3. Document/Image Agent**
- *Responsibility:* Extract and summarize content from uploaded PDFs/images/documents into structured, referenceable facts.
- *Input:* file references (`uploaded_files`), file content (parsed text/OCR output).
- *Output:* structured summary per file + extracted facts merged into project context.
- *Tools:* file parsing/OCR utilities, document text extraction.
- *Prompt strategy:* summarization + fact-extraction, explicitly avoiding verbatim reproduction of copyrighted source material.
- *Dependencies:* triggered whenever new files are present; can run in parallel with Input Understanding on first turn.
- *Communicates with:* feeds all downstream agents via the shared context object.

**4. PRD Agent**
- *Responsibility:* Generate/update the Product Requirements Document (overview, problem statement, goals, personas, user stories, functional/non-functional requirements, acceptance criteria, success metrics, MVP definition).
- *Input:* full structured project context, conversation summary.
- *Output:* structured PRD schema.
- *Tools:* none required; may use retrieval if project context is large (RAG, Phase 2+).
- *Prompt strategy:* section-by-section structured generation with explicit "state your assumptions" instruction.
- *Dependencies:* Input Understanding + Clarification (sufficient context).
- *Communicates with:* feeds Technical Architecture, ROI, HR, and Roadmap agents (they depend on defined feature scope).

**5. Market Research Agent**
- *Responsibility:* Industry/market analysis relevant to the idea.
- *Input:* project context (domain, target audience).
- *Output:* structured market analysis (size signals, trends, relevant segments).
- *Tools:* web search tool (external market data retrieval).
- *Prompt strategy:* retrieval-grounded generation; must cite/attribute sources for factual market claims and avoid fabricated statistics — flagged as "directional estimate" where no reliable source exists.
- *Dependencies:* Input Understanding Agent.
- *Communicates with:* Competitor Analysis Agent, Business Intelligence assembly, ROI Agent (market sizing informs revenue potential ranges).

**6. Competitor Analysis Agent**
- *Responsibility:* Identify comparable products/companies, generate SWOT-style positioning.
- *Input:* project context, market research output.
- *Output:* structured competitor list + SWOT.
- *Tools:* web search.
- *Prompt strategy:* retrieval-grounded, same sourcing discipline as Market Research Agent.
- *Dependencies:* Market Research Agent (runs after or in parallel with shared search results).
- *Communicates with:* PRD Agent (differentiation informs positioning), Roadmap Agent (competitive urgency can affect prioritization).

**7. Technical Architecture Agent**
- *Responsibility:* Assess technical feasibility and implied technical complexity/approach at a **planning level** (not code) — e.g., "this requires real-time data pipelines," "this requires regulatory-grade data handling."
- *Input:* PRD feature scope.
- *Output:* structured feasibility notes + complexity signal (used by ROI/HR agents, not a build spec).
- *Tools:* none required (Phase 1); could use retrieval of technical reference patterns later.
- *Prompt strategy:* feasibility-and-risk framing, explicitly avoiding overconfident technical claims outside the LLM's grounded knowledge.
- *Dependencies:* PRD Agent.
- *Communicates with:* ROI Agent (complexity → cost), HR Planning Agent (complexity → required skill types), Risk Analysis Agent.

**8. ROI / Finance Agent**
- *Responsibility:* Generate cost estimation (development, infrastructure, AI/API, team, operational), revenue possibilities, ROI ranges, break-even analysis.
- *Input:* PRD scope, technical complexity signal, HR plan (if available), user-provided budget constraints.
- *Output:* structured financial model with **explicit ranges and stated assumptions**, never false-precision single numbers.
- *Tools:* none required for MVP; may integrate reference cost datasets later.
- *Prompt strategy:* scenario-based ("bootstrapped" vs. "funded" paths), assumption-transparent.
- *Dependencies:* PRD Agent, Technical Architecture Agent; bidirectionally linked with HR Planning Agent.
- *Communicates with:* HR Planning Agent (cost constraints affect hiring plan size), Roadmap Agent (budget affects phasing).

**9. HR Planning Agent**
- *Responsibility:* Recommend required departments, roles, skills, team structure, and hiring roadmap.
- *Input:* PRD scope, technical complexity, budget constraints from ROI Agent.
- *Output:* structured org plan (roles, seniority, hiring sequence, domain-specific roles the user might not think of — e.g., "clinical advisor" for healthcare).
- *Tools:* none required.
- *Prompt strategy:* domain-aware role suggestion, explicitly checking for regulated-industry-specific roles.
- *Dependencies:* PRD Agent, Technical Architecture Agent, ROI Agent.
- *Communicates with:* Roadmap Agent (hiring sequence affects milestone timing).

**10. Risk Analysis Agent**
- *Responsibility:* Consolidate technical, business, operational, market, and regulatory risks/limitations.
- *Input:* outputs from PRD, Technical Architecture, Market Research, Competitor Analysis agents.
- *Output:* structured risk register (risk, category, severity, mitigation suggestion).
- *Tools:* none required; may cross-reference regulatory search results.
- *Prompt strategy:* explicitly instructed to flag domain-specific regulatory risk (e.g., HIPAA, FDA classification) rather than generic risk boilerplate.
- *Dependencies:* runs after PRD, Technical Architecture, Market/Competitor agents.
- *Communicates with:* Roadmap Agent (major risks become roadmap checkpoints, e.g., "compliance certification" as a milestone).

**11. Roadmap Agent**
- *Responsibility:* Generate milestones, timeline, priority sequencing, delivery strategy.
- *Input:* PRD (MVP definition), ROI (budget/timeline constraints), HR plan (hiring sequence), Risk register (checkpoints).
- *Output:* structured roadmap (phases, milestones, dependencies, priority rationale).
- *Tools:* none required.
- *Prompt strategy:* dependency-aware sequencing, explicitly ties milestones to risk mitigation and hiring events, not just feature completion.
- *Dependencies:* PRD, ROI, HR Planning, Risk Analysis agents (last agent before final assembly).
- *Communicates with:* Final Report Agent.

**12. Final Report Agent**
- *Responsibility:* Assemble, reconcile, and version-stamp the complete connected report set; check cross-document consistency (e.g., does the roadmap's team size match the HR plan?).
- *Input:* all agent outputs.
- *Output:* finalized, versioned report bundle + a consistency-check summary (flags any contradictions for human review rather than silently resolving them).
- *Tools:* none beyond LLM reasoning; primarily a validation/assembly role.
- *Prompt strategy:* consistency-checking and merge-conflict-style flagging.
- *Dependencies:* all other agents.
- *Communicates with:* FastAPI persistence layer (writes `generated_reports`, `report_versions`, `agent_outputs`).

### 7.4 Incremental re-derivation (the interconnection mechanism)
Each agent's output should be tagged with the **input assumptions it depended on** (e.g., ROI Agent tags "assumed budget: $500K, assumed team size: 5"). When a user changes an assumption mid-conversation, a lightweight **dependency resolver** (part of the graph's conditional routing, not a new agent) determines which agents' cached outputs are now stale and re-invokes only those — this avoids expensive full-pipeline reruns and is core to the product's "stays connected" promise.

---

## 8. Database Design (MongoDB)

### 8.1 Authentication (NextAuth-owned)
**`users`** — Purpose: canonical identity. Key fields: `_id`, `name`, `email`, `emailVerified`, `image`, `createdAt`. Relationships: referenced by nearly every other collection via `user_id`. Indexing: unique index on `email`.

**`accounts`** — Purpose: linked OAuth identities. Key fields: `userId`, `provider`, `providerAccountId`, tokens. Indexing: compound unique index on `(provider, providerAccountId)`.

**`sessions`** — Purpose: active sessions (if DB session strategy used for any flows). Key fields: `sessionToken`, `userId`, `expires`. Indexing: unique on `sessionToken`, index on `userId`.

**`verification_tokens`** — Purpose: email verification/passwordless. Key fields: `identifier`, `token`, `expires`. Indexing: compound unique on `(identifier, token)`.

### 8.2 SaaS / Organization
**`organizations`** — Purpose: workspace/billing boundary. Key fields: `_id`, `name`, `owner_id`, `plan_tier`, `created_at`, `settings`. Relationships: has many `members`, `projects`. Indexing: index on `owner_id`.

**`members`** — Purpose: user-to-organization role mapping. Key fields: `organization_id`, `user_id`, `role` (OWNER/ADMIN/MEMBER/VIEWER), `invited_by`, `joined_at`, `status` (active/invited/removed). Indexing: compound unique index on `(organization_id, user_id)`.

### 8.3 Projects
**`projects`** — Purpose: the core planning unit. Key fields: `_id`, `organization_id`, `owner_id`, `title`, `status` (active/archived), `context_object` (the structured, evolving shared project context — domain, assumptions, known facts), `created_at`, `updated_at`. Relationships: has one `chat_session` (MVP), many `uploaded_files`, many `generated_reports`. Indexing: index on `(organization_id, updated_at)` for dashboard listing.

**`uploaded_files`** — Purpose: metadata + parsed summary of user-supplied materials. Key fields: `_id`, `project_id`, `uploaded_by`, `file_type`, `storage_ref` (pointer to object storage, not binary content itself), `parsed_summary`, `extracted_facts`, `created_at`. Indexing: index on `project_id`.

### 8.4 Chat
**`chat_sessions`** — as specified in Section 6.2.
**`chat_messages`** — as specified in Section 6.3.

### 8.5 AI
**`ai_workflow_runs`** — Purpose: track each LangGraph execution for observability/debugging/cost tracking. Key fields: `_id`, `project_id`, `triggered_by_message_id`, `status` (running/completed/failed/awaiting_clarification), `agents_executed`, `token_usage`, `duration_ms`, `error_details`, `created_at`. Indexing: index on `(project_id, created_at)`.

**`agent_outputs`** — Purpose: store each individual agent's raw structured output per run (for debugging, re-derivation dependency tracking, and audit). Key fields: `_id`, `workflow_run_id`, `agent_name`, `input_assumptions`, `output_payload`, `confidence_notes`, `created_at`. Indexing: index on `(workflow_run_id, agent_name)`.

**`generated_reports`** — Purpose: the current, user-facing version of each report type (PRD, feasibility, BI, ROI, HR plan, roadmap). Key fields: `_id`, `project_id`, `report_type`, `current_version_id`, `updated_at`. Indexing: compound unique index on `(project_id, report_type)`.

**`prd_documents`** — Purpose: specialized structured storage for PRD content specifically (given its rich internal structure — personas, user stories, requirements, acceptance criteria are each independently editable). Key fields: `_id`, `project_id`, `sections` (structured sub-documents), `version`, `last_edited_by`, `edit_source` (ai/human). Indexing: index on `project_id`.

**`report_versions`** — Purpose: full version history for every report, enabling rollback and change tracking. Key fields: `_id`, `report_id`, `report_type`, `version_number`, `content_snapshot`, `change_reason` (e.g., "budget assumption changed"), `created_by` (agent name or user_id), `created_at`. Indexing: compound index on `(report_id, version_number)`.

### 8.6 System
**`billing_usage`** — Purpose: track consumption against plan limits (AI runs, tokens, seats). Key fields: `organization_id`, `period`, `usage_type`, `quantity`, `updated_at`. Indexing: compound index on `(organization_id, period)`.

**`activity_logs`** — Purpose: audit trail across the platform (who did what, when) for enterprise compliance. Key fields: `organization_id`, `user_id`, `action`, `resource_type`, `resource_id`, `metadata`, `created_at`. Indexing: compound index on `(organization_id, created_at)`.

### 8.7 Relationship summary
```
organizations 1—* members *—1 users
organizations 1—* projects
projects 1—1 chat_sessions 1—* chat_messages
projects 1—* uploaded_files
projects 1—* ai_workflow_runs 1—* agent_outputs
projects 1—* generated_reports 1—* report_versions
projects 1—1 prd_documents (special-cased due to rich sub-structure)
organizations 1—* billing_usage
organizations 1—* activity_logs
```

---

## 9. FastAPI Backend Design (Conceptual)

> Described at the architectural level — routes, services, and responsibilities, not code.

### 9.1 Route groups
- **Auth verification middleware** — applied globally; verifies JWT, resolves identity, attaches `current_user` context to every request.
- **Organizations & Members** — CRUD for orgs, invite/remove members, role changes.
- **Projects** — CRUD, listing, archiving.
- **Files** — upload handling, triggers Document/Image Agent processing.
- **Chat** — send message, retrieve history, stream AI response.
- **Workflows** — trigger/monitor AI workflow runs (mostly internal, invoked by the chat route).
- **Reports** — retrieve, edit (human override), export, version history.
- **Billing** — usage checks, plan tier enforcement, webhook handling for payment provider events.
- **Admin** — internal/enterprise admin views (usage analytics, audit log access).

### 9.2 Service layer
Business logic isolated from route handlers: `ProjectService`, `ChatService`, `WorkflowOrchestrationService`, `ReportService`, `BillingService`, `AuthorizationService` (the last one centralizes all permission-matrix checks so they aren't duplicated/inconsistent across routes).

### 9.3 Models
Pydantic models mirroring MongoDB document shapes for validation at the API boundary, plus separate strict schemas for each agent's structured output (used to validate LLM outputs before persistence — malformed output should fail validation and trigger the retry/fallback path, not get silently stored).

### 9.4 Middleware
- Identity verification (Section 3.4).
- Authorization enforcement (per-route, backed by `AuthorizationService`).
- Rate limiting (per-user and per-organization, tiered by plan).
- Request logging/tracing (correlation IDs threaded through to `ai_workflow_runs` for debuggability).

### 9.5 Background jobs & queue system
- Long-running multi-agent workflow executions (especially full report generation/regeneration involving many agents) should be **dispatched to a background worker queue**, not held on a synchronous request-response cycle.
- The chat route should return quickly with an acknowledgment + streaming channel (or polling reference), while the actual multi-agent execution happens asynchronously and pushes updates back (via SSE/websocket or client polling on `ai_workflow_runs.status`).
- File parsing (especially OCR/large PDF processing) should also be queued rather than blocking the upload response.

### 9.6 Error handling & logging
- Structured error responses distinguishing: validation errors, authorization errors, AI generation failures (with partial-result handling — return what succeeded, flag what didn't), and infrastructure errors.
- Centralized logging with correlation IDs linking a user action → workflow run → individual agent outputs, essential for debugging "why did this report look generic" issues.

### 9.7 Rate limiting
- Tiered by plan (Basic/Advanced/Enterprise): limits on chat messages per period, AI workflow runs per period, file uploads per period, export operations per period — this is also the primary lever for cost control against runaway AI spend.

---

## 10. Frontend Design (Next.js)

### 10.1 Pages
- **Landing page** — marketing/conversion, not gated.
- **Authentication pages** — login, signup, OAuth callback handling (NextAuth-managed).
- **Dashboard** — list of projects across personal + org workspaces, quick-create entry point.
- **Projects (list/detail)** — project overview, status, quick links to chat and reports.
- **Project chat** — the primary working surface; conversation + inline report previews.
- **AI workflow screen/progress tracker** — visible state of a running multi-agent workflow (which agent is executing, estimated completion) — important for trust/transparency given multi-agent latency.
- **Report viewer** — structured, section-based view of each report type with edit and version-history access.
- **Organization settings** — members, roles, workspace configuration.
- **Billing** — plan tier, usage against limits, invoices, upgrade/downgrade.
- **Profile** — personal account settings.

### 10.2 Components
- **Sidebar** — workspace/project navigation.
- **Navbar** — global actions, workspace switcher, user menu.
- **Chat interface** — streaming message display, clarification-question highlighting (visually distinct from regular assistant text), file attachment affordance.
- **File uploader** — drag-drop, progress state, supported-type validation.
- **AI progress tracker** — real-time or polled status of the active workflow run, agent-by-agent.
- **Report editor** — section-based structured editing (not a single giant text blob), with clear visual distinction between AI-generated and human-edited content.
- **Export controls** — PDF/DOCX export triggers, version selector.

---

## 11. AI Quality Strategy

Preventing generic, low-value AI output is a product-critical concern, not a nice-to-have. Mechanisms:

1. **Clarification before generation** — the single highest-leverage mechanism; no major report generation should proceed on critically ambiguous input.
2. **Structured outputs everywhere** — every agent returns schema-validated JSON, not free text, enabling consistency checks and safe partial regeneration.
3. **Shared agent context** — all agents read from and write to the same evolving project context object, preventing contradictory outputs across documents.
4. **Agent validation** — the Final Report Agent explicitly checks cross-document consistency (e.g., team size in roadmap vs. HR plan) and flags contradictions rather than silently merging them.
5. **Assumption tracking** — every generated figure/claim is tagged with the assumptions it depended on, both for transparency to the user and for enabling incremental re-derivation.
6. **Confidence scoring** — agents flag low-confidence sections (e.g., market size estimates without strong retrieval grounding) distinctly in the UI, rather than presenting everything with uniform false authority.
7. **Version history** — every report change (AI-generated or human-edited) is versioned, so users can see what changed and why, and so AI regeneration never silently destroys human edits without surfacing a conflict.

**The interconnection guarantee, concretely:** changing the stated budget should re-invoke ROI Agent → propagate to HR Planning Agent (team size affordability) → propagate to Roadmap Agent (timeline/phasing) → propagate to Technical Architecture Agent only if scope itself must shrink. This dependency chain must be an explicit, designed part of the graph's conditional routing — not an emergent hope.

---

## 12. Production Features
- Team collaboration (shared projects, role-based access as defined in Section 4).
- Project sharing (link-based or member-based, respecting permission matrix).
- Comments (on report sections, threaded, tied to `user_id`).
- Notifications (workflow completion, clarification needed, teammate activity).
- PDF export / DOCX export (per report type and full bundle).
- Analytics (usage patterns, most-used report types, admin-facing).
- Admin dashboard (org-level usage, billing, audit log access).
- Billing system (plan tiers, usage metering, upgrade/downgrade flows).
- Usage tracking (feeds both billing and rate limiting).
- Audit logs (`activity_logs`, essential for enterprise trust).

---

## 13. Deployment Architecture

- **Containerization**: both Next.js and FastAPI services containerized independently via Docker for environment parity and independent scaling.
- **CI/CD pipeline**: automated build/test/lint on PR, staged deployment (dev → staging → production), with migration/index-check steps for MongoDB schema evolution.
- **Environment variables**: strict separation of secrets (OAuth client secrets, JWT signing keys, DB connection strings, AI API keys) via environment-specific secret management — never committed, never client-exposed.
- **Frontend deployment**: edge/CDN-backed hosting suited to Next.js (static + server-rendered hybrid), independently deployable from backend.
- **Backend deployment**: containerized FastAPI behind a load balancer, horizontally scaled; background workers (queue consumers) deployed as separate scalable pool from the API pool.
- **Database deployment**: managed MongoDB (replica set minimum for production, for durability and read scaling).
- **Monitoring**: application performance monitoring on both services, plus **AI-specific monitoring**: token usage per workflow run, agent failure rates, average workflow latency, cost-per-report — these are distinct from generic APM and must be tracked explicitly given AI cost variability.
- **Logging**: centralized, correlation-ID-linked across frontend request → backend request → workflow run → agent outputs.
- **Scaling strategy**: frontend and backend scale independently and horizontally; the AI orchestration/background worker pool scales based on queue depth, not request count, since workflow execution time varies significantly by complexity.

---

## 14. Development Roadmap

### Phase 1 — MVP
**Goal:** Prove the core end-to-end loop works and produces genuinely useful output for a single user, single project at a time.

**Features:**
- Authentication (NextAuth, Google/GitHub OAuth, personal workspace only — no orgs yet)
- Basic project creation and management
- Core chat system (single session per project)
- File upload + basic parsing (text/PDF; image OCR can be minimal)
- Core LangGraph workflow: Input Understanding → Clarification → PRD Agent → basic Feasibility → basic ROI → basic Roadmap (a reduced agent set; not all 12 agents need to exist on day one)
- Report storage and basic viewer (no rich editing yet)
- Basic PDF export

**Priorities:** correctness of the clarification step and PRD quality above all else — this is the product's credibility foundation. A mediocre PRD generator kills trust before the rest of the platform gets a chance to prove value.

**Technical challenges:** designing the shared context object schema well from the start (retrofitting it later is expensive); getting agent output validation/retry logic right early avoids compounding quality issues later.

**What to avoid:** do not build organizations/teams, billing, or the full 12-agent suite yet. Do not attempt RAG/vector search yet — MVP project contexts are small enough for direct context inclusion. Do not over-invest in a beautiful report editor before the underlying generation quality is validated.

### Phase 2 — Production Version
**Goal:** A scalable, trustworthy product ready for real (non-founder-only) users and small teams.

**Features:**
- Full agent suite (Market Research, Competitor Analysis, Technical Architecture, HR Planning, Risk Analysis agents added)
- Organizations and team collaboration (roles, sharing, permission matrix fully enforced)
- Incremental re-derivation (assumption-change propagation — Section 7.4)
- Report editor with human-edit vs. AI-edit tracking and version history
- DOCX export, richer PDF export
- Performance optimization (background job queue for long workflows, streaming responses)
- Security hardening (rate limiting fully tiered, JWT revocation list, audit logging introduced)

**Priorities:** collaboration correctness (permission edge cases are a common source of embarrassing bugs) and AI quality improvements (confidence scoring, assumption tracking surfaced in UI).

**Technical challenges:** the fan-out/fan-in dependency graph among agents grows more complex with all 12 agents active — careful graph design is required to avoid unnecessary sequential bottlenecks (many agents can run in parallel; only true dependencies should serialize execution).

**What to avoid:** avoid over-engineering enterprise features (SSO, advanced compliance tooling) before there's a paying enterprise customer asking for them — this phase is about production-readiness for startups/teams, not enterprise yet.

### Phase 3 — Enterprise SaaS Version
**Goal:** A complete enterprise-grade platform capable of supporting large organizations with governance, security, and scale requirements.

**Features:**
- Advanced permissions (custom roles, resource-level overrides beyond the base four roles)
- Enterprise security (SSO/SAML, data residency options, enhanced audit logging)
- Full analytics and admin dashboards (org-level usage, cost attribution)
- Billing system maturity (usage-based tiers, invoicing, enterprise contracts)
- Integrations (project management tool exports, HR system handoff for hiring plans)
- Large-scale optimization (sharding strategy if needed, vector store introduction for RAG over large project histories/document libraries)

**Priorities:** security/compliance credibility (this is what unlocks enterprise sales cycles) and integration depth (making generated plans actionable inside tools enterprises already use).

**Technical challenges:** multi-tenant data isolation guarantees become a hard requirement (not just a soft convention) — this is where sharding-by-organization and stricter data governance controls matter.

**What to avoid:** avoid building bespoke integrations speculatively — build them in response to specific enterprise deals/requests, since integration surface area is expensive to maintain.

---

## 15. Important Engineering Guidance

### 15.1 Where LangGraph agents are justified vs. where simpler chains suffice
- **Use full LangGraph multi-agent orchestration for:** the core project-planning pipeline, where genuine multi-step reasoning, conditional routing (clarification loops), and cross-agent dependency (ROI depends on HR depends on PRD) exist. This is the platform's actual differentiator and deserves the investment.
- **Use simple chains/direct prompting for:** single-turn utility tasks that don't need state or routing — e.g., "summarize this uploaded file," "generate an export-friendly title for this project," "rephrase this section." Wrapping every small task in a full graph node is unnecessary overhead and complicates debugging.
- **Rule of thumb:** if a task has no branching logic and no dependency on other agents' outputs, it doesn't need to be a LangGraph node — it can be a direct, simple LLM call inside a service function.

### 15.2 Features that are unnecessary initially
- Vector database / RAG (not needed until project contexts or document libraries genuinely exceed practical context-window handling — premature RAG adds complexity without proven need).
- Multiple chat sessions per project (adds UX and data-model complexity without clear MVP value).
- Custom/granular permission overrides beyond the four base roles.
- Real-time multi-user collaborative editing (comments + versioning cover early collaboration needs without the complexity of operational-transform/CRDT-style live editing).

### 15.3 Common AI SaaS architecture mistakes to avoid
- **Treating LLM state as durable storage** — LangGraph/agent memory must always be reconciled back into MongoDB; never rely on in-memory workflow state surviving beyond a single run.
- **Skipping structured output validation** — free-text agent outputs that get parsed loosely downstream are a recurring source of silent data corruption; enforce schema validation with explicit failure handling.
- **No incremental regeneration strategy** — regenerating the entire report set on every small change is both expensive and slow; the dependency-aware re-derivation model (Section 7.4) must be designed in from the start, not bolted on later.
- **Trusting client-supplied identity or resource IDs** — every authorization check must be re-verified server-side against the cryptographically verified identity, never against client-asserted fields.
- **Over-indexing on frontend polish before generation quality is proven** — a beautiful UI around mediocre AI output does not build trust; validate the clarification-and-generation quality loop first.
- **Under-provisioning for AI latency** — synchronous request/response patterns for long multi-agent workflows lead to timeouts and poor UX; background job + streaming/polling patterns must be in place before Phase 2 scale.

### 15.4 Cost optimization strategies
- **Conditional agent execution** — only run agents whose inputs have actually changed (Section 7.4); this is as much a cost lever as a quality lever.
- **Model tiering** — use smaller/cheaper models for lightweight tasks (summarization, title generation, simple classification) and reserve the most capable model for the reasoning-heavy agents (PRD, Risk Analysis, Final Report assembly).
- **Caching retrieval results** — market/competitor search results for a given domain can be cached for a reasonable window rather than re-searched on every regeneration.
- **Rate limiting tied to plan tier** — directly caps runaway usage cost exposure per account.
- **Token-budget-aware context assembly** — summarize/compress chat history and file content before inclusion in agent prompts rather than always passing full raw history, both for cost and for output quality (bloated context degrades focus).

---

## 16. Summary

This platform's technical core is not "an LLM that writes documents" — it is a **stateful, multi-agent orchestration system with a shared, evolving context object**, backed by a conventional and clean SaaS architecture (Next.js for identity/UI, FastAPI for business logic and authorization, MongoDB as the single system of record). The defensibility and product quality both hinge on the same architectural decision: **treating every generated artifact as a derived view of one shared context, not as an independent document** — everything else in this blueprint exists to make that one property true, reliable, and fast at scale.
