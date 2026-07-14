"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import {
  REPORT_TABS,
  type ReportType,
  type ReportRecord,
  hasReportContent,
  reportTabLabel,
} from "@/lib/reports";
import { ReportMarkdownBody } from "@/components/reports/ReportMarkdownBody";

import "./report.css";

interface Version {
  version_id: string;
  version_number: number;
  created_at: string | null;
  edit_source: string;
}

interface Comment {
  id: string;
  author: string;
  text: string;
  time: string;
}

const SAMPLE_COMMENTS: Comment[] = [
  { id: "c1", author: "Product Lead", text: "The onboarding steps in Section 3 look solid. Let's make sure the SDK requirements are highlighted.", time: "1h ago" },
  { id: "c2", author: "AI Assistant", text: "I have updated the requirements. Feel free to prompt me for any other additions.", time: "45m ago" },
];

export default function ReportsPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { data: session } = useSession();
  const [reports, setReports] = useState<Record<string, ReportRecord | null>>({});
  const [activeTab, setActiveTab] = useState<ReportType>("prd");
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<{ title: string } | null>(null);
  const [exporting, setExporting] = useState<"pdf" | "docx" | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Outline navigation state
  const [activeSection, setActiveSection] = useState<string>("overview");

  // Versions / Comments side state
  const [rightTab, setRightTab] = useState<"versions" | "comments">("versions");
  const [comments, setComments] = useState<Comment[]>(SAMPLE_COMMENTS);
  const [newComment, setNewComment] = useState("");
  const [versions, setVersions] = useState<Version[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  
  // AI Regenerate prompt state (passed to chat workspace via sessionStorage)
  const [aiPrompt, setAiPrompt] = useState("");
  const [leftNavOpen, setLeftNavOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);

  const closePanels = () => {
    setLeftNavOpen(false);
    setRightPanelOpen(false);
  };

  const accessToken = (session?.user as { accessToken?: string })?.accessToken;
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const fetchVersions = useCallback(
    async (reportType: string) => {
      if (!accessToken) return;
      setVersionsLoading(true);
      try {
        const data = await apiFetch<Version[]>(
          `/api/projects/${projectId}/reports/${reportType}/versions`,
          { accessToken }
        );
        setVersions(data || []);
      } catch (err) {
        console.error("Failed to load report versions:", err);
        setVersions([]);
      } finally {
        setVersionsLoading(false);
      }
    },
    [accessToken, projectId]
  );

  useEffect(() => {
    if (!session || !accessToken) return;

    const fetchData = async () => {
      setLoadError(null);
      try {
        const [projectData, reportsData] = await Promise.all([
          apiFetch<{ title: string }>(`/api/projects/${projectId}`, { accessToken }),
          apiFetch<Record<string, ReportRecord>>(
            `/api/projects/${projectId}/reports`,
            { accessToken }
          ),
        ]);
        setProject({ title: projectData.title });

        const parsed: Record<string, ReportRecord | null> = {};
        for (const tab of REPORT_TABS) {
          const report = reportsData[tab.key];
          parsed[tab.key] = report ?? null;
        }
        // Include any extra report types returned by the API
        for (const [type, report] of Object.entries(reportsData)) {
          if (!(type in parsed)) {
            parsed[type] = report;
          }
        }
        setReports(parsed);

        const firstWithContent = REPORT_TABS.find((t) =>
          hasReportContent(reportsData[t.key]?.content)
        );
        if (firstWithContent) {
          setActiveTab(firstWithContent.key);
        }
      } catch (err) {
        console.error("Failed to load reports:", err);
        setLoadError("Could not load reports from the backend.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session, accessToken, projectId]);

  useEffect(() => {
    if (accessToken && activeTab) {
      fetchVersions(activeTab);
    }
  }, [accessToken, activeTab, fetchVersions]);

  const handleExport = async (format: "pdf" | "docx") => {
    setExporting(format);
    try {
      const res = await fetch(`${API_BASE}/api/projects/${projectId}/export/${format}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `planify-${project?.title || "report"}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
      alert("Export failed. Make sure system libraries are installed (see docs).");
    } finally {
      setExporting(null);
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const comment: Comment = {
      id: `c-${Date.now()}`,
      author: session?.user?.email?.split("@")[0] || "You",
      text: newComment.trim(),
      time: "Just now",
    };
    setComments((prev) => [...prev, comment]);
    setNewComment("");
  };

  const reportsGenerated = Object.values(reports).some((r) => hasReportContent(r?.content));
  const activeReport = reports[activeTab];
  const activeReportData = activeReport?.content ?? null;
  const activeReportVersion = activeReport?.version ?? 0;
  const activeReportUpdated = activeReport?.updated_at;

  if (loading) {
    return (
      <div
        style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          minHeight: "100vh", background: "oklch(12% 0.012 265)",
          flexDirection: "column", gap: 16,
        }}
      >
        <div
          style={{
            width: 36, height: 36, borderRadius: "50%",
            border: "2px solid oklch(68% 0.14 295 / 0.25)",
            borderTopColor: "oklch(68% 0.14 295)",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const outlineSections = [{ key: "overview", label: "Full document" }];

  return (
    <div className="r-shell">
      {(leftNavOpen || rightPanelOpen) && (
        <div
          className={`r-overlay ${leftNavOpen || rightPanelOpen ? "is-visible" : ""}`}
          onClick={closePanels}
          aria-hidden="true"
        />
      )}

      {/* Tab/Outline Left Navigation */}
      <aside className={`r-left-nav ${leftNavOpen ? "is-open" : ""}`}>
        {/* Project info link */}
        <div style={{ padding: "16px 20px 8px" }}>
          <Link
            href={`/projects/${projectId}/chat`}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              fontSize: 12, fontWeight: 550, color: "var(--r-accent)",
              textDecoration: "none", fontFamily: "var(--r-font-mono)",
            }}
          >
            ← Chat workspace
          </Link>
        </div>

        <div className="r-nav-header">Document tabs</div>
        <div style={{ padding: "0 12px 8px", display: "flex", flexDirection: "column", gap: 3 }}>
          {REPORT_TABS.map((tab) => {
            const hasData = hasReportContent(reports[tab.key]?.content);
            return (
              <button
                key={tab.key}
                type="button"
                className={`r-nav-btn ${activeTab === tab.key ? "active" : ""}`}
                onClick={() => {
                  setActiveTab(tab.key);
                  setActiveSection("overview");
                  closePanels();
                }}
              >
                <span>{tab.icon}</span>
                <span style={{ flex: 1 }}>{tab.label}</span>
                {!hasData && (
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--r-border-strong)" }} />
                )}
              </button>
            );
          })}
        </div>

        {loadError && (
          <p style={{ padding: "8px 16px", fontSize: 12, color: "var(--r-danger)" }}>{loadError}</p>
        )}

        <div className="r-nav-header">Outline</div>
        <div className="r-nav-list">
          {outlineSections.map((sec) => (
            <button
              key={sec.key}
              type="button"
              className={`r-nav-btn ${activeSection === sec.key ? "active" : ""}`}
              onClick={() => setActiveSection(sec.key)}
            >
              <span>·</span>
              {sec.label}
            </button>
          ))}
        </div>
      </aside>

      {/* Main Document Content */}
      <main className="r-center-doc">
        {/* Mobile navigation bar */}
        <div className="r-mobile-bar">
          <button
            type="button"
            className="r-mobile-bar-btn"
            onClick={() => {
              setRightPanelOpen(false);
              setLeftNavOpen((v) => !v);
            }}
            aria-label={leftNavOpen ? "Close document tabs" : "Open document tabs"}
            aria-expanded={leftNavOpen}
          >
            ☰ Tabs
          </button>
          <span className="r-mobile-bar-title">{project?.title || "Reports"}</span>
          <button
            type="button"
            className="r-mobile-bar-btn"
            onClick={() => {
              setLeftNavOpen(false);
              setRightPanelOpen((v) => !v);
            }}
            aria-label={rightPanelOpen ? "Close panel" : "Open versions and comments"}
            aria-expanded={rightPanelOpen}
          >
            Panel
          </button>
        </div>

        {/* Document Top bar with Title & Export Actions */}
        <header className="r-doc-topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--r-muted)" }}>
            <span>Acme Ventures</span>
            <span>/</span>
            <strong>{project?.title || "Reports"}</strong>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              className="r-btn r-btn-secondary"
              onClick={() => handleExport("docx")}
              disabled={exporting !== null || !reportsGenerated}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              {exporting === "docx" ? "Exporting..." : "DOCX"}
            </button>
            <button
              type="button"
              className="r-btn r-btn-primary"
              onClick={() => handleExport("pdf")}
              disabled={exporting !== null || !reportsGenerated}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              {exporting === "pdf" ? "Exporting..." : "Export PDF"}
            </button>
          </div>
        </header>

        {/* Scrollable document area */}
        <div className="r-doc-scroll">
          {!activeReportData || !hasReportContent(activeReportData) ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingBlock: 96, textAlign: "center", marginTop: 80 }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--r-subtle)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 12 }}>
                <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 12h6M9 16h4"/>
              </svg>
              <h2 style={{ fontSize: 16, fontWeight: 550, marginBottom: 4 }}>Report not generated</h2>
              <p style={{ fontSize: 13, color: "var(--r-subtle)", maxWidth: "32ch", lineHeight: 1.5 }}>
                Return to the Chat workspace to instruct the AI agents on this deliverable.
              </p>
            </div>
          ) : (
            <article className="r-doc-container">
              {/* Document Heading */}
              <h1 className="r-doc-title">{reportTabLabel(activeTab)}</h1>

              <div className="r-doc-meta">
                <span>v{activeReportVersion || 1}</span>
                <span>·</span>
                <span>
                  {activeReportUpdated
                    ? `Updated ${new Date(activeReportUpdated).toLocaleString()}`
                    : "Generated by Planify AI"}
                </span>
                <span>·</span>
                <span>By AI Planning Suite</span>
              </div>

              <ReportMarkdownBody content={activeReportData} reportType={activeTab} />

              {/* AI Regenerate Section — routes user back to chat workspace */}
              <div className="r-ai-panel">
                <div className="r-ai-panel-header">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
                  </svg>
                  <span>Refine this report via the AI workspace</span>
                </div>
                <div className="r-ai-panel-input">
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder={`e.g. Regenerate the ${reportTabLabel(activeTab)} with more detail on…`}
                  />
                  <Link
                    href={`/projects/${projectId}/chat`}
                    className="r-ai-btn"
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}
                    onClick={() => {
                      if (aiPrompt.trim()) {
                        try {
                          sessionStorage.setItem(
                            `planify-pending-prompt-${projectId}`,
                            aiPrompt.trim()
                          );
                        } catch {
                          /* ignore */
                        }
                      }
                    }}
                  >
                    Open Chat
                  </Link>
                </div>
              </div>
            </article>
          )}
        </div>
      </main>

      {/* Right Sidebar: Version History & Comments */}
      <aside className={`r-right-panel ${rightPanelOpen ? "is-open" : ""}`}>
        <div className="r-tabs">
          <button
            type="button"
            className={`r-tab ${rightTab === "comments" ? "active" : ""}`}
            onClick={() => setRightTab("comments")}
          >
            Comments ({comments.length})
          </button>
          <button
            type="button"
            className={`r-tab ${rightTab === "versions" ? "active" : ""}`}
            onClick={() => setRightTab("versions")}
          >
            Versions
          </button>
        </div>

        <div className="r-tab-content">
          {/* Comments Section */}
          {rightTab === "comments" && (
            <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
              <div style={{ flex: 1 }}>
                {comments.map((c) => (
                  <div key={c.id} className="r-comment-box">
                    <div className="r-comment-user">{c.author}</div>
                    <div className="r-comment-text">{c.text}</div>
                    <div className="r-comment-time">{c.time}</div>
                  </div>
                ))}
              </div>

              {/* Add comment form */}
              <form onSubmit={handleAddComment} className="r-comment-input" style={{ margin: "-16px", marginTop: "auto" }}>
                <input
                  type="text"
                  placeholder="Ask a question or add note..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <button type="submit" className="r-btn r-btn-primary" style={{ height: 32, padding: "0 8px" }}>
                  Post
                </button>
              </form>
            </div>
          )}

          {/* Version History Section */}
          {rightTab === "versions" && (
            <div>
              {versionsLoading ? (
                <p style={{ fontSize: 12, color: "var(--r-subtle)", padding: 8 }}>Loading versions…</p>
              ) : versions.length === 0 ? (
                <p style={{ fontSize: 12, color: "var(--r-subtle)", padding: 8 }}>
                  No version history yet. Versions are created each time the AI regenerates this report.
                </p>
              ) : (
                versions.map((v, idx) => (
                  <div
                    key={v.version_id}
                    className={`r-version-item ${idx === 0 ? "active" : ""}`}
                  >
                    <div className="r-version-num">v{v.version_number}</div>
                    <div className="r-version-meta">
                      <span>{v.edit_source === "ai" ? "AI Agent" : v.edit_source}</span>
                      <span>
                        {v.created_at
                          ? new Date(v.created_at).toLocaleDateString()
                          : "—"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
