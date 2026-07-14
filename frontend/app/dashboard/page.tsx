"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { apiFetch, formatApiError, isApiError } from "@/lib/api";
import { AssetsView, type DashboardAsset } from "@/components/dashboard/AssetsView";
import { ProjectsView } from "@/components/dashboard/ProjectsView";
import { SettingsView } from "@/components/dashboard/SettingsView";
import { ROUTES } from "@/lib/routes";

type NavView = "dashboard" | "projects" | "assets" | "settings";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeNav, setActiveNav] = useState<NavView>("dashboard");

  // API States
  const [projects, setProjects] = useState<any[]>([]);
  const [assets, setAssets] = useState<DashboardAsset[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [runs, setRuns] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // New Project Form States
  const [modalOpen, setModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [modalError, setModalError] = useState("");

  // GSAP Refs
  const sidebarRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const welcomeRef = useRef<HTMLElement>(null);
  const commandCenterRef = useRef<HTMLDivElement>(null);
  const projectCardsRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);

  const accessToken = session?.user?.accessToken;

  // ── Redirect Unauthenticated Users (Fallback) ─────────────────────────────
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login?callbackUrl=%2Fdashboard");
    }
  }, [status, router]);

  // ── Fetch Dashboard Data ───────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (status !== "authenticated") return;
    if (!accessToken) {
      setLoadingData(false);
      setApiError(
        "Missing backend access token. Set NEXTAUTH_SECRET to match backend JWT_SECRET, then sign in again."
      );
      return;
    }
    setLoadingData(true);
    setApiError(null);
    try {
      const [projectsData, statsData, runsData, assetsData] = await Promise.all([
        apiFetch<any[]>("/api/projects", { accessToken }),
        apiFetch<any>("/api/dashboard/stats", { accessToken }),
        apiFetch<any[]>("/api/dashboard/runs", { accessToken }),
        apiFetch<DashboardAsset[]>("/api/dashboard/assets", { accessToken }),
      ]);
      setProjects(projectsData || []);
      setStats(statsData || null);
      setRuns(runsData || []);
      setAssets(assetsData || []);
    } catch (err: unknown) {
      console.error("[Dashboard] Failed to fetch data:", err);
      if (isApiError(err) && err.status === 401) {
        setApiError(
          "Unauthorized — sign out and sign in again. NEXTAUTH_SECRET must match backend JWT_SECRET."
        );
      } else {
        setApiError(
          formatApiError(
            err,
            "Cannot reach the backend — make sure it is running on port 8000."
          )
        );
      }
    } finally {
      setLoadingData(false);
    }
  }, [status, accessToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── GSAP Layout Animations on Mount ───────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    let ctx: any = null;

    const init = async () => {
      const gsap = (await import("gsap")).default;
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      if (cancelled) return;

      ctx = gsap.context(() => {
        const mm = gsap.matchMedia();
        mm.add("(min-width: 1024px)", () => {
          if (sidebarRef.current) {
            gsap.from(sidebarRef.current, {
              x: -280,
              opacity: 0,
              duration: 0.7,
              ease: "power3.out",
              onComplete: () => gsap.set(sidebarRef.current, { clearProps: "transform" }),
            });
          }
        });

        // Header drop
        if (headerRef.current) {
          gsap.from(headerRef.current, {
            y: -60,
            opacity: 0,
            duration: 0.6,
            ease: "power2.out",
            delay: 0.2,
          });
        }

        // Welcome stagger
        if (welcomeRef.current) {
          gsap.from(welcomeRef.current.children, {
            y: 24,
            opacity: 0,
            duration: 0.6,
            stagger: 0.1,
            ease: "power2.out",
            delay: 0.4,
          });
        }

        // Right panel
        if (rightPanelRef.current) {
          gsap.from(rightPanelRef.current, {
            x: 40,
            opacity: 0,
            duration: 0.7,
            ease: "power2.out",
            delay: 0.65,
          });
        }
      });
    };

    init();
    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, []);

  // ── GSAP Dynamic Data Animations ───────────────────────────────────────────
  useEffect(() => {
    if (loadingData) return;

    let ctx: any = null;

    const initAnims = async () => {
      const gsap = (await import("gsap")).default;
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      ctx = gsap.context(() => {
        // AI Activity Monitor / Command Center fade-in
        if (commandCenterRef.current) {
          gsap.fromTo(
            commandCenterRef.current,
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" }
          );

          // Animate progress bars if present
          commandCenterRef.current
            .querySelectorAll<HTMLElement>("[data-progress]")
            .forEach((bar) => {
              const target = bar.dataset.progress ?? "0";
              gsap.fromTo(
                bar,
                { width: "0%" },
                { width: `${target}%`, duration: 1.4, ease: "power2.out", delay: 0.4 }
              );
            });
        }

        // Project cards stagger
        if (projectCardsRef.current) {
          const cards = projectCardsRef.current.querySelectorAll<HTMLElement>(".proj-card");
          if (cards.length > 0) {
            gsap.from(cards, {
              y: 32,
              opacity: 0,
              duration: 0.55,
              stagger: 0.14,
              ease: "power2.out",
            });
          }
        }
      });
    };

    initAnims();
    return () => ctx?.revert();
  }, [loadingData]);

  // ── Handle Project Creation ───────────────────────────────────────────────
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !accessToken) return;

    setCreating(true);
    setModalError("");

    try {
      const res = await apiFetch<{ project_id: string; chat_session_id: string }>(
        "/api/projects",
        {
          method: "POST",
          body: JSON.stringify({
            title: newTitle.trim(),
            description: newDescription.trim(),
          }),
          accessToken,
        }
      );

      if (res.project_id) {
        // Redirect directly to the project chat interface
        router.push(`/projects/${res.project_id}/chat`);
      } else {
        setModalError("Failed to resolve project identifier.");
      }
    } catch (err: unknown) {
      console.error("[Dashboard] Project creation error:", err);
      setModalError(
        formatApiError(err, "An unexpected error occurred while creating the project.")
      );
    } finally {
      setCreating(false);
    }
  };

  // ── Handle Project Deletion ───────────────────────────────────────────────
  const handleDeleteProject = async (projectId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!accessToken || deletingId) return;
    setDeletingId(projectId);
    try {
      await apiFetch(`/api/projects/${projectId}`, {
        method: "DELETE",
        accessToken,
      });
      // Optimistic update — remove from local state
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    } catch (err: unknown) {
      console.error("[Dashboard] Delete error:", err);
      setApiError(formatApiError(err, "Could not delete project."));
    } finally {
      setDeletingId(null);
    }
  };

  // ── Helper: Initials calculation ──────────────────────────────────────────
  const getUserInitials = () => {
    const name = session?.user?.name;
    if (name) {
      const parts = name.split(" ");
      if (parts.length > 1) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    }
    const email = session?.user?.email;
    if (email) return email.slice(0, 2).toUpperCase();
    return "US";
  };

  const initials = getUserInitials();
  const sidebarWidth = sidebarCollapsed ? "72px" : "240px";
  const closeMobileSidebar = () => setSidebarOpen(false);

  const goToView = (view: NavView) => {
    setActiveNav(view);
    closeMobileSidebar();
  };

  const navItemClass = (active: boolean) =>
    `flex items-center gap-3 rounded-xl transition-colors text-sm ${
      active
        ? "bg-[oklch(0.75_0.12_190)]/10 text-[oklch(0.75_0.12_190)] font-medium"
        : "text-[#7C869A] hover:bg-white/5 hover:text-[#F7F8FC]"
    } ${sidebarCollapsed ? "justify-center py-2.5 px-0" : "px-4 py-2.5"}`;

  // Derived: filter projects client-side by search query
  const filteredProjects = searchQuery.trim()
    ? projects.filter(
        (p) =>
          p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.description || "").toLowerCase().includes(searchQuery.toLowerCase())
      )
    : projects;

  // ── Session Loading View ───────────────────────────────────────────────────
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#111315] flex flex-col items-center justify-center relative overflow-hidden">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=block');
          .material-symbols-outlined { font-variation-settings: 'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24; }
        `}</style>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full blur-[80px]"
          style={{ background: "oklch(0.55 0.09 195 / 0.1)" }} />
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg animate-pulse mb-4 z-10"
          style={{ background: "linear-gradient(135deg, oklch(0.55 0.09 195), oklch(0.75 0.12 190))" }}
        >
          <span className="material-symbols-outlined text-[#0d1210] text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
        </div>
        <p className="text-sm font-semibold text-[#9BA3AF] animate-pulse z-10">Initializing workspace...</p>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen bg-[#111315] text-[#F7F8FC] overflow-x-hidden"
      style={{ fontFamily: "'Geist', sans-serif", ["--sidebar-width" as string]: sidebarWidth }}
    >
      {/* Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=block');
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .sidebar-transition { transition: width 300ms cubic-bezier(0.4,0,0.2,1); }
        .content-transition { transition: padding-left 300ms cubic-bezier(0.4,0,0.2,1); }
        .fade-text { transition: opacity 200ms ease-in-out, width 200ms ease-in-out; }
        .material-symbols-outlined { font-variation-settings: 'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24; }
        @keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .pulse-dot { animation: pulse-dot 1.4s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .sidebar-transition, .content-transition, .fade-text, .pulse-dot { transition: none !important; animation: none !important; }
        }
      `}</style>

      {/* ── Sidebar ───────────────────────────────────────────── */}
      <aside
        ref={sidebarRef}
        aria-label="Main navigation"
        className={`fixed inset-y-0 left-0 bg-[#191D20] border-r border-white/[0.08] z-[60] flex flex-col sidebar-transition w-[240px] lg:w-[var(--sidebar-width)] ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo row */}
        <div
          className={`border-b border-white/[0.05] overflow-hidden shrink-0 flex ${
            sidebarCollapsed
              ? "flex-col items-center gap-2 py-4"
              : "h-20 items-center px-4"
          }`}
        >
          <Link href="/" className={`flex items-center gap-3 min-w-0 ${sidebarCollapsed ? "" : "flex-1"}`}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shrink-0"
              style={{ background: "linear-gradient(135deg, oklch(0.55 0.09 195), oklch(0.75 0.12 190))" }}
            >
              <span className="material-symbols-outlined text-[#0d1210]" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
            </div>
            {!sidebarCollapsed && (
              <div className="fade-text whitespace-nowrap overflow-hidden">
                <p className="text-sm font-bold text-[#F7F8FC] tracking-tight">Planify</p>
              </div>
            )}
          </Link>

          <button
            onClick={() => setSidebarCollapsed((p) => !p)}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!sidebarCollapsed}
            className={`p-2 rounded-lg text-[#7C869A] hover:text-[#F7F8FC] hover:bg-white/5 transition-colors hidden lg:flex items-center justify-center shrink-0 ${
              sidebarCollapsed ? "" : "ml-auto"
            }`}
          >
            <svg fill="none" height="20" width="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="3" x2="21" y1="6" y2="6" />
              <line x1="3" x2="21" y1="12" y2="12" />
              <line x1="3" x2="21" y1="18" y2="18" />
            </svg>
          </button>

          <button
            onClick={closeMobileSidebar}
            aria-label="Close sidebar"
            className="ml-auto p-2 rounded-lg text-[#7C869A] hover:text-[#F7F8FC] hover:bg-white/5 transition-colors flex lg:hidden items-center justify-center shrink-0"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Scrollable nav */}
        <div className="flex-1 overflow-y-auto no-scrollbar py-6">
          <div className="px-3 mb-6">
            <button
              onClick={() => setModalOpen(true)}
              className={`w-full h-11 rounded-xl bg-[oklch(0.75_0.12_190)]/10 hover:bg-[oklch(0.75_0.12_190)]/20 text-[oklch(0.75_0.12_190)] border border-[oklch(0.75_0.12_190)]/20 text-sm font-semibold transition-all flex items-center gap-3 group ${sidebarCollapsed ? "justify-center px-0" : "justify-start px-4"}`}
            >
              <span className="material-symbols-outlined text-sm group-hover:rotate-90 transition-transform shrink-0">add</span>
              {!sidebarCollapsed && <span className="fade-text whitespace-nowrap">New Project</span>}
            </button>
          </div>

          <nav className="px-2 space-y-1">
            <button
              type="button"
              onClick={() => goToView("dashboard")}
              className={`w-full ${navItemClass(activeNav === "dashboard")}`}
            >
              <span className="material-symbols-outlined text-[20px] shrink-0">dashboard</span>
              {!sidebarCollapsed && <span className="fade-text whitespace-nowrap">Dashboard</span>}
            </button>
            <button
              type="button"
              onClick={() => goToView("projects")}
              className={`w-full ${navItemClass(activeNav === "projects")}`}
            >
              <span className="material-symbols-outlined text-[20px] shrink-0">folder_copy</span>
              {!sidebarCollapsed && <span className="fade-text whitespace-nowrap">Projects</span>}
            </button>
            <button
              type="button"
              onClick={() => goToView("assets")}
              className={`w-full ${navItemClass(activeNav === "assets")}`}
            >
              <span className="material-symbols-outlined text-[20px] shrink-0">inventory_2</span>
              {!sidebarCollapsed && <span className="fade-text whitespace-nowrap">Assets</span>}
            </button>
            {[
              { icon: "bolt", label: "AI Workspace" },
              { icon: "group", label: "Team" },
              { icon: "insights", label: "Analytics" },
            ].map(({ icon, label }) => (
              <button
                key={label}
                type="button"
                onClick={closeMobileSidebar}
                title="Coming soon"
                className={`w-full ${navItemClass(false)} opacity-60 cursor-default`}
              >
                <span className="material-symbols-outlined text-[20px] shrink-0">{icon}</span>
                {!sidebarCollapsed && (
                  <span className="fade-text whitespace-nowrap flex-1 text-left">{label}</span>
                )}
                {!sidebarCollapsed && (
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#7C869A]/80">
                    Soon
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Bottom user section */}
        <div className="p-3 border-t border-white/[0.05] space-y-1">
          <button
            type="button"
            onClick={() => goToView("settings")}
            className={`w-full ${navItemClass(activeNav === "settings")}`}
          >
            <span className="material-symbols-outlined text-[20px] shrink-0">settings</span>
            {!sidebarCollapsed && <span className="fade-text whitespace-nowrap">Settings</span>}
          </button>
          <Link
            href="#"
            onClick={closeMobileSidebar}
            title="Coming soon"
            className={`flex items-center gap-3 text-[#7C869A] hover:bg-white/5 hover:text-[#F7F8FC] rounded-xl transition-colors text-sm opacity-60 ${sidebarCollapsed ? "justify-center py-2.5 px-0" : "px-4 py-2.5"}`}
          >
            <span className="material-symbols-outlined text-[20px] shrink-0">help</span>
            {!sidebarCollapsed && <span className="fade-text whitespace-nowrap">Help Center</span>}
          </Link>

          {/* User profile & Logout */}
          <div className={`mt-4 p-2 bg-white/5 rounded-xl flex items-center gap-3 border border-white/5 overflow-hidden ${sidebarCollapsed ? "justify-center" : ""}`}>
            <button
              type="button"
              onClick={() => goToView("settings")}
              title="Open settings"
              className={`flex items-center gap-3 min-w-0 ${sidebarCollapsed ? "" : "flex-1"}`}
            >
              <div className="w-8 h-8 rounded-lg bg-[oklch(0.75_0.12_190)]/10 text-[oklch(0.75_0.12_190)] flex items-center justify-center text-xs font-bold shrink-0">
                {initials}
              </div>
              {!sidebarCollapsed && (
                <div className="flex-1 min-w-0 fade-text text-left">
                  <p className="text-xs font-bold truncate">{session?.user?.name || session?.user?.email || "User"}</p>
                  <p className="text-[10px] text-[#7C869A] truncate">Settings</p>
                </div>
              )}
            </button>
            {!sidebarCollapsed && (
              <button
                onClick={() => signOut({ callbackUrl: ROUTES.home })}
                aria-label="Sign out"
                title="Sign Out"
                className="shrink-0 p-1 rounded-lg text-[#7C869A] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">logout</span>
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* ── Content Area ──────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 content-transition lg:pl-[var(--sidebar-width)]">
        {/* Header */}
        <header
          ref={headerRef}
          className="border-b border-white/[0.05] sticky top-0 bg-[#111315]/80 backdrop-blur-xl z-50 px-4 sm:px-6 md:px-8 shrink-0 safe-top"
        >
          <div className="max-w-[1440px] mx-auto min-h-16 py-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:py-0 sm:h-16">
            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
              <button
                onClick={() => setSidebarOpen((p) => !p)}
                aria-label={sidebarOpen ? "Close menu" : "Open menu"}
                aria-expanded={sidebarOpen}
                className="lg:hidden p-2 -ml-1 text-[#7C869A] hover:text-[#F7F8FC] transition-colors shrink-0"
              >
                <span className="material-symbols-outlined">{sidebarOpen ? "close" : "menu"}</span>
              </button>
              <div className="flex sm:hidden min-w-0 flex-1">
                <p className="text-sm font-semibold text-[#F7F8FC] truncate">
                  {activeNav === "projects"
                    ? "Projects"
                    : activeNav === "assets"
                      ? "Assets"
                      : activeNav === "settings"
                        ? "Settings"
                        : "Dashboard"}
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-sm text-[#7C869A] min-w-0">
                <button
                  type="button"
                  onClick={() => goToView("dashboard")}
                  className="hover:text-[#F7F8FC] transition-colors shrink-0"
                >
                  Dashboard
                </button>
                <span className="material-symbols-outlined text-xs shrink-0">chevron_right</span>
                <span className="text-[#F7F8FC] font-medium truncate">
                  {activeNav === "projects"
                    ? "Projects"
                    : activeNav === "assets"
                      ? "Assets"
                      : activeNav === "settings"
                        ? "Settings"
                        : "Control Center"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <div className="flex md:hidden flex-1 items-center bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 gap-2 min-w-0 focus-within:border-[oklch(0.75_0.12_190)]/50 transition-all">
                <span className="material-symbols-outlined text-sm text-[#7C869A] shrink-0">search</span>
                <input
                  className="bg-transparent border-none outline-none text-xs text-[#F7F8FC] placeholder:text-[#7C869A] w-full min-w-0"
                  placeholder="Search projects..."
                  type="text"
                  aria-label="Search projects"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="hidden md:flex items-center bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 gap-2 w-64 focus-within:border-[oklch(0.75_0.12_190)]/50 transition-all">
                <span className="material-symbols-outlined text-sm text-[#7C869A]">search</span>
                <input
                  className="bg-transparent border-none outline-none text-xs text-[#F7F8FC] placeholder:text-[#7C869A] w-full"
                  placeholder="Search projects..."
                  type="text"
                  aria-label="Search projects"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <span className="text-[10px] bg-white/10 px-1 rounded text-[#7C869A] hidden lg:inline">⌘K</span>
              </div>

              <button aria-label="Notifications" className="w-9 h-9 flex items-center justify-center rounded-lg text-[#7C869A] hover:text-[#F7F8FC] hover:bg-white/5 transition-colors relative shrink-0">
                <span className="material-symbols-outlined">notifications</span>
                <span className="absolute top-2 right-2 w-2 h-2 bg-[oklch(0.75_0.12_190)] rounded-full border-2 border-[#111315]" />
              </button>

              <button className="hidden sm:inline-flex bg-gradient-to-r from-[oklch(0.55_0.09_195)] to-[oklch(0.75_0.12_190)] text-[#0d1210] px-3 sm:px-4 h-9 rounded-lg text-xs font-bold hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-[oklch(0.75_0.12_190)]/10 shrink-0">
                Upgrade
              </button>
            </div>
          </div>
        </header>

        {/* ── Main Body ────────────────────────────────────────── */}
        <div className="p-4 sm:p-6 md:p-8 lg:p-10 max-w-[1440px] mx-auto w-full flex-1 pb-24 lg:pb-10">
          {/* ── Error Banner ───────────────────────────────────────────────── */}
          {apiError && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3">
              <span className="material-symbols-outlined text-rose-400 shrink-0">wifi_off</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-rose-400">Backend Unavailable</p>
                <p className="text-xs text-[#7C869A] mt-0.5 truncate">{apiError}</p>
              </div>
              <button
                onClick={fetchData}
                className="shrink-0 text-xs font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-rose-500/10 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">refresh</span>
                Retry
              </button>
            </div>
          )}

          {activeNav === "projects" ? (
            <ProjectsView
              projects={projects}
              loading={loadingData}
              deletingId={deletingId}
              onCreate={() => setModalOpen(true)}
              onDelete={handleDeleteProject}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          ) : activeNav === "assets" ? (
            <AssetsView
              assets={assets}
              loading={loadingData}
              onRefresh={fetchData}
              onCreateProject={() => setModalOpen(true)}
            />
          ) : activeNav === "settings" ? (
            <SettingsView
              accessToken={accessToken}
              sessionName={session?.user?.name}
              sessionEmail={session?.user?.email}
              sessionImage={session?.user?.image}
              initials={initials}
              projectCount={stats?.total_projects ?? projects.length}
              reportCount={stats?.total_reports ?? assets.length}
            />
          ) : (
          <>
          {/* Greeting */}
          <section ref={welcomeRef} className="mb-8 sm:mb-10">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#F7F8FC] tracking-tight mb-2">
              Welcome back, {session?.user?.name?.split(" ")[0] || "User"}.
            </h1>
            {loadingData ? (
              <div className="h-5 w-64 bg-white/5 rounded animate-pulse" />
            ) : (
              <p className="text-[#B4BCCB] font-medium">
                Your <span className="text-[oklch(0.75_0.12_190)]">AI team</span> has compiled {stats?.total_reports || 0} reports across {stats?.total_projects || 0} active projects.
              </p>
            )}
          </section>

          {/* ── KPI Stats Row ─────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            {[
              { icon: "folder_copy", label: "Active Projects", value: stats?.total_projects ?? 0, color: "oklch(0.75 0.12 190)" },
              { icon: "description", label: "Reports Generated", value: stats?.total_reports ?? 0, color: "oklch(0.55 0.09 195)" },
              { icon: "cyclone", label: "AI Workflow Runs", value: stats?.total_ai_runs ?? 0, color: "#34D399" },
            ].map(({ icon, label, value, color }) => (
              <div
                key={label}
                className="bg-[#191D20] border border-white/[0.08] rounded-2xl p-5 flex items-center gap-4 hover:border-white/20 transition-all group"
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"
                  style={{ background: color.startsWith("oklch") ? `color-mix(in srgb, ${color} 15%, transparent)` : `${color}18` }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ color, fontVariationSettings: "'FILL' 1" }}
                  >
                    {icon}
                  </span>
                </div>
                <div>
                  {loadingData ? (
                    <div className="h-7 w-14 bg-white/5 rounded-lg animate-pulse mb-1" />
                  ) : (
                    <p className="text-2xl font-bold text-[#F7F8FC] tabular-nums">{value}</p>
                  )}
                  <p className="text-xs text-[#7C869A] font-semibold mt-0.5">{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Dashboard Grid */}
          <div className="grid grid-cols-12 gap-8">
            {/* Left Content */}
            <div className="col-span-12 xl:col-span-9 space-y-8">
              {/* AI Command Center / Activity Monitor */}
              <div ref={commandCenterRef} className="bg-[#191D20] p-6 rounded-2xl border border-white/[0.08] relative overflow-hidden">
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-[oklch(0.75_0.12_190)]/5 blur-[60px] rounded-full pointer-events-none" />

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[oklch(0.75_0.12_190)]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                    <h2 className="text-base sm:text-lg font-bold">AI Activity Monitor</h2>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-[#34D399]/10 border border-[#34D399]/20 rounded-full w-fit">
                    <span className="flex h-1.5 w-1.5 rounded-full bg-[#34D399] pulse-dot" />
                    <span className="text-[10px] font-bold text-[#34D399] uppercase tracking-widest">System Live</span>
                  </div>
                </div>

                {loadingData ? (
                  <div className="space-y-4">
                    {[1, 2].map((i) => (
                      <div key={i} className="h-16 bg-white/5 rounded-xl border border-white/5 animate-pulse" />
                    ))}
                  </div>
                ) : runs.length === 0 ? (
                  // Default mock fallback on empty runs
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white/5 rounded-xl p-5 border border-white/5 hover:border-white/10 transition-all flex flex-col justify-between group">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-blue-400 text-sm">query_stats</span>
                          </div>
                          <span className="text-xs font-bold">Market Research</span>
                        </div>
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#34D399]/20 text-[#34D399] uppercase font-bold">Active</span>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between text-[10px] text-[#7C869A] font-bold uppercase">
                          <span>Scanning...</span><span>84%</span>
                        </div>
                        <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                          <div className="bg-blue-500 h-full rounded-full" data-progress="84" style={{ width: "0%" }} />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-xl p-5 border border-white/5 hover:border-white/10 transition-all flex flex-col justify-between group">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-purple-400 text-sm">architecture</span>
                          </div>
                          <span className="text-xs font-bold">Tech Architect</span>
                        </div>
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#aec6ff]/20 text-[#aec6ff] uppercase font-bold">Syncing</span>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between text-[10px] text-[#7C869A] font-bold uppercase">
                          <span>Validating...</span><span>42%</span>
                        </div>
                        <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                          <div className="bg-purple-500 h-full rounded-full" data-progress="42" style={{ width: "0%" }} />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-xl p-5 border border-white/5 hover:border-white/10 transition-all flex flex-col justify-between group">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-amber-400 text-sm">payments</span>
                          </div>
                          <span className="text-xs font-bold">ROI Agent</span>
                        </div>
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#7C869A]/20 text-[#7C869A] uppercase font-bold">Idle</span>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between text-[10px] text-[#7C869A] font-bold uppercase">
                          <span>Waiting...</span><span>0%</span>
                        </div>
                        <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                          <div className="bg-amber-500 h-full rounded-full" data-progress="0" style={{ width: "0%" }} />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {runs.slice(0, 3).map((run) => {
                      const statusColors: Record<string, string> = {
                        completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                        running: "bg-blue-500/10 text-blue-400 border-blue-500/20",
                        failed: "bg-rose-500/10 text-rose-400 border-rose-500/20",
                        unknown: "bg-gray-500/10 text-gray-400 border-gray-500/20",
                      };
                      const colorClass = statusColors[run.status] || statusColors.unknown;

                      return (
                        <div key={run.run_id} className="bg-white/5 rounded-xl p-4 border border-white/5 hover:border-white/10 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-[#8E6BFF]/10 flex items-center justify-center">
                              <span className="material-symbols-outlined text-[#8E6BFF]">cyclone</span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold">{run.project_title}</h4>
                                <span className={`text-[9px] px-2 py-0.5 rounded-full border uppercase font-bold ${colorClass}`}>
                                  {run.status}
                                </span>
                              </div>
                              <p className="text-xs text-[#7C869A] mt-0.5">
                                Agents executed: {run.agents_executed?.length > 0 ? run.agents_executed.join(" → ") : "None yet"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6 text-xs font-bold text-[#7C869A]">
                            <div>
                              <span className="text-[10px] text-[#7C869A] block uppercase font-bold">Duration</span>
                              <span className="text-[#F7F8FC]">{(run.duration_ms / 1000).toFixed(1)}s</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-[#7C869A] block uppercase font-bold">Triggered</span>
                              <span className="text-[#F7F8FC]">
                                {run.created_at ? new Date(run.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "N/A"}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Active Projects */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
                  <h2 className="text-lg sm:text-xl font-bold">Active Projects</h2>
                  <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                    <button
                      type="button"
                      onClick={() => goToView("projects")}
                      className="text-sm font-semibold text-[#7C869A] hover:text-[#F7F8FC] transition-colors"
                    >
                      View all
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalOpen(true)}
                      className="text-sm font-semibold text-[#aec6ff] hover:underline underline-offset-4"
                    >
                      Create project
                    </button>
                  </div>
                </div>

                {loadingData ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2].map((i) => (
                      <div key={i} className="h-44 bg-white/5 rounded-2xl border border-white/5 animate-pulse" />
                    ))}
                  </div>
                ) : projects.length === 0 ? (
                  // Empty state — no projects created yet
                  <div className="bg-[#151A2B] border border-white/[0.08] rounded-2xl p-8 text-center flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
                      <span className="material-symbols-outlined text-[#7C869A] text-2xl">folder</span>
                    </div>
                    <h3 className="font-bold text-base mb-1">No projects yet</h3>
                    <p className="text-xs text-[#7C869A] mb-6 max-w-sm">Create a new project to start collaborating with AI agents on requirements, feasibility, roadmaps, and financial models.</p>
                    <button
                      onClick={() => setModalOpen(true)}
                      className="px-4 py-2 bg-[#aec6ff] text-[#00275e] text-xs font-bold rounded-xl hover:brightness-110 active:scale-95 transition-all uppercase tracking-wider"
                    >
                      Create Project
                    </button>
                  </div>
                ) : filteredProjects.length === 0 ? (
                  // Empty search results
                  <div className="bg-[#151A2B] border border-white/[0.08] rounded-2xl p-8 text-center flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
                      <span className="material-symbols-outlined text-[#7C869A] text-2xl">search_off</span>
                    </div>
                    <h3 className="font-bold text-base mb-1">No results for &ldquo;{searchQuery}&rdquo;</h3>
                    <p className="text-xs text-[#7C869A]">Try a different search term.</p>
                  </div>
                ) : (
                  <div ref={projectCardsRef} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredProjects.map((project) => {
                      const timeAgo = () => {
                        try {
                          const updated = new Date(project.updated_at);
                          const diffMs = Date.now() - updated.getTime();
                          const diffMin = Math.floor(diffMs / 60000);
                          if (diffMin < 1) return "Just now";
                          if (diffMin < 60) return `${diffMin}m ago`;
                          const diffHrs = Math.floor(diffMin / 60);
                          if (diffHrs < 24) return `${diffHrs}h ago`;
                          const diffDays = Math.floor(diffHrs / 24);
                          return `${diffDays}d ago`;
                        } catch {
                          return "Recently";
                        }
                      };

                      return (
                        <Link
                          key={project.id}
                          href={`/projects/${project.id}/chat`}
                          className="proj-card bg-[#191D20] border border-white/[0.08] rounded-2xl p-6 hover:border-white/20 transition-all flex flex-col group cursor-pointer relative"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4 min-w-0">
                              <div className="w-10 h-10 rounded-xl bg-[oklch(0.75_0.12_190)]/10 border border-[oklch(0.75_0.12_190)]/20 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                                <span className="material-symbols-outlined text-[oklch(0.75_0.12_190)] text-xl">folder</span>
                              </div>
                              <div className="min-w-0">
                                <h3 className="text-base font-bold truncate">{project.title}</h3>
                                <p className="text-[10px] text-[#7C869A] uppercase tracking-widest font-bold">Updated {timeAgo()}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[10px] font-bold text-[oklch(0.75_0.12_190)] uppercase tracking-tight">
                                {project.status || "active"}
                              </span>
                              {/* Delete button — visible on hover */}
                              <button
                                onClick={(e) => handleDeleteProject(project.id, e)}
                                disabled={deletingId === project.id}
                                aria-label={`Archive project ${project.title}`}
                                title="Archive project"
                                className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 rounded-lg flex items-center justify-center text-[#7C869A] hover:text-rose-400 hover:bg-rose-500/10"
                              >
                                {deletingId === project.id ? (
                                  <div className="h-3 w-3 border border-rose-400/30 border-t-rose-400 rounded-full animate-spin" />
                                ) : (
                                  <span className="material-symbols-outlined text-sm">delete</span>
                                )}
                              </button>
                            </div>
                          </div>
                          <p className="text-sm text-[#7C869A] mb-6 line-clamp-1">
                            {project.description || "No description provided."}
                          </p>
                          <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                            <div className="flex -space-x-2">
                              <div className="w-7 h-7 rounded-full border-2 border-[#191D20] bg-[#191b22] flex items-center justify-center text-[9px] font-bold">AI</div>
                            </div>
                            <span className="text-[10px] font-bold text-[#7C869A] group-hover:text-[#F7F8FC] uppercase tracking-widest transition-colors flex items-center gap-1">
                              Enter Workspace <span className="material-symbols-outlined text-sm">arrow_forward</span>
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right Sidebar */}
            <div ref={rightPanelRef} className="col-span-12 xl:col-span-3 space-y-8">
              <div className="bg-[#191D20] rounded-2xl border border-white/[0.08] p-6 xl:sticky xl:top-24">
                {/* AI Assistant header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full p-[1.5px]"
                    style={{ background: "linear-gradient(135deg, oklch(0.55 0.09 195), oklch(0.75 0.12 190))" }}
                  >
                    <div className="w-full h-full rounded-full bg-[#191D20] flex items-center justify-center">
                      <span className="material-symbols-outlined text-[oklch(0.75_0.12_190)] text-xl">smart_toy</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">AI Assistant</h3>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#34D399]" />
                      <span className="text-[10px] text-[#7C869A] font-bold uppercase">Ready</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Recent Generated Artifacts */}
                  {stats?.recent_reports?.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-4 gap-2">
                        <h4 className="text-[10px] font-bold text-[#7C869A] uppercase tracking-widest">
                          Recent Reports
                        </h4>
                        <button
                          type="button"
                          onClick={() => goToView("assets")}
                          className="text-[10px] font-bold uppercase tracking-widest text-[oklch(0.75_0.12_190)] hover:underline underline-offset-4"
                        >
                          All assets
                        </button>
                      </div>
                      <div className="space-y-4">
                        {stats.recent_reports.map((rep: any) => (
                          <Link
                            key={rep.report_id}
                            href={`/projects/${rep.project_id}/reports`}
                            className="flex gap-3 items-start group cursor-pointer"
                          >
                            <div className="w-6 h-6 rounded bg-emerald-500/10 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/20 transition-colors">
                              <span className="material-symbols-outlined text-emerald-400 text-[14px]">description</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-[#B4BCCB] font-bold leading-relaxed group-hover:text-[#F7F8FC] transition-colors truncate">
                                {rep.project_title}
                              </p>
                              <p className="text-[10px] text-[#7C869A] uppercase font-bold mt-0.5">
                                {rep.report_type} &middot; v{rep.version}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggestions */}
                  <div>
                    <h4 className="text-[10px] font-bold text-[#7C869A] uppercase tracking-widest mb-4">AI Tips</h4>
                    <div className="space-y-4">
                      <div className="flex gap-3 items-start group cursor-pointer">
                        <div className="w-6 h-6 rounded bg-[oklch(0.75_0.12_190)]/10 flex items-center justify-center shrink-0 group-hover:bg-[oklch(0.75_0.12_190)]/20 transition-colors">
                          <span className="material-symbols-outlined text-[oklch(0.75_0.12_190)] text-[14px]">lightbulb</span>
                        </div>
                        <p className="text-xs text-[#B4BCCB] leading-relaxed group-hover:text-[#F7F8FC] transition-colors">
                          Need a roadmap or financial projection? Click on a project to run AI Agents.
                        </p>
                      </div>
                    </div>
                  </div>

                  <button onClick={() => setModalOpen(true)} className="w-full py-3.5 bg-[oklch(0.75_0.12_190)] text-[#0d1210] font-bold text-[10px] rounded-xl hover:shadow-[0_0_20px_oklch(0.75_0.12_190_/_0.3)] transition-all uppercase tracking-widest mt-4">
                    New Project
                  </button>
                </div>
              </div>
            </div>
          </div>
          </>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-auto border-t border-white/[0.08] bg-[#191D20]/50 py-8 sm:py-10 px-4 sm:px-8 flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-6 text-[10px] sm:text-[11px] font-bold text-[#7C869A] uppercase tracking-widest text-center md:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
            <span className="opacity-40 font-bold text-xs">PLANIFY AI</span>
            <p className="normal-case sm:uppercase tracking-normal sm:tracking-widest">© 2026 Planify AI. Engineered for Excellence.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-8">
            {["Privacy", "Terms", "Security", "Status"].map((item) => (
              <Link key={item} href="#" className="hover:text-[oklch(0.75_0.12_190)] transition-colors">{item}</Link>
            ))}
          </div>
        </footer>
      </main>

      {/* ── Create Project Modal ───────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] flex items-center justify-center p-4">
          <div className="bg-[#191D20] border border-white/10 rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-[0_0_80px_oklch(0.55_0.09_195_/_0.15)] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-[#F7F8FC]">Create New Project</h3>
              <button
                onClick={() => {
                  setModalOpen(false);
                  setModalError("");
                  setNewTitle("");
                  setNewDescription("");
                }}
                className="p-1 rounded-lg text-[#7C869A] hover:text-[#F7F8FC] hover:bg-white/5 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {modalError && (
              <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateProject} className="space-y-6">
              <div>
                <label htmlFor="modal-title" className="block text-xs font-semibold text-[#7C869A] uppercase tracking-wider mb-2">
                  Project Title
                </label>
                <input
                  type="text"
                  id="modal-title"
                  required
                  disabled={creating}
                  placeholder="e.g. Fintech Super App"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 focus:border-[oklch(0.75_0.12_190)]/50 rounded-xl py-3 px-4 text-sm text-white placeholder-gray-500 outline-none transition duration-200"
                />
              </div>

              <div>
                <label htmlFor="modal-desc" className="block text-xs font-semibold text-[#7C869A] uppercase tracking-wider mb-2">
                  Description
                </label>
                <textarea
                  id="modal-desc"
                  disabled={creating}
                  rows={4}
                  placeholder="Describe the target audience, problem statement, key constraints, and requirements..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 focus:border-[oklch(0.75_0.12_190)]/50 rounded-xl py-3 px-4 text-sm text-white placeholder-gray-500 outline-none transition duration-200 resize-none"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  disabled={creating}
                  onClick={() => {
                    setModalOpen(false);
                    setModalError("");
                    setNewTitle("");
                    setNewDescription("");
                  }}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-semibold text-xs rounded-xl transition duration-200 uppercase tracking-wider border border-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-3 bg-[oklch(0.75_0.12_190)] text-[#0d1210] font-semibold text-xs rounded-xl transition duration-200 uppercase tracking-wider hover:brightness-110 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <div className="h-4 w-4 border-2 border-[#0d1210]/20 border-t-[#0d1210] rounded-full animate-spin" />
                  ) : (
                    <span>Create Project</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Mobile Overlay ─────────────────────────────────────── */}
      <div
        onClick={closeMobileSidebar}
        aria-hidden="true"
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] lg:hidden transition-opacity duration-300 ${
          sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* ── Mobile Bottom Nav ──────────────────────────────────── */}
      <nav aria-label="Primary" className="lg:hidden fixed bottom-0 left-0 w-full bg-[#191D20] border-t border-white/10 flex justify-around items-center h-16 z-[70] px-2 sm:px-4 backdrop-blur-2xl safe-bottom">
        <button
          type="button"
          aria-label="Dashboard"
          aria-current={activeNav === "dashboard" ? "page" : undefined}
          onClick={() => goToView("dashboard")}
          className={activeNav === "dashboard" ? "text-[oklch(0.75_0.12_190)]" : "text-[#7C869A]"}
        >
          <span
            className="material-symbols-outlined"
            style={
              activeNav === "dashboard"
                ? { fontVariationSettings: "'FILL' 1" }
                : undefined
            }
          >
            dashboard
          </span>
        </button>
        <button
          type="button"
          aria-label="Projects"
          aria-current={activeNav === "projects" ? "page" : undefined}
          onClick={() => goToView("projects")}
          className={activeNav === "projects" ? "text-[oklch(0.75_0.12_190)]" : "text-[#7C869A]"}
        >
          <span
            className="material-symbols-outlined"
            style={
              activeNav === "projects"
                ? { fontVariationSettings: "'FILL' 1" }
                : undefined
            }
          >
            folder_copy
          </span>
        </button>
        <button
          onClick={() => setModalOpen(true)}
          aria-label="New project"
          className="w-12 h-12 -mt-10 rounded-full flex items-center justify-center text-[#0d1210] shadow-xl ring-4 ring-[#111315]"
          style={{ background: "linear-gradient(135deg, oklch(0.55 0.09 195), oklch(0.75 0.12 190))" }}
        >
          <span className="material-symbols-outlined">add</span>
        </button>
        <button
          type="button"
          aria-label="Assets"
          aria-current={activeNav === "assets" ? "page" : undefined}
          onClick={() => goToView("assets")}
          className={activeNav === "assets" ? "text-[oklch(0.75_0.12_190)]" : "text-[#7C869A]"}
        >
          <span
            className="material-symbols-outlined"
            style={
              activeNav === "assets"
                ? { fontVariationSettings: "'FILL' 1" }
                : undefined
            }
          >
            inventory_2
          </span>
        </button>
        <button
          type="button"
          aria-label="Settings"
          aria-current={activeNav === "settings" ? "page" : undefined}
          onClick={() => goToView("settings")}
          className={activeNav === "settings" ? "text-[oklch(0.75_0.12_190)]" : "text-[#7C869A]"}
        >
          <span
            className="material-symbols-outlined"
            style={
              activeNav === "settings"
                ? { fontVariationSettings: "'FILL' 1" }
                : undefined
            }
          >
            settings
          </span>
        </button>
      </nav>
    </div>
  );
}