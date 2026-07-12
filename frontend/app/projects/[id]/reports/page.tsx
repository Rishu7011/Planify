"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

import "./report.css";

const REPORT_TABS = [
  { key: "prd", label: "PRD", icon: "📋" },
  { key: "feasibility", label: "Feasibility Study", icon: "⚙️" },
  { key: "roi", label: "Financial ROI Model", icon: "📊" },
  { key: "roadmap", label: "Execution Roadmap", icon: "🗺️" },
] as const;

type TabKey = typeof REPORT_TABS[number]["key"];

interface Version {
  version: string;
  date: string;
  author: string;
  active: boolean;
}

const SAMPLE_VERSIONS: Version[] = [
  { version: "v1.2", date: "Jul 11, 2026", author: "AI Agent", active: true },
  { version: "v1.1", date: "Jul 10, 2026", author: "AI Agent", active: false },
  { version: "v1.0", date: "Jul 09, 2026", author: "System", active: false },
];

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
  const [reports, setReports] = useState<Record<string, any>>({});
  const [activeTab, setActiveTab] = useState<TabKey>("prd");
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<{ title: string } | null>(null);
  const [exporting, setExporting] = useState<"pdf" | "docx" | null>(null);

  // Outline navigation state
  const [activeSection, setActiveSection] = useState<string>("overview");

  // Versions / Comments side state
  const [rightTab, setRightTab] = useState<"versions" | "comments">("comments");
  const [comments, setComments] = useState<Comment[]>(SAMPLE_COMMENTS);
  const [newComment, setNewComment] = useState("");
  const [versions, setVersions] = useState<Version[]>(SAMPLE_VERSIONS);
  
  // AI Regenerate prompt state
  const [aiPrompt, setAiPrompt] = useState("");
  const [regenerating, setRegenerating] = useState(false);

  const accessToken = (session?.user as any)?.accessToken;
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    if (!session || !accessToken) return;

    const fetchData = async () => {
      try {
        const [projectData, reportsData] = await Promise.all([
          apiFetch<any>(`/api/projects/${projectId}`, { accessToken }),
          apiFetch<Record<string, any>>(`/api/projects/${projectId}/reports`, { accessToken }),
        ]);
        setProject({ title: projectData.title });
        
        const parsed: Record<string, any> = {};
        for (const [type, report] of Object.entries(reportsData)) {
          parsed[type] = (report as any)?.content || null;
        }
        setReports(parsed);
      } catch (err) {
        console.error("Failed to load reports:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session, accessToken, projectId]);

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

  const handleRegenerate = async () => {
    if (!aiPrompt.trim()) return;
    setRegenerating(true);
    // Mocking regeneration to show feedback
    setTimeout(() => {
      setRegenerating(false);
      setAiPrompt("");
      alert("AI Regeneration prompt logged. The workspace agents have been updated.");
    }, 2000);
  };

  const reportsGenerated = Object.values(reports).some((r) => r !== null);
  const activeReportData = reports[activeTab];

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

  // Define section layout outline based on selected report tab data keys
  const outlineSections = activeTab === "prd" ? [
    { key: "overview", label: "Overview" },
    { key: "problem", label: "Problem Statement" },
    { key: "goals", label: "Project Goals" },
    { key: "personas", label: "User Personas" },
    { key: "stories", label: "User Stories" },
    { key: "functional", label: "Functional Specs" },
    { key: "metrics", label: "Success Metrics" },
  ] : activeTab === "feasibility" ? [
    { key: "overview", label: "Overview" },
    { key: "techStack", label: "Tech Stack" },
    { key: "risk", label: "Technical Risk Analysis" },
    { key: "timeline", label: "Implementation Estimate" },
  ] : activeTab === "roi" ? [
    { key: "overview", label: "Financial Outline" },
    { key: "breakdown", label: "Cost Breakdown" },
    { key: "projections", label: "ROI Projections" },
  ] : [ // roadmap
    { key: "overview", label: "Roadmap Outline" },
    { key: "phases", label: "Timeline Phases" },
    { key: "milestones", label: "Milestones" },
  ];

  return (
    <div className="r-shell">
      {/* Tab/Outline Left Navigation */}
      <aside className="r-left-nav">
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
            const hasData = !!reports[tab.key];
            return (
              <button
                key={tab.key}
                type="button"
                className={`r-nav-btn ${activeTab === tab.key ? "active" : ""}`}
                onClick={() => { setActiveTab(tab.key); setActiveSection("overview"); }}
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
          {!activeReportData ? (
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
              <h1 className="r-doc-title">
                {activeTab === "prd" && "Product Requirements Document (PRD)"}
                {activeTab === "feasibility" && "Technical Feasibility Study"}
                {activeTab === "roi" && "Financial Projections & ROI Model"}
                {activeTab === "roadmap" && "Project Execution Roadmap"}
              </h1>

              <div className="r-doc-meta">
                <span>v1.2 Approved</span>
                <span>·</span>
                <span>Updated 11h ago</span>
                <span>·</span>
                <span>By AI Planning Suite</span>
              </div>

              {/* Rich document body */}
              <div className="r-doc-body">
                {/* ── PRD Viewer ── */}
                {activeTab === "prd" && (
                  <div>
                    {activeSection === "overview" && (
                      <div className="animate-in fade-in duration-200">
                        <h2>{activeReportData.overview?.title || "Project Overview"}</h2>
                        <p>{activeReportData.overview?.content || "Detailed summary of objectives and vision."}</p>
                        
                        <div className="r-callout accent">
                          <strong>Note on scope:</strong> This document outlines MVP requirements and key phases for project realization.
                        </div>
                      </div>
                    )}

                    {activeSection === "problem" && (
                      <div className="animate-in fade-in duration-200">
                        <h2>Problem Statement &amp; Market Opportunity</h2>
                        <p>{activeReportData.problem_statement?.content || "No problem statement registered."}</p>
                      </div>
                    )}

                    {activeSection === "goals" && (
                      <div className="animate-in fade-in duration-200">
                        <h2>Key Goals &amp; Metrics</h2>
                        {activeReportData.goals?.length > 0 ? (
                          <div className="r-table-wrap">
                            <table className="r-table">
                              <thead>
                                <tr>
                                  <th>#</th>
                                  <th>Goal Target Description</th>
                                </tr>
                              </thead>
                              <tbody>
                                {activeReportData.goals.map((g: string, i: number) => (
                                  <tr key={i}>
                                    <td style={{ fontFamily: "var(--r-font-mono)", width: 40 }}>{i + 1}</td>
                                    <td>{g}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p>No goals defined yet.</p>
                        )}
                      </div>
                    )}

                    {activeSection === "personas" && (
                      <div className="animate-in fade-in duration-200">
                        <h2>Target User Personas</h2>
                        {activeReportData.personas?.length > 0 ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            {activeReportData.personas.map((p: any, i: number) => (
                              <div key={i} style={{ padding: 16, border: "1px solid var(--r-border)", borderRadius: "var(--r-radius-md)", background: "var(--r-surface)" }}>
                                <h3 style={{ marginTop: 0, marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
                                  <span style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--r-accent-muted)", color: "var(--r-accent)", display: "grid", placeItems: "center", fontSize: 11 }}>{p.name[0]}</span>
                                  {p.name} ({p.role})
                                </h3>
                                <div style={{ fontSize: 13, color: "var(--r-muted)" }}>
                                  {p.needs?.length > 0 && <div style={{ marginBottom: 6 }}><strong>Needs:</strong> {p.needs.join(", ")}</div>}
                                  {p.pain_points?.length > 0 && <div><strong>Pain points:</strong> {p.pain_points.join(", ")}</div>}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p>No user personas defined.</p>
                        )}
                      </div>
                    )}

                    {activeSection === "stories" && (
                      <div className="animate-in fade-in duration-200">
                        <h2>User Stories</h2>
                        {activeReportData.user_stories?.length > 0 ? (
                          <ul style={{ paddingLeft: 20 }}>
                            {activeReportData.user_stories.map((s: string, i: number) => (
                              <li key={i} style={{ marginBottom: 8 }}>{s}</li>
                            ))}
                          </ul>
                        ) : (
                          <p>No user stories defined.</p>
                        )}
                      </div>
                    )}

                    {activeSection === "functional" && (
                      <div className="animate-in fade-in duration-200">
                        <h2>Functional Specifications &amp; Requirements</h2>
                        {activeReportData.functional_requirements?.length > 0 ? (
                          <ul style={{ paddingLeft: 20 }}>
                            {activeReportData.functional_requirements.map((r: string, i: number) => (
                              <li key={i} style={{ marginBottom: 8 }}>{r}</li>
                            ))}
                          </ul>
                        ) : (
                          <p>No functional requirements defined.</p>
                        )}
                      </div>
                    )}

                    {activeSection === "metrics" && (
                      <div className="animate-in fade-in duration-200">
                        <h2>Success Metrics &amp; OKRs</h2>
                        {activeReportData.success_metrics?.length > 0 ? (
                          <div className="r-table-wrap">
                            <table className="r-table">
                              <thead>
                                <tr>
                                  <th>OKR Metric Key</th>
                                  <th>Target Threshold</th>
                                </tr>
                              </thead>
                              <tbody>
                                {activeReportData.success_metrics.map((m: string, i: number) => (
                                  <tr key={i}>
                                    <td style={{ fontWeight: 550 }}>{m}</td>
                                    <td style={{ color: "var(--r-success)", fontFamily: "var(--r-font-mono)" }}>100% compliant</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p>No success metrics defined.</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Feasibility Study ── */}
                {activeTab === "feasibility" && (
                  <div>
                    {activeSection === "overview" && (
                      <div className="animate-in fade-in duration-200">
                        <h2>Technical Outline</h2>
                        <p>{activeReportData.overview || "Feasibility check on deployment, data, and performance targets."}</p>
                      </div>
                    )}

                    {activeSection === "techStack" && (
                      <div className="animate-in fade-in duration-200">
                        <h2>Recommended Tech Stack</h2>
                        {activeReportData.tech_stack ? (
                          <div className="r-table-wrap">
                            <table className="r-table">
                              <thead>
                                <tr>
                                  <th>Category</th>
                                  <th>Selection</th>
                                  <th>Rationale</th>
                                </tr>
                              </thead>
                              <tbody>
                                {Object.entries(activeReportData.tech_stack).map(([cat, info]: any) => (
                                  <tr key={cat}>
                                    <td style={{ fontWeight: 550, textTransform: "capitalize" }}>{cat.replace("_", " ")}</td>
                                    <td style={{ color: "var(--r-accent)", fontFamily: "var(--r-font-mono)" }}>{info.name}</td>
                                    <td>{info.rationale}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p>No stack recommendation generated.</p>
                        )}
                      </div>
                    )}

                    {activeSection === "risk" && (
                      <div className="animate-in fade-in duration-200">
                        <h2>Risk Mitigation Matrix</h2>
                        {activeReportData.risks?.length > 0 ? (
                          <div className="r-table-wrap">
                            <table className="r-table">
                              <thead>
                                <tr>
                                  <th>Risk Factor</th>
                                  <th>Severity</th>
                                  <th>Mitigation Strategy</th>
                                </tr>
                              </thead>
                              <tbody>
                                {activeReportData.risks.map((r: any, i: number) => (
                                  <tr key={i}>
                                    <td style={{ fontWeight: 550 }}>{r.risk}</td>
                                    <td>
                                      <span className={`w-badge ${r.severity === "high" ? "w-badge-danger" : r.severity === "medium" ? "w-badge-warn" : "w-badge-success"}`}>
                                        {r.severity}
                                      </span>
                                    </td>
                                    <td>{r.mitigation}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p>No risks defined.</p>
                        )}
                      </div>
                    )}

                    {activeSection === "timeline" && (
                      <div className="animate-in fade-in duration-200">
                        <h2>Implementation Estimate</h2>
                        <p>{activeReportData.timeline_estimate || "No timeline estimate generated."}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* ── ROI Model ── */}
                {activeTab === "roi" && (
                  <div>
                    {activeSection === "overview" && (
                      <div className="animate-in fade-in duration-200">
                        <h2>Financial Feasibility Outline</h2>
                        <p>{activeReportData.overview || "Financial returns and cost assessment models."}</p>
                      </div>
                    )}

                    {activeSection === "breakdown" && (
                      <div className="animate-in fade-in duration-200">
                        <h2>Cost Breakdowns &amp; Runway</h2>
                        {activeReportData.cost_breakdown ? (
                          <div className="r-table-wrap">
                            <table className="r-table">
                              <thead>
                                <tr>
                                  <th>Category</th>
                                  <th>Value / Yr</th>
                                </tr>
                              </thead>
                              <tbody>
                                {Object.entries(activeReportData.cost_breakdown).map(([cat, val]: any) => (
                                  <tr key={cat}>
                                    <td style={{ fontWeight: 550, textTransform: "capitalize" }}>{cat}</td>
                                    <td style={{ fontFamily: "var(--r-font-mono)" }}>${val.toLocaleString()}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p>No cost breakdown calculated.</p>
                        )}
                      </div>
                    )}

                    {activeSection === "projections" && (
                      <div className="animate-in fade-in duration-200">
                        <h2>Visual Revenue &amp; Cost Projections</h2>
                        {/* Inline SVG Chart */}
                        <div className="r-svg-chart">
                          <svg viewBox="0 0 400 150" width="100%">
                            {/* Gridlines */}
                            <line x1="40" y1="20" x2="380" y2="20" stroke="var(--r-border)" strokeWidth="1" />
                            <line x1="40" y1="60" x2="380" y2="60" stroke="var(--r-border)" strokeWidth="1" />
                            <line x1="40" y1="100" x2="380" y2="100" stroke="var(--r-border)" strokeWidth="1" />
                            <line x1="40" y1="130" x2="380" y2="130" stroke="var(--r-border-strong)" strokeWidth="1.5" />
                            
                            {/* Bars */}
                            <rect x="70" y="80" width="24" height="50" rx="3" fill="var(--r-accent-muted)" />
                            <rect x="70" y="90" width="24" height="40" rx="3" fill="var(--r-accent)" />
                            
                            <rect x="150" y="60" width="24" height="70" rx="3" fill="var(--r-accent-muted)" />
                            <rect x="150" y="75" width="24" height="55" rx="3" fill="var(--r-accent)" />

                            <rect x="230" y="40" width="24" height="90" rx="3" fill="var(--r-accent-muted)" />
                            <rect x="230" y="55" width="24" height="75" rx="3" fill="var(--r-accent)" />

                            <rect x="310" y="20" width="24" height="110" rx="3" fill="var(--r-accent-muted)" />
                            <rect x="310" y="30" width="24" height="100" rx="3" fill="var(--r-accent)" />
                            
                            {/* Text labels */}
                            <text x="82" y="145" fill="var(--r-subtle)" fontSize="8" textAnchor="middle" fontFamily="var(--r-font-mono)">Yr 1</text>
                            <text x="162" y="145" fill="var(--r-subtle)" fontSize="8" textAnchor="middle" fontFamily="var(--r-font-mono)">Yr 2</text>
                            <text x="242" y="145" fill="var(--r-subtle)" fontSize="8" textAnchor="middle" fontFamily="var(--r-font-mono)">Yr 3</text>
                            <text x="322" y="145" fill="var(--r-subtle)" fontSize="8" textAnchor="middle" fontFamily="var(--r-font-mono)">Yr 4</text>
                          </svg>
                          <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 11, color: "var(--r-subtle)", justifyContent: "center" }}>
                            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <span style={{ width: 8, height: 8, background: "var(--r-accent-muted)", borderRadius: 2 }} />
                              Gross Cost
                            </span>
                            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <span style={{ width: 8, height: 8, background: "var(--r-accent)", borderRadius: 2 }} />
                              Net Revenue
                            </span>
                          </div>
                        </div>

                        {activeReportData.roi_projections ? (
                          <div className="r-table-wrap">
                            <table className="r-table">
                              <thead>
                                <tr>
                                  <th>Year</th>
                                  <th>Revenue Target</th>
                                  <th>NPV</th>
                                </tr>
                              </thead>
                              <tbody>
                                {Object.entries(activeReportData.roi_projections).map(([yr, val]: any) => (
                                  <tr key={yr}>
                                    <td style={{ fontWeight: 550, textTransform: "capitalize" }}>{yr.replace("_", " ")}</td>
                                    <td style={{ color: "var(--r-success)", fontFamily: "var(--r-font-mono)" }}>${val.toLocaleString()}</td>
                                    <td style={{ fontFamily: "var(--r-font-mono)" }}>${(val * 0.9).toLocaleString()}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p>No projections calculated.</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Roadmap Viewer ── */}
                {activeTab === "roadmap" && (
                  <div>
                    {activeSection === "overview" && (
                      <div className="animate-in fade-in duration-200">
                        <h2>Roadmap Outline</h2>
                        <p>{activeReportData.overview || "Implementation deliverables organized in chronological build sequences."}</p>
                      </div>
                    )}

                    {activeSection === "phases" && (
                      <div className="animate-in fade-in duration-200">
                        <h2>Development Phases</h2>
                        {activeReportData.phases?.length > 0 ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            {activeReportData.phases.map((ph: any, i: number) => (
                              <div key={i} style={{ border: "1px solid var(--r-border)", borderRadius: "var(--r-radius-md)", padding: 16 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                  <h3 style={{ margin: 0 }}>Phase {i + 1}: {ph.name}</h3>
                                  <span className="w-badge w-badge-accent">{ph.duration}</span>
                                </div>
                                {ph.tasks?.length > 0 && (
                                  <ul style={{ paddingLeft: 20, fontSize: 13, color: "var(--r-muted)" }}>
                                    {ph.tasks.map((t: string, idx: number) => <li key={idx}>{t}</li>)}
                                  </ul>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p>No phase breakdown generated.</p>
                        )}
                      </div>
                    )}

                    {activeSection === "milestones" && (
                      <div className="animate-in fade-in duration-200">
                        <h2>Project Milestones</h2>
                        {activeReportData.milestones?.length > 0 ? (
                          <div className="r-table-wrap">
                            <table className="r-table">
                              <thead>
                                <tr>
                                  <th>Milestone Key Event</th>
                                  <th>Completion Phase</th>
                                </tr>
                              </thead>
                              <tbody>
                                {activeReportData.milestones.map((m: string, i: number) => (
                                  <tr key={i}>
                                    <td style={{ fontWeight: 550 }}>{m}</td>
                                    <td style={{ color: "var(--r-accent)" }}>Phase {Math.min(i + 1, 3)} complete</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p>No milestones registered.</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* AI Regenerate Section */}
              <div className="r-ai-panel">
                <div className="r-ai-panel-header">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: regenerating ? "spin 0.8s linear infinite" : "none" }}>
                    <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
                  </svg>
                  <span>Instruct AI to refine this report section</span>
                </div>
                <div className="r-ai-panel-input">
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="e.g. Add details on cross-border payments inside Section 2, or shift stack selection to AWS Serverless..."
                    disabled={regenerating}
                  />
                  <button
                    type="button"
                    className="r-ai-btn"
                    onClick={handleRegenerate}
                    disabled={regenerating || !aiPrompt.trim()}
                  >
                    {regenerating ? "Regenerating..." : "Refine Section"}
                  </button>
                </div>
              </div>
            </article>
          )}
        </div>
      </main>

      {/* Right Sidebar: Version History & Comments */}
      <aside className="r-right-panel">
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
              {versions.map((v) => (
                <div
                  key={v.version}
                  className={`r-version-item ${v.active ? "active" : ""}`}
                  onClick={() => {
                    const next = versions.map((ver) => ({ ...ver, active: ver.version === v.version }));
                    setVersions(next);
                  }}
                >
                  <div className="r-version-num">{v.version}</div>
                  <div className="r-version-meta">
                    <span>{v.author}</span>
                    <span>{v.date}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
