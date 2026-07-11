"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { PRDViewer } from "@/components/reports/PRDViewer";
import { FeasibilityViewer } from "@/components/reports/FeasibilityViewer";
import { ROIViewer } from "@/components/reports/ROIViewer";
import { RoadmapViewer } from "@/components/reports/RoadmapViewer";

const TABS = [
  { key: "prd", label: "PRD", icon: "📋" },
  { key: "feasibility", label: "Feasibility", icon: "⚙️" },
  { key: "roi", label: "ROI", icon: "💰" },
  { key: "roadmap", label: "Roadmap", icon: "🗺️" },
] as const;

type TabKey = typeof TABS[number]["key"];

export default function ReportsPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { data: session } = useSession();
  const [reports, setReports] = useState<Record<string, any>>({});
  const [activeTab, setActiveTab] = useState<TabKey>("prd");
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<{ title: string } | null>(null);
  const [exporting, setExporting] = useState<"pdf" | "docx" | null>(null);

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
        // Extract content from each report
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

  const reportsGenerated = Object.values(reports).some((r) => r !== null);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f]">
        <div className="h-10 w-10 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/projects/${projectId}/chat`}
              className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Chat
            </Link>
            <span className="text-slate-600">/</span>
            <span className="font-semibold text-white truncate max-w-xs">
              {project?.title || "Reports"}
            </span>
          </div>

          {/* Export buttons */}
          {reportsGenerated && (
            <div className="flex items-center gap-3">
              <button
                id="export-docx-btn"
                onClick={() => handleExport("docx")}
                disabled={exporting !== null}
                className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-white/5 transition-colors disabled:opacity-50"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {exporting === "docx" ? "Exporting..." : "Download DOCX"}
              </button>
              <button
                id="export-pdf-btn"
                onClick={() => handleExport("pdf")}
                disabled={exporting !== null}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-violet-500/40 disabled:opacity-50"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                {exporting === "pdf" ? "Exporting..." : "Download PDF"}
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold text-white mb-2">Planning Reports</h1>
        <p className="text-slate-400 mb-8">AI-generated reports for {project?.title}</p>

        {!reportsGenerated ? (
          <div className="flex flex-col items-center py-24 text-center">
            <div className="h-16 w-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-5">
              <svg className="h-8 w-8 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">No reports yet</h2>
            <p className="text-slate-400 mb-6 max-w-sm text-sm">
              Start chatting about your project idea to generate your reports.
            </p>
            <Link
              href={`/projects/${projectId}/chat`}
              className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white"
            >
              Go to Chat
            </Link>
          </div>
        ) : (
          <>
            {/* Tab navigation */}
            <div className="flex gap-1 rounded-xl bg-slate-900/60 border border-white/5 p-1 mb-8">
              {TABS.map((tab) => {
                const hasData = !!reports[tab.key];
                return (
                  <button
                    key={tab.key}
                    id={`tab-${tab.key}`}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                      activeTab === tab.key
                        ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/20"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <span>{tab.icon}</span>
                    {tab.label}
                    {!hasData && (
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-600" title="Not generated" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Tab content */}
            <div>
              {activeTab === "prd" && <PRDViewer data={reports.prd} />}
              {activeTab === "feasibility" && <FeasibilityViewer data={reports.feasibility} />}
              {activeTab === "roi" && <ROIViewer data={reports.roi} />}
              {activeTab === "roadmap" && <RoadmapViewer data={reports.roadmap} />}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
