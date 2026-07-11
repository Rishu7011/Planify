# Database Schemas (MongoDB)

This document details the MongoDB collection structures utilized by the AI Project Intelligence Platform.

## 1. Authentication Collections (NextAuth)

### `users`
Persists user profile information.
```json
{
  "_id": "ObjectId",
  "name": "string",
  "email": "string (unique)",
  "emailVerified": "Date | null",
  "image": "string | null",
  "createdAt": "Date"
}
```

### `accounts`
Links OAuth providers (Google, etc.) to users.
```json
{
  "_id": "ObjectId",
  "userId": "ObjectId (ref: users)",
  "provider": "string (google, github)",
  "providerAccountId": "string",
  "access_token": "string | null",
  "refresh_token": "string | null",
  "expires_at": "number | null"
}
```

### `sessions`
If using database sessions (NextAuth writes here if selected; currently configured for JWT strategy).
```json
{
  "_id": "ObjectId",
  "sessionToken": "string (unique)",
  "userId": "ObjectId (ref: users)",
  "expires": "Date"
}
```

---

## 2. Organization Collections

### `organizations`
Groups users and projects under a workspace.
```json
{
  "_id": "ObjectId",
  "name": "string",
  "owner_id": "ObjectId (ref: users)",
  "type": "string (personal, team)",
  "plan_tier": "string (free, pro, enterprise)",
  "settings": "object",
  "created_at": "Date",
  "updated_at": "Date"
}
```

### `members`
Maps users to organizations with specific RBAC roles.
```json
{
  "_id": "ObjectId",
  "organization_id": "ObjectId (ref: organizations)",
  "user_id": "ObjectId (ref: users)",
  "role": "string (OWNER, ADMIN, MEMBER, VIEWER)",
  "invited_by": "ObjectId (ref: users)",
  "joined_at": "Date",
  "status": "string (active, invited, removed)"
}
```

---

## 3. Project Collections

### `projects`
Tracks the core details and the evolving stateful context of a project.
```json
{
  "_id": "ObjectId",
  "organization_id": "ObjectId (ref: organizations)",
  "owner_id": "ObjectId (ref: users)",
  "title": "string",
  "description": "string",
  "status": "string (active, archived)",
  "context_object": {
    "domain": "string",
    "problem_statement": "string",
    "known_facts": ["string"],
    "constraints": {
      "budget": "string | null",
      "team_size": "number | null",
      "timeline": "string | null",
      "regulatory_context": "string | null"
    },
    "ambiguity_flags": ["string"],
    "context_version": "number",
    "last_updated": "Date",
    "stale_agents": ["string"]
  },
  "created_at": "Date",
  "updated_at": "Date"
}
```

### `uploaded_files`
Tracks source documents uploaded by users to feed the agents.
```json
{
  "_id": "ObjectId",
  "project_id": "ObjectId (ref: projects)",
  "uploaded_by": "ObjectId (ref: users)",
  "file_type": "string (pdf, docx, png, jpeg)",
  "storage_ref": "string",
  "file_name": "string",
  "parsed_summary": "string | null",
  "extracted_facts": ["string"],
  "created_at": "Date"
}
```

---

## 4. Chat Collections

### `chat_sessions`
Represents an interactive discussion stream tied to a project.
```json
{
  "_id": "ObjectId",
  "project_id": "ObjectId (ref: projects)",
  "user_id": "ObjectId (ref: users)",
  "organization_id": "ObjectId (ref: organizations)",
  "title": "string",
  "status": "string (active, archived)",
  "metadata": "object | null",
  "created_at": "Date",
  "updated_at": "Date"
}
```

### `chat_messages`
Stores individual messages within a chat session.
```json
{
  "_id": "ObjectId",
  "chat_session_id": "ObjectId (ref: chat_sessions)",
  "project_id": "ObjectId (ref: projects)",
  "role": "string (user, assistant, system, agent)",
  "content": "string",
  "message_type": "string (text, clarification_question, agent_result, file_ref)",
  "file_refs": ["ObjectId (ref: uploaded_files)"],
  "metadata": "object | null",
  "created_at": "Date"
}
```

---

## 5. AI Workflow & Report Collections

### `ai_workflow_runs`
Logs details of agent execution pipelines.
```json
{
  "_id": "ObjectId",
  "project_id": "ObjectId (ref: projects)",
  "triggered_by_message_id": "ObjectId (ref: chat_messages)",
  "status": "string (running, completed, failed, awaiting_clarification)",
  "agents_executed": ["string"],
  "token_usage": {
    "input_tokens": "number",
    "output_tokens": "number",
    "total_tokens": "number"
  },
  "duration_ms": "number",
  "error_details": "string | null",
  "created_at": "Date",
  "updated_at": "Date"
}
```

### `generated_reports`
Pointer to the latest version of planning reports (PRD, ROI, etc.).
```json
{
  "_id": "ObjectId",
  "project_id": "ObjectId (ref: projects)",
  "report_type": "string (prd, feasibility, roi, hr_plan, roadmap)",
  "current_version_id": "ObjectId (ref: report_versions)",
  "updated_at": "Date"
}
```
