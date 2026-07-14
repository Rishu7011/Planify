# Graph Report - frontend  (2026-07-14)

## Corpus Check
- 61 files · ~28,741 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 328 nodes · 517 edges · 26 communities (18 shown, 8 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f6615b7b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- dependencies
- page.tsx
- devDependencies
- page.tsx
- package.json
- page.tsx
- layout.tsx
- AgentTimeline.tsx
- route.ts
- check-db.js
- PRDViewer.tsx
- button.tsx
- next-auth.d.ts
- ProjectCard.tsx
- FeasibilityViewer.tsx
- RoadmapViewer.tsx
- ROIViewer.tsx
- page.tsx
- ClarificationPanel.tsx
- icons.tsx
- AGENTS.md
- page.tsx

## God Nodes (most connected - your core abstractions)
1. `loginHref()` - 12 edges
2. `usersCollection()` - 11 edges
3. `ROUTES` - 11 edges
4. `ChatPage()` - 10 edges
5. `normalizeEmail()` - 10 edges
6. `hashToken()` - 9 edges
7. `apiFetch()` - 8 edges
8. `passwordSetupTokensCollection()` - 8 edges
9. `POST()` - 7 edges
10. `POST()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `ChatPage()` --references--> `AGENT_ORDER`  [EXTRACTED]
  frontend/app/projects/[id]/chat/page.tsx → app/projects/[id]/chat/page.tsx
- `Navbar()` --calls--> `loginHref()`  [EXTRACTED]
  frontend/components/landing/navbar.tsx → frontend/lib/routes.ts
- `ForgotPasswordPage()` --calls--> `loginHref()`  [EXTRACTED]
  frontend/app/(auth)/forgot-password/page.tsx → frontend/lib/routes.ts
- `LoginForm()` --calls--> `safeCallbackUrl()`  [EXTRACTED]
  frontend/app/(auth)/login/page.tsx → frontend/lib/routes.ts
- `SetPasswordForm()` --calls--> `loginHref()`  [EXTRACTED]
  frontend/app/(auth)/set-password/page.tsx → frontend/lib/routes.ts

## Import Cycles
- None detected.

## Communities (26 total, 8 thin omitted)

### Community 0 - "dependencies"
Cohesion: 0.05
Nodes (39): @auth/mongodb-adapter, @base-ui/react, bcryptjs, class-variance-authority, clsx, framer-motion, gsap, lucide-react (+31 more)

### Community 1 - "page.tsx"
Cohesion: 0.06
Nodes (39): AGENT_LABELS, AGENT_ORDER, ChatHistoryResponse, ChatPage(), createStreamingMessage(), getMemoryTone(), isWorkflowEvent(), MemoryItem (+31 more)

### Community 2 - "devDependencies"
Cohesion: 0.07
Nodes (29): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/bcryptjs (+21 more)

### Community 3 - "page.tsx"
Cohesion: 0.16
Nodes (18): Comment, REPORT_TABS, ReportsPage(), SAMPLE_COMMENTS, SAMPLE_VERSIONS, TabKey, Version, Props (+10 more)

### Community 4 - "package.json"
Cohesion: 0.33
Nodes (10): assetAccent(), assetIcon(), AssetsView(), AssetsViewProps, DashboardAsset, LayoutMode, normalizeType(), prettyLabel() (+2 more)

### Community 5 - "page.tsx"
Cohesion: 0.19
Nodes (8): AppEntryCta(), AppEntryCtaProps, Footer(), Navbar(), Button(), buttonVariants, appEntryHref(), cn()

### Community 6 - "layout.tsx"
Cohesion: 0.29
Nodes (5): geistMono, geistSans, metadata, viewport, Providers()

### Community 7 - "AgentTimeline.tsx"
Cohesion: 0.33
Nodes (6): AGENTS, AgentState, AgentTimeline(), FLOW_LABELS, getState(), Props

### Community 8 - "route.ts"
Cohesion: 0.15
Nodes (26): handler, POST(), POST(), POST(), appBaseUrl(), POST(), GET(), authOptions (+18 more)

### Community 9 - "check-db.js"
Cohesion: 0.60
Nodes (4): fs, loadEnv(), main(), { MongoClient }

### Community 11 - "button.tsx"
Cohesion: 0.29
Nodes (5): CONTEXT_ITEMS, ContextItem, MEMORY_ITEMS, REPORT_TYPES, RightPanelProps

### Community 12 - "next-auth.d.ts"
Cohesion: 0.40
Nodes (4): JWT, next-auth, next-auth/jwt, Session

### Community 17 - "page.tsx"
Cohesion: 0.21
Nodes (14): ForgotPasswordPage(), LoginForm(), SetPasswordForm(), SignupPage(), AuthShell(), AUTH_PAGES, isAuthPage(), isProtectedPath() (+6 more)

### Community 22 - "page.tsx"
Cohesion: 0.10
Nodes (24): DashboardPage(), NavView, ChangePasswordOtpForm(), ChangePasswordOtpFormProps, DashboardProject, LayoutMode, matchesStatus(), ProjectsView() (+16 more)

## Knowledge Gaps
- **116 isolated node(s):** `handler`, `NavView`, `geistSans`, `geistMono`, `metadata` (+111 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `apiFetch()` connect `page.tsx` to `page.tsx`, `page.tsx`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Why does `ROUTES` connect `page.tsx` to `page.tsx`, `page.tsx`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `devDependencies`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **What connects `handler`, `NavView`, `geistSans` to the rest of the system?**
  _116 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05128205128205128 - nodes in this community are weakly interconnected._
- **Should `page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06431372549019608 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._