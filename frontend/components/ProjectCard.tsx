"use client";

import Link from "next/link";

interface Project {
  id: string;
  title: string;
  description: string;
  status: string;
  updated_at: string;
}

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const updatedDate = new Date(project.updated_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const statusColor =
    project.status === "active"
      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
      : "bg-slate-500/20 text-slate-400 border-slate-500/30";

  return (
    <Link href={`/projects/${project.id}/chat`} className="group block">
      <div className="relative h-full rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-800/60 p-6 backdrop-blur-sm transition-all duration-300 hover:border-violet-500/50 hover:shadow-[0_0_30px_rgba(139,92,246,0.15)] hover:-translate-y-0.5">
        {/* Glow on hover */}
        <div className="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-gradient-to-br from-violet-600/5 to-indigo-600/5 pointer-events-none" />

        <div className="relative flex flex-col gap-3">
          {/* Status badge */}
          <span
            className={`inline-flex w-fit items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusColor}`}
          >
            {project.status}
          </span>

          {/* Title */}
          <h3 className="text-lg font-semibold text-white leading-tight group-hover:text-violet-300 transition-colors line-clamp-2">
            {project.title}
          </h3>

          {/* Description */}
          {project.description && (
            <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">
              {project.description}
            </p>
          )}

          {/* Footer */}
          <div className="mt-auto pt-3 border-t border-white/5 flex items-center justify-between">
            <span className="text-xs text-slate-500">Updated {updatedDate}</span>
            <svg
              className="h-4 w-4 text-slate-500 group-hover:text-violet-400 transition-colors group-hover:translate-x-0.5 transform duration-200"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}
