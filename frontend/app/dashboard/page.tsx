"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ProjectCard } from "@/components/ProjectCard";
import { apiFetch } from "@/lib/api";

interface Project {
  id: string;
  title: string;
  description: string;
  status: string;
  updated_at: string;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const accessToken = (session?.user as any)?.accessToken;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session && accessToken) {
      fetchProjects();
    }
  }, [session, accessToken]);

  const fetchProjects = async () => {
    try {
      const data = await apiFetch<Project[]>("/api/projects", { accessToken });
      setProjects(data);
    } catch (err: any) {
      console.error("Failed to fetch projects:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setCreating(true);
    setError("");

    try {
      const res = await apiFetch<{ project_id: string; chat_session_id: string }>(
        "/api/projects",
        {
          method: "POST",
          accessToken,
          body: JSON.stringify({ title: title.trim(), description: description.trim() }),
        }
      );
      router.push(`/projects/${res.project_id}/chat`);
    } catch (err: any) {
      setError(err.detail || "Failed to create project. Please try again.");
      setCreating(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
          <p className="text-slate-400 text-sm">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo mark */}
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <span className="font-bold text-lg tracking-tight">Planify</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">{session?.user?.email}</span>
            <button
              id="sign-out-btn"
              onClick={() => import("next-auth/react").then(m => m.signOut())}
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Page header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Your Projects
            </h1>
            <p className="mt-2 text-slate-400">
              Describe an idea — get a PRD, feasibility study, ROI model, and roadmap.
            </p>
          </div>
          <button
            id="new-project-btn"
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-[0.98]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Project
          </button>
        </div>

        {/* Projects grid */}
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/20 flex items-center justify-center mb-6">
              <svg className="h-10 w-10 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">No projects yet</h2>
            <p className="text-slate-400 mb-8 max-w-sm">
              Create your first project and let AI generate your complete planning bundle.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-violet-500/40"
            >
              Create your first project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </main>

      {/* Create Project Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900/95 p-8 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="text-2xl font-bold text-white mb-2">New Project</h2>
            <p className="text-slate-400 text-sm mb-6">
              Give it a name — you'll describe the full idea in the chat.
            </p>

            <form onSubmit={handleCreate} className="space-y-5">
              <div>
                <label htmlFor="project-title" className="block text-sm font-medium text-slate-300 mb-2">
                  Project Title *
                </label>
                <input
                  id="project-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Healthcare Admin Automation"
                  maxLength={200}
                  className="w-full rounded-xl border border-white/10 bg-slate-800/60 px-4 py-3 text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label htmlFor="project-desc" className="block text-sm font-medium text-slate-300 mb-2">
                  Description <span className="text-slate-500">(optional)</span>
                </label>
                <textarea
                  id="project-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief context..."
                  maxLength={500}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-white/10 bg-slate-800/60 px-4 py-3 text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-colors"
                />
              </div>

              {error && (
                <p className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
                  {error}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-xl border border-white/10 py-3 text-sm font-medium text-slate-300 hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="create-project-submit"
                  type="submit"
                  disabled={creating || !title.trim()}
                  className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg hover:shadow-violet-500/30"
                >
                  {creating ? "Creating..." : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
