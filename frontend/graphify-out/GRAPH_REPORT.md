# Graph Report - frontend  (2026-07-12)

## Corpus Check
- 36 files · ~16,465 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 179 nodes · 172 edges · 27 communities (17 shown, 10 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `277940ee`
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
- ClarificationPanel.tsx
- icons.tsx
- proxy.ts
- AGENTS.md

## God Nodes (most connected - your core abstractions)
1. `scripts` - 5 edges
2. `apiFetch()` - 4 edges
3. `ChatPage()` - 3 edges
4. `main()` - 3 edges
5. `Button()` - 3 edges
6. `apiStream()` - 3 edges
7. `cn()` - 3 edges
8. `AGENT_ORDER` - 2 edges
9. `ReportsPage()` - 2 edges
10. `{ MongoClient }` - 2 edges

## Surprising Connections (you probably didn't know these)
- `ChatPage()` --calls--> `apiStream()`  [EXTRACTED]
  app/projects/[id]/chat/page.tsx → lib/api.ts
- `ReportsPage()` --calls--> `apiFetch()`  [EXTRACTED]
  app/projects/[id]/reports/page.tsx → lib/api.ts
- `Button()` --calls--> `cn()`  [EXTRACTED]
  components/ui/button.tsx → lib/utils.ts

## Import Cycles
- None detected.

## Communities (27 total, 10 thin omitted)

### Community 0 - "dependencies"
Cohesion: 0.06
Nodes (33): @auth/mongodb-adapter, @base-ui/react, class-variance-authority, clsx, framer-motion, gsap, lucide-react, mongodb (+25 more)

### Community 1 - "page.tsx"
Cohesion: 0.12
Nodes (14): AGENT_LABELS, AGENT_ORDER, ChatPage(), Message, WorkflowEvent, Props, CONTEXT_ITEMS, ContextItem (+6 more)

### Community 2 - "devDependencies"
Cohesion: 0.11
Nodes (19): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node (+11 more)

### Community 3 - "page.tsx"
Cohesion: 0.20
Nodes (10): Comment, REPORT_TABS, ReportsPage(), SAMPLE_COMMENTS, SAMPLE_VERSIONS, TabKey, Version, api (+2 more)

### Community 4 - "package.json"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 6 - "layout.tsx"
Cohesion: 0.33
Nodes (4): geistMono, geistSans, metadata, Providers()

### Community 7 - "AgentTimeline.tsx"
Cohesion: 0.33
Nodes (6): AGENTS, AgentState, AgentTimeline(), FLOW_LABELS, getState(), Props

### Community 8 - "route.ts"
Cohesion: 0.40
Nodes (3): handler, authOptions, options

### Community 9 - "check-db.js"
Cohesion: 0.60
Nodes (4): fs, loadEnv(), main(), { MongoClient }

### Community 11 - "button.tsx"
Cohesion: 0.70
Nodes (3): Button(), buttonVariants, cn()

### Community 12 - "next-auth.d.ts"
Cohesion: 0.40
Nodes (4): JWT, next-auth, next-auth/jwt, Session

## Knowledge Gaps
- **77 isolated node(s):** `handler`, `geistSans`, `geistMono`, `metadata`, `Message` (+72 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.087) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `package.json`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **What connects `handler`, `geistSans`, `geistMono` to the rest of the system?**
  _77 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06060606060606061 - nodes in this community are weakly interconnected._
- **Should `page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11578947368421053 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._