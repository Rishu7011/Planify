"use client";

import { useState } from "react";

// Context panel tab
interface ContextItem {
  key: string;
  value: string;
}

const CONTEXT_ITEMS: ContextItem[] = [
  { key: "Project",  value: "Loading…" },
  { key: "Industry", value: "—" },
  { key: "Team",     value: "—" },
  { key: "Budget",   value: "—" },
  { key: "Timeline", value: "—" },
  { key: "Sources",  value: "0 files" },
];

const MEMORY_ITEMS = [
  { id: "m1", label: "User context", content: "Prefers B2B, SaaS-first, enterprise-grade deliverables." },
  { id: "m2", label: "Last project",  content: "Fintech onboarding redesign — PRD + Arch delivered Jul 9." },
  { id: "m3", label: "Preferences",   content: "Bullet summaries. Short exec sections. Include risk tables." },
];

const REPORT_TYPES = [
  { id: "prd",        label: "PRD",               icon: "📄", ready: false, pages: null },
  { id: "feasibility",label: "Feasibility Study",  icon: "🔬", ready: false, pages: null },
  { id: "roi",        label: "ROI Model",          icon: "📊", ready: false, pages: null },
  { id: "roadmap",    label: "Roadmap",            icon: "🗺", ready: false, pages: null },
  { id: "risk",       label: "Risk Register",      icon: "⚠",  ready: false, pages: null },
  { id: "arch",       label: "Architecture",       icon: "🏗",  ready: false, pages: null },
];

interface RightPanelProps {
  projectTitle?: string;
  reportsReady: boolean;
  reportsGenerated: string[];
  projectId: string;
}

export default function RightPanel({ projectTitle, reportsReady, reportsGenerated, projectId }: RightPanelProps) {
  const [activeTab, setActiveTab] = useState<"context" | "memory" | "reports">("context");

  const tabs: { id: "context" | "memory" | "reports"; label: string }[] = [
    { id: "context", label: "Context" },
    { id: "memory",  label: "Memory" },
    { id: "reports", label: "Reports" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Tab strip */}
      <div className="w-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`w-tab ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {tab.id === "reports" && reportsReady && (
              <span style={{ marginLeft: 4, width: 6, height: 6, borderRadius: "50%", background: "var(--w-success)", display: "inline-block", verticalAlign: "middle" }} />
            )}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: "auto", scrollbarWidth: "none" }}>
        {/* ── Context tab ── */}
        {activeTab === "context" && (
          <div className="w-panel-section">
            <div className="w-panel-label">
              Project context
              <span className="w-badge">{projectTitle ? "Live" : "Empty"}</span>
            </div>
            <div>
              {CONTEXT_ITEMS.map((item, i) => (
                <div key={item.key} className="w-context-item" style={{ borderBottom: i < CONTEXT_ITEMS.length - 1 ? "1px solid var(--w-border)" : "none" }}>
                  <span className="w-context-key">{item.key}</span>
                  <span className="w-context-val" style={{ color: item.value === "—" || item.value === "Loading…" || item.value === "0 files" ? "var(--w-subtle)" : "var(--w-fg)" }}>
                    {item.key === "Project" && projectTitle ? projectTitle : item.value}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 16 }}>
              <div className="w-panel-label">Source files</div>
              <div
                style={{
                  border: "1px dashed var(--w-border)",
                  borderRadius: "var(--w-radius-md)",
                  padding: "16px 12px",
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "border-color var(--w-dur) var(--w-ease)",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--w-border-strong)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--w-border)"; }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--w-subtle)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 6px" }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <div style={{ fontSize: 12, color: "var(--w-subtle)" }}>Drop files or click to upload</div>
                <div style={{ fontSize: 11, color: "var(--w-subtle)", marginTop: 2 }}>PDF, DOCX, PNG, XLSX</div>
              </div>
            </div>
          </div>
        )}

        {/* ── Memory tab ── */}
        {activeTab === "memory" && (
          <div className="w-panel-section">
            <div className="w-panel-label">
              AI memory
              <span className="w-badge w-badge-ai">Active</span>
            </div>
            <div style={{ marginBottom: 12 }}>
              {MEMORY_ITEMS.map((m) => (
                <div key={m.id} className="w-memory-item">
                  <strong>{m.label}</strong>
                  {m.content}
                </div>
              ))}
            </div>

            <div
              style={{
                padding: "10px 12px",
                borderRadius: "var(--w-radius-md)",
                background: "var(--w-ai-muted)",
                border: "1px solid oklch(68% 0.14 295 / 0.2)",
                fontSize: 12, color: "var(--w-muted)", lineHeight: 1.5,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--w-ai)", display: "inline-block" }} />
                <span style={{ color: "var(--w-ai)", fontWeight: 510, fontSize: 11 }}>Session memory active</span>
              </div>
              AI remembers your preferences and past project context within this session.
            </div>
          </div>
        )}

        {/* ── Reports tab ── */}
        {activeTab === "reports" && (
          <div className="w-panel-section">
            <div className="w-panel-label">
              Generated reports
              {reportsReady && <span className="w-badge w-badge-success">Ready</span>}
            </div>

            {!reportsReady && (
              <div style={{ padding: "20px 0", textAlign: "center", color: "var(--w-subtle)", fontSize: 12 }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 8px", display: "block" }}>
                  <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 12h6M9 16h4"/>
                </svg>
                Reports will appear here after analysis completes.
              </div>
            )}

            {REPORT_TYPES.map((r) => {
              const isReady = reportsGenerated.includes(r.id);
              return (
                <div key={r.id} className="w-report-item">
                  <div
                    className="w-report-file-icon"
                    style={{
                      background: isReady ? "oklch(72% 0.15 155 / 0.12)" : "var(--w-glass-bg)",
                      color: isReady ? "var(--w-success)" : "var(--w-subtle)",
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/>
                      <path d="M14 3v5h5"/><path d="M9 12h6M9 16h4"/>
                    </svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="w-report-name" style={{ color: isReady ? "var(--w-fg)" : "var(--w-subtle)" }}>{r.label}</div>
                    <div className="w-report-meta">{isReady ? "Ready · PDF" : "Pending"}</div>
                  </div>
                  {isReady && (
                    <button type="button" className="w-report-action">Export</button>
                  )}
                </div>
              );
            })}

            {reportsReady && (
              <a
                href={`/projects/${projectId}/reports`}
                className="w-btn w-btn-primary"
                style={{ width: "100%", marginTop: 12, height: 36, justifyContent: "center", textDecoration: "none" }}
              >
                View all reports →
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
