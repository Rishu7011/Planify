"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // GSAP refs
  const sidebarRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const welcomeRef = useRef<HTMLElement>(null);
  const commandCenterRef = useRef<HTMLDivElement>(null);
  const projectCardsRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let ctx: ReturnType<import("gsap").default["context"]> | null = null;

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

        // AI Command Center
        if (commandCenterRef.current) {
          gsap.from(commandCenterRef.current, {
            y: 40,
            opacity: 0,
            duration: 0.7,
            ease: "power2.out",
            delay: 0.55,
          });

          // Animate progress bars
          commandCenterRef.current
            .querySelectorAll<HTMLElement>("[data-progress]")
            .forEach((bar) => {
              const target = bar.dataset.progress ?? "0";
              gsap.fromTo(
                bar,
                { width: "0%" },
                { width: `${target}%`, duration: 1.4, ease: "power2.out", delay: 1 }
              );
            });
        }

        // Project cards stagger
        if (projectCardsRef.current) {
          gsap.from(
            projectCardsRef.current.querySelectorAll<HTMLElement>(".proj-card"),
            {
              y: 32,
              opacity: 0,
              duration: 0.55,
              stagger: 0.14,
              ease: "power2.out",
              scrollTrigger: {
                trigger: projectCardsRef.current,
                start: "top 88%",
                toggleActions: "play none none none",
              },
            }
          );
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

  const sidebarWidth = sidebarCollapsed ? "72px" : "240px";
  const closeMobileSidebar = () => setSidebarOpen(false);

  return (
    <div
      className="flex min-h-screen bg-[#090B14] text-[#F7F8FC] overflow-x-hidden"
      style={{ fontFamily: "'Geist', sans-serif", ["--sidebar-width" as string]: sidebarWidth }}
    >
      {/* Material Symbols */}
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
        className={`fixed inset-y-0 left-0 bg-[#0F1220] border-r border-white/[0.08] z-[60] flex flex-col sidebar-transition w-[240px] lg:w-[var(--sidebar-width)] ${
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
          <div className={`flex items-center gap-3 min-w-0 ${sidebarCollapsed ? "" : "flex-1"}`}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4F8DFF] to-[#8E6BFF] flex items-center justify-center shadow-lg shrink-0">
              <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
            </div>
            {!sidebarCollapsed && (
              <div className="fade-text whitespace-nowrap overflow-hidden">
                <p className="text-sm font-bold text-[#F7F8FC] tracking-tight">Planify</p>
              </div>
            )}
          </div>

          {/* Desktop collapse/expand toggle.
              Collapsed: stacked below the logo, centered, so it never gets
              squeezed out of the 72px-wide row (the bug in the screenshot —
              logo + toggle side by side don't fit, so the toggle silently
              disappeared and there was no way back to the expanded view).
              Expanded: sits to the right of the logo as before. */}
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

          {/* Mobile close button (collapse is a desktop-only concept, so this
              never has to share space with it). */}
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
              className={`w-full h-11 rounded-xl bg-white/5 border border-white/10 text-sm font-semibold hover:bg-white/10 transition-all flex items-center gap-3 group ${sidebarCollapsed ? "justify-center px-0" : "justify-start px-4"}`}
            >
              <span className="material-symbols-outlined text-sm group-hover:rotate-90 transition-transform shrink-0">add</span>
              {!sidebarCollapsed && <span className="fade-text whitespace-nowrap">New Project</span>}
            </button>
          </div>

          <nav className="px-2 space-y-1">
            <Link
              href="#"
              onClick={closeMobileSidebar}
              className={`flex items-center gap-3 bg-[#aec6ff]/10 text-[#aec6ff] rounded-xl font-medium text-sm ${sidebarCollapsed ? "justify-center py-2.5 px-0" : "px-4 py-2.5"}`}
            >
              <span className="material-symbols-outlined text-[20px] shrink-0">dashboard</span>
              {!sidebarCollapsed && <span className="fade-text whitespace-nowrap">Dashboard</span>}
            </Link>
            {[
              { icon: "folder_copy", label: "Projects" },
              { icon: "bolt", label: "AI Workspace" },
              { icon: "inventory_2", label: "Assets" },
              { icon: "group", label: "Team" },
              { icon: "insights", label: "Analytics" },
            ].map(({ icon, label }) => (
              <Link
                key={label}
                href="#"
                onClick={closeMobileSidebar}
                className={`flex items-center gap-3 text-[#7C869A] hover:bg-white/5 hover:text-[#F7F8FC] rounded-xl transition-colors text-sm ${sidebarCollapsed ? "justify-center py-2.5 px-0" : "px-4 py-2.5"}`}
              >
                <span className="material-symbols-outlined text-[20px] shrink-0">{icon}</span>
                {!sidebarCollapsed && <span className="fade-text whitespace-nowrap">{label}</span>}
              </Link>
            ))}
          </nav>
        </div>

        {/* Bottom user section */}
        <div className="p-3 border-t border-white/[0.05] space-y-1">
          {[{ icon: "settings", label: "Settings" }, { icon: "help", label: "Help Center" }].map(({ icon, label }) => (
            <Link
              key={label}
              href="#"
              onClick={closeMobileSidebar}
              className={`flex items-center gap-3 text-[#7C869A] hover:bg-white/5 hover:text-[#F7F8FC] rounded-xl transition-colors text-sm ${sidebarCollapsed ? "justify-center py-2.5 px-0" : "px-4 py-2.5"}`}
            >
              <span className="material-symbols-outlined text-[20px] shrink-0">{icon}</span>
              {!sidebarCollapsed && <span className="fade-text whitespace-nowrap">{label}</span>}
            </Link>
          ))}

          {/* User profile */}
          <div className={`mt-4 p-2 bg-white/5 rounded-xl flex items-center gap-3 border border-white/5 overflow-hidden ${sidebarCollapsed ? "justify-center" : ""}`}>
            <div className="w-8 h-8 rounded-lg bg-[#1d1f26] flex items-center justify-center text-xs font-bold shrink-0">OJ</div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0 fade-text">
                <p className="text-xs font-bold truncate">Olivia Jensen</p>
                <p className="text-[10px] text-[#7C869A] truncate">Admin Plan</p>
              </div>
            )}
            {!sidebarCollapsed && (
              <button aria-label="Account options" className="shrink-0 fade-text">
                <span className="material-symbols-outlined text-[#7C869A] text-sm">more_vert</span>
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
          className="h-16 border-b border-white/[0.05] sticky top-0 bg-[#090B14]/80 backdrop-blur-xl z-50 px-6 sm:px-8 shrink-0"
        >
          <div className="max-w-[1440px] mx-auto h-full flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              {/* Mobile hamburger */}
              <button
                onClick={() => setSidebarOpen((p) => !p)}
                aria-label={sidebarOpen ? "Close menu" : "Open menu"}
                aria-expanded={sidebarOpen}
                className="lg:hidden p-2 -ml-2 text-[#7C869A] hover:text-[#F7F8FC] transition-colors"
              >
                <span className="material-symbols-outlined">{sidebarOpen ? "close" : "menu"}</span>
              </button>
              {/* Breadcrumb */}
              <div className="hidden sm:flex items-center gap-2 text-sm text-[#7C869A]">
                <span className="hover:text-[#F7F8FC] cursor-pointer transition-colors">Dashboard</span>
                <span className="material-symbols-outlined text-xs">chevron_right</span>
                <span className="text-[#F7F8FC] font-medium">Control Center</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="hidden md:flex items-center bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 gap-2 w-64 focus-within:border-[#aec6ff]/50 transition-all">
                <span className="material-symbols-outlined text-sm text-[#7C869A]">search</span>
                <input
                  className="bg-transparent border-none outline-none text-xs text-[#F7F8FC] placeholder:text-[#7C869A] w-full"
                  placeholder="Search projects..."
                  type="text"
                  aria-label="Search projects"
                />
                <span className="text-[10px] bg-white/10 px-1 rounded text-[#7C869A]">⌘K</span>
              </div>

              {/* Notifications */}
              <button aria-label="Notifications" className="w-9 h-9 flex items-center justify-center rounded-lg text-[#7C869A] hover:text-[#F7F8FC] hover:bg-white/5 transition-colors relative">
                <span className="material-symbols-outlined">notifications</span>
                <span className="absolute top-2 right-2 w-2 h-2 bg-[#aec6ff] rounded-full border-2 border-[#090B14]" />
              </button>

              {/* Upgrade */}
              <button className="bg-[#508eff] text-[#00275e] px-4 h-9 rounded-lg text-xs font-bold hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-[#508eff]/10">
                Upgrade
              </button>
            </div>
          </div>
        </header>

        {/* ── Main Body ────────────────────────────────────────── */}
        <div className="p-6 sm:p-8 md:p-10 max-w-[1440px] mx-auto w-full">

          {/* Greeting */}
          <section ref={welcomeRef} className="mb-10">
            <h1 className="text-3xl font-bold text-[#F7F8FC] tracking-tight mb-2">Welcome back, Olivia.</h1>
            <p className="text-[#B4BCCB] font-medium">
              Your <span className="text-[#aec6ff]">AI team</span> processed 14 documents today. 3 workflows are currently active.
            </p>
          </section>

          {/* Dashboard Grid */}
          <div className="grid grid-cols-12 gap-8">

            {/* Left Content */}
            <div className="col-span-12 xl:col-span-9 space-y-8">

              {/* AI Command Center */}
              <div ref={commandCenterRef} className="bg-[#151A2B] p-6 rounded-2xl border border-white/[0.08] relative overflow-hidden">
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#aec6ff]/5 blur-[60px] rounded-full pointer-events-none" />

                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#8E6BFF]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                    <h2 className="text-lg font-bold">AI Command Center</h2>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-[#34D399]/10 border border-[#34D399]/20 rounded-full">
                    <span className="flex h-1.5 w-1.5 rounded-full bg-[#34D399] pulse-dot" />
                    <span className="text-[10px] font-bold text-[#34D399] uppercase tracking-widest">System Live</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Agent 1 */}
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

                  {/* Agent 2 */}
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

                  {/* Agent 3 */}
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
              </div>

              {/* Active Projects */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">Active Projects</h2>
                  <button className="text-sm font-semibold text-[#aec6ff] hover:underline underline-offset-4">View all projects</button>
                </div>

                <div ref={projectCardsRef} className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {/* Card 1 */}
                  <div className="proj-card bg-[#151A2B] border border-white/[0.08] rounded-2xl p-6 hover:border-white/20 transition-all flex flex-col group cursor-pointer">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <span className="material-symbols-outlined text-blue-400 text-xl">account_balance</span>
                        </div>
                        <div>
                          <h3 className="text-base font-bold truncate max-w-[180px]">Fintech Super App</h3>
                          <p className="text-[10px] text-[#7C869A] uppercase tracking-widest font-bold">Updated 2h ago</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-tight block">Analyzing</span>
                        <span className="text-sm font-bold text-[#F7F8FC]">84%</span>
                      </div>
                    </div>
                    <p className="text-sm text-[#7C869A] mb-6 line-clamp-1">Enterprise-grade wealth management platform integration.</p>
                    <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                      <div className="flex -space-x-2">
                        {["JD", "SK"].map((init) => (
                          <div key={init} className="w-7 h-7 rounded-full border-2 border-[#151A2B] bg-[#191b22] flex items-center justify-center text-[9px] font-bold">{init}</div>
                        ))}
                        <div className="w-7 h-7 rounded-full border-2 border-[#151A2B] bg-[#508eff] text-[#00275e] flex items-center justify-center text-[9px] font-bold">+3</div>
                      </div>
                      <button className="text-[10px] font-bold text-[#7C869A] hover:text-[#F7F8FC] uppercase tracking-widest transition-colors">Details</button>
                    </div>
                  </div>

                  {/* Card 2 */}
                  <div className="proj-card bg-[#151A2B] border border-white/[0.08] rounded-2xl p-6 hover:border-white/20 transition-all flex flex-col group cursor-pointer">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <span className="material-symbols-outlined text-purple-400 text-xl">shopping_bag</span>
                        </div>
                        <div>
                          <h3 className="text-base font-bold truncate max-w-[180px]">B2B Marketplace</h3>
                          <p className="text-[10px] text-[#7C869A] uppercase tracking-widest font-bold">Updated 5h ago</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-[#aec6ff] uppercase tracking-tight block">PRD Syncing</span>
                        <span className="text-sm font-bold text-[#F7F8FC]">42%</span>
                      </div>
                    </div>
                    <p className="text-sm text-[#7C869A] mb-6 line-clamp-1">Global distribution network portal for industrial components.</p>
                    <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                      <div className="flex -space-x-2">
                        {["ML", "AB"].map((init) => (
                          <div key={init} className="w-7 h-7 rounded-full border-2 border-[#151A2B] bg-[#191b22] flex items-center justify-center text-[9px] font-bold">{init}</div>
                        ))}
                      </div>
                      <button className="text-[10px] font-bold text-[#7C869A] hover:text-[#F7F8FC] uppercase tracking-widest transition-colors">Details</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div ref={rightPanelRef} className="col-span-12 xl:col-span-3 space-y-8">
              <div className="bg-[#151A2B] rounded-2xl border border-white/[0.08] p-6 sticky top-24">

                {/* AI Assistant header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 p-[1.5px]">
                    <div className="w-full h-full rounded-full bg-[#151A2B] flex items-center justify-center">
                      <span className="material-symbols-outlined text-[#aec6ff] text-xl">smart_toy</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">AI Assistant</h3>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#34D399]" />
                      <span className="text-[10px] text-[#7C869A] font-bold uppercase">Learning</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Suggestions */}
                  <div>
                    <h4 className="text-[10px] font-bold text-[#7C869A] uppercase tracking-widest mb-4">Suggestions</h4>
                    <div className="space-y-4">
                      <div className="flex gap-3 items-start group cursor-pointer">
                        <div className="w-6 h-6 rounded bg-[#aec6ff]/10 flex items-center justify-center shrink-0 group-hover:bg-[#aec6ff]/20 transition-colors">
                          <span className="material-symbols-outlined text-[#aec6ff] text-[14px]">lightbulb</span>
                        </div>
                        <p className="text-xs text-[#B4BCCB] leading-relaxed group-hover:text-[#F7F8FC] transition-colors">
                          Review the &ldquo;User Security&rdquo; section in Fintech PRD.
                        </p>
                      </div>
                      <div className="flex gap-3 items-start group cursor-pointer">
                        <div className="w-6 h-6 rounded bg-purple-500/10 flex items-center justify-center shrink-0 group-hover:bg-purple-500/20 transition-colors">
                          <span className="material-symbols-outlined text-purple-400 text-[14px]">auto_graph</span>
                        </div>
                        <p className="text-xs text-[#B4BCCB] leading-relaxed group-hover:text-[#F7F8FC] transition-colors">
                          Market data shift in &ldquo;Industrial Logistics&rdquo; detected.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* CTA */}
                  <button className="w-full py-3.5 bg-[#aec6ff] text-[#00275e] font-bold text-[10px] rounded-xl hover:shadow-[0_0_20px_rgba(79,141,255,0.3)] transition-all uppercase tracking-widest mt-4">
                    Ask AI Anything
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-auto border-t border-white/[0.08] bg-[#090B14]/50 py-10 px-8 flex flex-col md:flex-row justify-between items-center gap-6 text-[11px] font-bold text-[#7C869A] uppercase tracking-widest">
          <div className="flex items-center gap-4">
            <span className="opacity-40 font-bold text-xs">PLANIFY AI</span>
            <p>© 2024 Planify AI. Engineered for Excellence.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-8">
            {["Privacy", "Terms", "Security", "Status"].map((item) => (
              <Link key={item} href="#" className="hover:text-[#aec6ff] transition-colors">{item}</Link>
            ))}
          </div>
        </footer>
      </main>

      {/* ── Mobile Overlay ─────────────────────────────────────── */}
      <div
        onClick={closeMobileSidebar}
        aria-hidden="true"
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] lg:hidden transition-opacity duration-300 ${sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
      />

      {/* ── Mobile Bottom Nav ──────────────────────────────────── */}
      <nav aria-label="Primary" className="lg:hidden fixed bottom-0 left-0 w-full bg-[#0F1220] border-t border-white/10 flex justify-around items-center h-16 z-[70] px-4 backdrop-blur-2xl">
        <button aria-label="Dashboard" className="text-[#aec6ff]">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>dashboard</span>
        </button>
        <button aria-label="Projects" className="text-[#7C869A]">
          <span className="material-symbols-outlined">folder</span>
        </button>
        <button aria-label="AI Workspace" className="w-12 h-12 -mt-10 rounded-full bg-gradient-to-br from-[#4F8DFF] to-[#8E6BFF] flex items-center justify-center text-white shadow-xl ring-4 ring-[#090B14]">
          <span className="material-symbols-outlined">bolt</span>
        </button>
        <button aria-label="Team" className="text-[#7C869A]">
          <span className="material-symbols-outlined">group</span>
        </button>
        <button aria-label="Settings" className="text-[#7C869A]">
          <span className="material-symbols-outlined">settings</span>
        </button>
      </nav>
    </div>
  );
}