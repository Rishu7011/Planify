"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { reportTabLabel } from "@/lib/reports";

export type DashboardAsset = {
  asset_id: string;
  kind?: string;
  report_type: string;
  title?: string;
  project_id: string;
  project_title: string;
  version?: number;
  updated_at?: string | null;
  created_at?: string | null;
};

type AssetsViewProps = {
  assets: DashboardAsset[];
  loading: boolean;
  onRefresh: () => void;
  onCreateProject: () => void;
};

type TypeFilter = "all" | string;
type LayoutMode = "grid" | "list";

function timeAgo(iso?: string | null): string {
  if (!iso) return "Recently";
  try {
    const diffMs = Date.now() - new Date(iso).getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHrs = Math.floor(diffMin / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 30) return `${diffDays}d ago`;
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "Recently";
  }
}

function normalizeType(raw: string): string {
  return (raw || "").toLowerCase().replace(/\s+/g, "_");
}

function assetIcon(reportType: string): string {
  const t = normalizeType(reportType);
  if (t.includes("prd") || t.includes("requirement")) return "description";
  if (t.includes("architecture") || t.includes("tech")) return "account_tree";
  if (t.includes("market")) return "monitoring";
  if (t.includes("competitor")) return "visibility";
  if (t.includes("roi") || t.includes("budget") || t.includes("financial")) return "payments";
  if (t.includes("hr") || t.includes("hiring")) return "groups";
  if (t.includes("risk")) return "shield";
  if (t.includes("roadmap")) return "timeline";
  if (t.includes("final")) return "article";
  return "inventory_2";
}

function assetAccent(reportType: string): string {
  const t = normalizeType(reportType);
  if (t.includes("prd")) return "#4F8DFF";
  if (t.includes("architecture")) return "#8E6BFF";
  if (t.includes("market")) return "#34D399";
  if (t.includes("competitor")) return "#F59E0B";
  if (t.includes("roi") || t.includes("budget")) return "#22D3EE";
  if (t.includes("hr")) return "#F472B6";
  if (t.includes("risk")) return "#FB7185";
  if (t.includes("roadmap")) return "#A3E635";
  return "#aec6ff";
}

function prettyLabel(reportType: string): string {
  const key = normalizeType(reportType);
  try {
    return reportTabLabel(key);
  } catch {
    return reportType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

export function AssetsView({
  assets,
  loading,
  onRefresh,
  onCreateProject,
}: AssetsViewProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [layout, setLayout] = useState<LayoutMode>("grid");

  const typeOptions = useMemo(() => {
    const set = new Set<string>();
    for (const a of assets) {
      if (a.report_type) set.add(normalizeType(a.report_type));
    }
    return Array.from(set).sort();
  }, [assets]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return assets.filter((a) => {
      if (typeFilter !== "all" && normalizeType(a.report_type) !== typeFilter) {
        return false;
      }
      if (!q) return true;
      const hay = `${a.title || ""} ${a.project_title} ${a.report_type}`.toLowerCase();
      return hay.includes(q);
    });
  }, [assets, search, typeFilter]);

  const byProject = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of assets) {
      map.set(a.project_id, (map.get(a.project_id) || 0) + 1);
    }
    return map.size;
  }, [assets]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#aec6ff]">
            Library
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#F7F8FC]">
            Assets
          </h1>
          <p className="text-sm text-[#7C869A] leading-relaxed">
            Every report your AI team has generated — PRDs, architecture, market
            research, roadmaps, and more — in one place.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0 w-full sm:w-auto">
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl border border-white/10 text-sm font-semibold text-[#B4BCCB] hover:text-[#F7F8FC] hover:bg-white/5 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            Refresh
          </button>
          <button
            type="button"
            onClick={onCreateProject}
            className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-[#aec6ff] text-[#00275e] text-sm font-bold hover:brightness-110 active:scale-[0.98] transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            New project
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total assets", value: assets.length, icon: "inventory_2", accent: "#4F8DFF" },
          { label: "Projects", value: byProject, icon: "folder_copy", accent: "#8E6BFF" },
          { label: "Types", value: typeOptions.length, icon: "category", accent: "#34D399" },
          { label: "Showing", value: filtered.length, icon: "filter_alt", accent: "#FBBF24" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-white/[0.08] bg-[#151A2B]/80 px-4 py-3.5 flex items-center gap-3"
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${stat.accent}18`, color: stat.accent }}
            >
              <span className="material-symbols-outlined text-[18px]">{stat.icon}</span>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#7C869A]">
                {stat.label}
              </p>
              <p className="text-xl font-bold text-[#F7F8FC] leading-none mt-0.5">
                {loading ? "—" : stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col xl:flex-row xl:items-center gap-3">
        <div className="flex-1 flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3.5 h-11 focus-within:border-[#aec6ff]/40 transition-colors">
          <span className="material-symbols-outlined text-[18px] text-[#7C869A]">search</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assets or projects…"
            aria-label="Search assets"
            className="bg-transparent border-none outline-none text-sm text-[#F7F8FC] placeholder:text-[#7C869A] w-full"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setTypeFilter("all")}
            className={`h-9 px-3.5 rounded-lg text-xs font-bold uppercase tracking-wide border transition-all ${
              typeFilter === "all"
                ? "bg-[#aec6ff]/15 text-[#aec6ff] border-[#aec6ff]/30"
                : "text-[#7C869A] border-white/10 hover:text-[#F7F8FC] hover:bg-white/5"
            }`}
          >
            All
          </button>
          {typeOptions.slice(0, 6).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTypeFilter(t)}
              className={`h-9 px-3 rounded-lg text-xs font-bold uppercase tracking-wide border transition-all ${
                typeFilter === t
                  ? "bg-[#aec6ff]/15 text-[#aec6ff] border-[#aec6ff]/30"
                  : "text-[#7C869A] border-white/10 hover:text-[#F7F8FC] hover:bg-white/5"
              }`}
            >
              {prettyLabel(t)}
            </button>
          ))}

          <div className="h-9 rounded-lg border border-white/10 bg-white/[0.03] p-0.5 flex ml-auto">
            {(
              [
                { id: "grid", icon: "grid_view" },
                { id: "list", icon: "view_agenda" },
              ] as const
            ).map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => setLayout(mode.id)}
                aria-pressed={layout === mode.id}
                className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors ${
                  layout === mode.id
                    ? "bg-[#aec6ff]/20 text-[#aec6ff]"
                    : "text-[#7C869A] hover:text-[#F7F8FC]"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{mode.icon}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div
          className={
            layout === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
              : "space-y-3"
          }
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={`rounded-2xl border border-white/5 bg-white/5 animate-pulse ${
                layout === "grid" ? "h-44" : "h-20"
              }`}
            />
          ))}
        </div>
      ) : assets.length === 0 ? (
        <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#151A2B] px-8 py-16 text-center">
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_rgba(142,107,255,0.12),_transparent_55%)]" />
          <div className="relative mx-auto max-w-md flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-[#8E6BFF]/10 border border-[#8E6BFF]/20 flex items-center justify-center mb-5">
              <span className="material-symbols-outlined text-[#8E6BFF] text-3xl">
                inventory_2
              </span>
            </div>
            <h2 className="text-xl font-bold text-[#F7F8FC] mb-2">No assets yet</h2>
            <p className="text-sm text-[#7C869A] mb-8 leading-relaxed">
              Open a project workspace and generate a PRD, architecture doc, or roadmap —
              it will show up here automatically.
            </p>
            <button
              type="button"
              onClick={onCreateProject}
              className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-[#aec6ff] text-[#00275e] text-sm font-bold hover:brightness-110 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Start a project
            </button>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.08] bg-[#151A2B] px-8 py-12 text-center">
          <h3 className="font-bold text-base mb-1">No matches</h3>
          <p className="text-xs text-[#7C869A] mb-5">Try another type or clear search.</p>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setTypeFilter("all");
            }}
            className="text-sm font-semibold text-[#aec6ff] hover:underline underline-offset-4"
          >
            Reset filters
          </button>
        </div>
      ) : layout === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((asset) => {
            const accent = assetAccent(asset.report_type);
            const label = prettyLabel(asset.report_type);
            return (
              <article
                key={asset.asset_id}
                className="group flex flex-col rounded-2xl border border-white/[0.08] bg-[#151A2B] p-5 hover:border-white/20 transition-all"
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border"
                    style={{
                      backgroundColor: `${accent}14`,
                      borderColor: `${accent}33`,
                      color: accent,
                    }}
                  >
                    <span className="material-symbols-outlined text-xl">
                      {assetIcon(asset.report_type)}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#7C869A]">
                    v{asset.version ?? 1}
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#F7F8FC] mb-1">{label}</h3>
                <p className="text-xs text-[#7C869A] truncate mb-1">{asset.project_title}</p>
                <p className="text-[11px] text-[#7C869A]/80 mb-5">
                  Updated {timeAgo(asset.updated_at)}
                </p>
                <div className="mt-auto pt-4 border-t border-white/5 flex items-center gap-2">
                  <Link
                    href={`/projects/${asset.project_id}/reports`}
                    className="flex-1 h-9 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    style={{
                      backgroundColor: `${accent}18`,
                      color: accent,
                    }}
                  >
                    Open asset
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </Link>
                  <Link
                    href={`/projects/${asset.project_id}/chat`}
                    aria-label={`Chat for ${asset.project_title}`}
                    className="w-9 h-9 rounded-lg border border-white/10 text-[#7C869A] hover:text-[#F7F8FC] hover:bg-white/5 flex items-center justify-center transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">chat</span>
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.08] bg-[#151A2B]/60 divide-y divide-white/[0.05] overflow-hidden">
          {filtered.map((asset) => {
            const accent = assetAccent(asset.report_type);
            const label = prettyLabel(asset.report_type);
            return (
              <div
                key={asset.asset_id}
                className="flex flex-col sm:flex-row sm:items-center gap-4 px-5 py-4 hover:bg-white/[0.03] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
                    style={{
                      backgroundColor: `${accent}14`,
                      borderColor: `${accent}33`,
                      color: accent,
                    }}
                  >
                    <span className="material-symbols-outlined">
                      {assetIcon(asset.report_type)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-[#F7F8FC] truncate">{label}</h3>
                    <p className="text-xs text-[#7C869A] truncate">
                      {asset.project_title} · v{asset.version ?? 1} ·{" "}
                      {timeAgo(asset.updated_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/projects/${asset.project_id}/reports`}
                    className="h-9 px-3.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                    style={{ backgroundColor: `${accent}18`, color: accent }}
                  >
                    Open
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </Link>
                  <Link
                    href={`/projects/${asset.project_id}/chat`}
                    className="h-9 px-3 rounded-lg border border-white/10 text-xs font-semibold text-[#B4BCCB] hover:text-[#F7F8FC] hover:bg-white/5 transition-colors"
                  >
                    Chat
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
