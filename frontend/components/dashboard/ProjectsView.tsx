"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type DashboardProject = {
  id: string;
  title: string;
  description?: string;
  status?: string;
  updated_at?: string;
  created_at?: string;
};

type ProjectsViewProps = {
  projects: DashboardProject[];
  loading: boolean;
  deletingId: string | null;
  onCreate: () => void;
  onDelete: (projectId: string, e: React.MouseEvent) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
};

type StatusFilter = "all" | "active" | "draft" | "archived";
type SortKey = "updated" | "title" | "created";
type LayoutMode = "grid" | "list";

function timeAgo(iso?: string): string {
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
      year: "numeric",
    });
  } catch {
    return "Recently";
  }
}

function statusMeta(status?: string) {
  const s = (status || "active").toLowerCase();
  if (s === "active") {
    return {
      label: "Active",
      chip: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      dot: "bg-emerald-400",
    };
  }
  if (s === "draft" || s === "pending") {
    return {
      label: "Draft",
      chip: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      dot: "bg-amber-400",
    };
  }
  return {
    label: status || "Active",
    chip: "bg-white/5 text-[#B4BCCB] border-white/10",
    dot: "bg-[#7C869A]",
  };
}

function matchesStatus(project: DashboardProject, filter: StatusFilter) {
  if (filter === "all") return true;
  const s = (project.status || "active").toLowerCase();
  if (filter === "active") return s === "active" || (!project.status && filter === "active");
  if (filter === "draft") return s === "draft" || s === "pending";
  if (filter === "archived") return s === "archived" || s === "deleted";
  return true;
}

export function ProjectsView({
  projects,
  loading,
  deletingId,
  onCreate,
  onDelete,
  searchQuery,
  onSearchChange,
}: ProjectsViewProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("updated");
  const [layout, setLayout] = useState<LayoutMode>("grid");

  const counts = useMemo(() => {
    const all = projects.length;
    const active = projects.filter((p) => (p.status || "active").toLowerCase() === "active").length;
    const draft = projects.filter((p) =>
      ["draft", "pending"].includes((p.status || "").toLowerCase()),
    ).length;
    return { all, active, draft };
  }, [projects]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = projects.filter((p) => matchesStatus(p, statusFilter));
    if (q) {
      list = list.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          (p.description || "").toLowerCase().includes(q),
      );
    }
    list = [...list].sort((a, b) => {
      if (sortKey === "title") {
        return (a.title || "").localeCompare(b.title || "");
      }
      if (sortKey === "created") {
        return (
          new Date(b.created_at || b.updated_at || 0).getTime() -
          new Date(a.created_at || a.updated_at || 0).getTime()
        );
      }
      return (
        new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime()
      );
    });
    return list;
  }, [projects, searchQuery, statusFilter, sortKey]);

  return (
    <div className="space-y-8">
      {/* Page intro */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#aec6ff]">
            Workspace
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#F7F8FC]">
            Projects
          </h1>
          <p className="text-sm text-[#7C869A] leading-relaxed">
            Browse every plan you&apos;re building. Open a workspace, jump to reports, or
            start something new — your AI team stays attached to each project.
          </p>
        </div>
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-[#aec6ff] text-[#00275e] text-sm font-bold hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_0_24px_rgba(174,198,255,0.18)] shrink-0"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          New project
        </button>
      </div>

      {/* Insight chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: counts.all, icon: "folder_copy", accent: "#4F8DFF" },
          { label: "Active", value: counts.active, icon: "bolt", accent: "#34D399" },
          { label: "Drafts", value: counts.draft, icon: "edit_note", accent: "#FBBF24" },
          {
            label: "Showing",
            value: filtered.length,
            icon: "filter_list",
            accent: "#8E6BFF",
          },
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

      {/* Toolbar */}
      <div className="flex flex-col xl:flex-row xl:items-center gap-3 xl:gap-4">
        <div className="flex-1 flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3.5 h-11 focus-within:border-[#aec6ff]/40 transition-colors">
          <span className="material-symbols-outlined text-[18px] text-[#7C869A]">search</span>
          <input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name or description…"
            aria-label="Search projects"
            className="bg-transparent border-none outline-none text-sm text-[#F7F8FC] placeholder:text-[#7C869A] w-full"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              aria-label="Clear search"
              className="text-[#7C869A] hover:text-[#F7F8FC] transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { id: "all", label: "All" },
              { id: "active", label: "Active" },
              { id: "draft", label: "Drafts" },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setStatusFilter(f.id)}
              className={`h-9 px-3.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all border ${
                statusFilter === f.id
                  ? "bg-[#aec6ff]/15 text-[#aec6ff] border-[#aec6ff]/30"
                  : "bg-transparent text-[#7C869A] border-white/10 hover:text-[#F7F8FC] hover:bg-white/5"
              }`}
            >
              {f.label}
            </button>
          ))}

          <div className="h-9 px-2 rounded-lg border border-white/10 bg-white/[0.03] flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-[#7C869A] pl-1">
              sort
            </span>
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              aria-label="Sort projects"
              className="bg-transparent text-xs font-semibold text-[#B4BCCB] outline-none pr-1 cursor-pointer"
            >
              <option value="updated">Recently updated</option>
              <option value="created">Newest created</option>
              <option value="title">Name A–Z</option>
            </select>
          </div>

          <div className="h-9 rounded-lg border border-white/10 bg-white/[0.03] p-0.5 flex">
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
                aria-label={mode.id === "grid" ? "Grid view" : "List view"}
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

      {/* Body */}
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
                layout === "grid" ? "h-52" : "h-20"
              }`}
            />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#151A2B] px-8 py-16 text-center">
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_rgba(79,141,255,0.12),_transparent_55%)]" />
          <div className="relative mx-auto max-w-md flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-[#aec6ff]/10 border border-[#aec6ff]/20 flex items-center justify-center mb-5">
              <span className="material-symbols-outlined text-[#aec6ff] text-3xl">
                create_new_folder
              </span>
            </div>
            <h2 className="text-xl font-bold text-[#F7F8FC] mb-2">No projects yet</h2>
            <p className="text-sm text-[#7C869A] mb-8 leading-relaxed">
              Create your first project to generate PRDs, architecture, roadmaps, and ROI
              models with your AI team.
            </p>
            <button
              type="button"
              onClick={onCreate}
              className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-[#aec6ff] text-[#00275e] text-sm font-bold hover:brightness-110 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Create your first project
            </button>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.08] bg-[#151A2B] px-8 py-12 text-center">
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-[#7C869A] text-2xl">search_off</span>
          </div>
          <h3 className="font-bold text-base mb-1">No matches</h3>
          <p className="text-xs text-[#7C869A] mb-5">
            Nothing fits that search or filter. Try clearing filters.
          </p>
          <button
            type="button"
            onClick={() => {
              onSearchChange("");
              setStatusFilter("all");
            }}
            className="text-sm font-semibold text-[#aec6ff] hover:underline underline-offset-4"
          >
            Reset filters
          </button>
        </div>
      ) : layout === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((project) => {
            const meta = statusMeta(project.status);
            return (
              <article
                key={project.id}
                className="group relative flex flex-col rounded-2xl border border-white/[0.08] bg-[#151A2B] p-5 hover:border-white/20 transition-all"
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#aec6ff]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <span className="material-symbols-outlined text-blue-400 text-xl">
                        folder
                      </span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-[#F7F8FC] truncate">
                        {project.title}
                      </h3>
                      <p className="text-[11px] text-[#7C869A] font-medium mt-0.5">
                        Updated {timeAgo(project.updated_at)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${meta.chip}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                    {meta.label}
                  </span>
                </div>

                <p className="text-sm text-[#7C869A] line-clamp-2 leading-relaxed mb-5 min-h-[2.5rem]">
                  {project.description?.trim() || "No description yet — open the workspace to refine the brief."}
                </p>

                <div className="mt-auto pt-4 border-t border-white/5 flex items-center gap-2">
                  <Link
                    href={`/projects/${project.id}/chat`}
                    className="flex-1 h-9 rounded-lg bg-[#aec6ff]/10 hover:bg-[#aec6ff]/20 text-[#aec6ff] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    Open chat
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </Link>
                  <Link
                    href={`/projects/${project.id}/reports`}
                    aria-label={`Reports for ${project.title}`}
                    className="w-9 h-9 rounded-lg border border-white/10 text-[#7C869A] hover:text-[#F7F8FC] hover:bg-white/5 flex items-center justify-center transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">description</span>
                  </Link>
                  <button
                    type="button"
                    onClick={(e) => onDelete(project.id, e)}
                    disabled={deletingId === project.id}
                    aria-label={`Archive ${project.title}`}
                    title="Archive project"
                    className="w-9 h-9 rounded-lg border border-white/10 text-[#7C869A] hover:text-rose-400 hover:bg-rose-500/10 flex items-center justify-center transition-colors disabled:opacity-50"
                  >
                    {deletingId === project.id ? (
                      <span className="h-3.5 w-3.5 border border-rose-400/30 border-t-rose-400 rounded-full animate-spin" />
                    ) : (
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    )}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.08] bg-[#151A2B]/60 divide-y divide-white/[0.05] overflow-hidden">
          {filtered.map((project) => {
            const meta = statusMeta(project.status);
            return (
              <div
                key={project.id}
                className="flex flex-col sm:flex-row sm:items-center gap-4 px-5 py-4 hover:bg-white/[0.03] transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-blue-400">folder</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-[#F7F8FC] truncate">
                        {project.title}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${meta.chip}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                        {meta.label}
                      </span>
                    </div>
                    <p className="text-xs text-[#7C869A] truncate mt-0.5">
                      {project.description?.trim() || "No description"} · Updated{" "}
                      {timeAgo(project.updated_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:shrink-0">
                  <Link
                    href={`/projects/${project.id}/chat`}
                    className="h-9 px-3.5 rounded-lg bg-[#aec6ff]/10 hover:bg-[#aec6ff]/20 text-[#aec6ff] text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    Open
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </Link>
                  <Link
                    href={`/projects/${project.id}/reports`}
                    className="h-9 px-3 rounded-lg border border-white/10 text-xs font-semibold text-[#B4BCCB] hover:text-[#F7F8FC] hover:bg-white/5 transition-colors"
                  >
                    Reports
                  </Link>
                  <button
                    type="button"
                    onClick={(e) => onDelete(project.id, e)}
                    disabled={deletingId === project.id}
                    aria-label={`Archive ${project.title}`}
                    className="w-9 h-9 rounded-lg border border-white/10 text-[#7C869A] hover:text-rose-400 hover:bg-rose-500/10 flex items-center justify-center transition-colors"
                  >
                    {deletingId === project.id ? (
                      <span className="h-3.5 w-3.5 border border-rose-400/30 border-t-rose-400 rounded-full animate-spin" />
                    ) : (
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
