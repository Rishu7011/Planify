/** Report types returned by the FastAPI backend (`/api/projects/{id}/reports`). */

export const REPORT_TABS = [
  { key: "prd", label: "PRD", icon: "📋" },
  { key: "technical_architecture", label: "Technical Architecture", icon: "🏗️" },
  { key: "market_research", label: "Market Research", icon: "📈" },
  { key: "competitor_analysis", label: "Competitor Analysis", icon: "🎯" },
  { key: "roi", label: "Financial ROI", icon: "📊" },
  { key: "hr_planning", label: "HR Planning", icon: "👥" },
  { key: "risk_analysis", label: "Risk Analysis", icon: "⚠️" },
  { key: "roadmap", label: "Execution Roadmap", icon: "🗺️" },
  { key: "final_report", label: "Final Report", icon: "📑" },
] as const;

export type ReportType = (typeof REPORT_TABS)[number]["key"];

export interface ReportContent {
  format?: string;
  markdown?: string;
  overview?: { title?: string; content?: string } | string;
  [key: string]: unknown;
}

export interface ReportRecord {
  report_id?: string;
  type?: string;
  version?: number;
  content?: ReportContent | null;
  updated_at?: string | null;
}

export function reportTabLabel(key: string): string {
  const tab = REPORT_TABS.find((t) => t.key === key);
  return tab?.label ?? key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Primary markdown body for a report snapshot from the API. */
export function reportMarkdownBody(content: ReportContent | null | undefined): string {
  if (!content) return "";
  if (typeof content.markdown === "string" && content.markdown.trim()) {
    return content.markdown;
  }
  if (content.overview) {
    if (typeof content.overview === "string") return content.overview;
    if (content.overview.content) return content.overview.content;
  }
  return "";
}

export function hasReportContent(content: ReportContent | null | undefined): boolean {
  return reportMarkdownBody(content).trim().length > 0;
}
