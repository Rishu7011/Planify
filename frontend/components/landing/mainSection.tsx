'use client'
import React, { useEffect, useRef } from 'react'
import { motion, type Variants } from 'framer-motion'
import {
  Activity,
  ArrowRight,
  BarChart3,
  Brain,
  Calendar,
  CheckCircle2,
  Cloud,
  CreditCard,
  FileText,
  Layers,
  LayoutGrid,
  MoreHorizontal,
  Play,
  Search,
  TrendingUp,
  Triangle,
  Users,
  Workflow,
  AppWindow,
} from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { AppEntryCta } from '@/components/auth/AppEntryCta';

gsap.registerPlugin(ScrollTrigger);

/* ─── Animation variants ────────────────────────────────────── */
const containerVariants: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const itemVariants: Variants = {
  hidden:  { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 80, damping: 18 } },
};

/* ─── Stat item ───────────────────────────────────────────────────── */
function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col">
      <span className="font-semibold text-slate-50 text-lg leading-7">{value}</span>
      <span className="text-[#9BA3AF] text-xs leading-4">{label}</span>
    </div>
  );
}

/* ─── Feature card data ───────────────────────────────────────────── */
const FEATURES = [
  {
    icon: Brain,
    title: "AI Project Planning",
    desc: "Automatically break down complex ideas into structured, execution-ready project plans.",
  },
  {
    icon: Search,
    title: "Smart Knowledge Extraction",
    desc: "Extract key insights, decisions, and context automatically from docs and conversations.",
  },
  {
    icon: Workflow,
    title: "Workflow Automation",
    desc: "Generate intelligent workflows that adapt automatically as your project evolves.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    desc: "Keep everyone aligned with shared context, live updates, and seamless handoffs.",
  },
  {
    icon: Layers,
    title: "Context-Aware AI",
    desc: "Planify understands your team's history to make smarter, more relevant suggestions.",
  },
  {
    icon: Activity,
    title: "Real-Time Insights",
    desc: "Track progress and surface risks instantly with live analytics and smart alerts.",
  },
];

/* ─── Trusted logos ───────────────────────────────────────────────── */
const LOGOS = [
  { name: "Google",    icon: Search    },
  { name: "Microsoft", icon: AppWindow },
  { name: "AWS",       icon: Cloud     },
  { name: "Notion",    icon: FileText  },
  { name: "Vercel",    icon: Triangle  },
  { name: "Stripe",    icon: CreditCard},
];

/* ══════════════════════════════════════════════════════════════════ */
const MainSection = () => {
  const heroRef  = useRef<HTMLDivElement>(null);
  const sectionsRef = useRef<HTMLElement[]>([]);

  /* Mouse-parallax on hero glows */
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    const handleMouseMove = (e: MouseEvent) => {
      const xPct = (e.clientX / window.innerWidth)  - 0.5;
      const yPct = (e.clientY / window.innerHeight) - 0.5;
      gsap.to(".hero-glow-1", { x: xPct * 35, y: yPct * 35, duration: 1.8, ease: "power2.out" });
      gsap.to(".hero-glow-2", { x: xPct * -25, y: yPct * -25, duration: 1.8, ease: "power2.out" });
    };

    hero.addEventListener("mousemove", handleMouseMove);
    return () => hero.removeEventListener("mousemove", handleMouseMove);
  }, []);

  /* GSAP scroll-triggered reveals */
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".scroll-reveal").forEach((el) => {
        gsap.fromTo(el,
          { opacity: 0, y: 36 },
          {
            opacity: 1, y: 0, duration: 0.7, ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 88%", once: true },
          }
        );
      });
    });
    return () => ctx.revert();
  }, []);

  return (
    <main className="relative bg-[#111315]">
      {/* ── 1. Hero Section ─────────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative min-h-[100svh] flex items-center pt-28 sm:pt-32 md:pt-36 pb-16 sm:pb-24 overflow-hidden"
        aria-label="Hero"
      >
        {/* Ambient glows */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="hero-glow-1" />
          <div className="hero-glow-2" />
          <div className="hero-glow-3" />
          <div className="vignette-edges" />
        </div>

        <div className="max-w-[1080px] mx-auto px-4 sm:px-6 md:px-8 relative z-10 w-full">
          <div className="grid lg:grid-cols-2 gap-10 sm:gap-12 lg:gap-16 items-center">

            {/* ── Hero copy (left) ── */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="flex flex-col gap-6"
            >
              {/* Badge */}
              <motion.div
                variants={itemVariants}
                className="inline-flex rounded-full bg-[#191D20]/80 border border-white/10 px-4 py-1.5 items-center gap-2 w-fit"
              >
                <span className="relative size-2 flex">
                  <span className="inline-flex animate-ping opacity-75 rounded-full bg-emerald-400 absolute w-full h-full" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
                </span>
                <span className="font-medium text-[#D7DBE2] text-xs leading-4">
                  Aether AI v2.0 Live
                </span>
              </motion.div>

              {/* Headline */}
              <motion.h1
                variants={itemVariants}
                className="font-bold text-slate-50 text-[clamp(2.2rem,5.5vw,3.3rem)] leading-[1.1] tracking-tight"
              >
                Turn messy ideas into{" "}
                <span className="text-gradient">execution-ready</span>{" "}
                plans
              </motion.h1>

              {/* Sub-copy */}
              <motion.p
                variants={itemVariants}
                className="text-[#9BA3AF] text-base leading-relaxed max-w-[480px]"
              >
                Planify transforms scattered ideas into structured projects, intelligent
                workflows, and actionable roadmaps — powered by AI that understands
                context, priorities, and your team's way of working.
              </motion.p>

              {/* CTAs */}
              <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-3 pt-1">
                <AppEntryCta
                  guestLabel="Start Building for Free"
                  authLabel="Go to Dashboard"
                  className="btn-primary font-medium text-sm text-[#0d1210] px-6 py-3.5 rounded-xl
                    flex items-center gap-2 whitespace-nowrap"
                  iconRight={<ArrowRight className="w-4 h-4" />}
                />
                <a
                  href="#demo"
                  className="flex items-center gap-2 font-medium text-sm text-slate-50 px-6 py-3.5 rounded-xl
                    bg-white/5 border border-white/10 hover:bg-white/10 transition-colors duration-200 whitespace-nowrap"
                >
                  <Play className="w-4 h-4" />
                  View Demo
                </a>
              </motion.div>

              {/* Stats row */}
              <motion.div
                variants={itemVariants}
                className="flex items-center gap-6 pt-3"
              >
                <StatItem value="12k+" label="Active teams" />
                <div className="bg-white/10 w-px h-8" />
                <StatItem value="98%" label="Faster planning" />
                <div className="bg-white/10 w-px h-8" />
                <StatItem value="4.9/5" label="Team rating" />
              </motion.div>
            </motion.div>

            {/* ── Hero visual mockup (right) ── */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 36 }}
              animate={{ opacity: 1, scale: 1,    y: 0    }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.35 }}
              className="relative w-full max-w-[540px] mx-auto lg:max-w-none"
            >
              {/* Main mockup window */}
              <div className="relative backdrop-blur-xl shadow-[0_30px_80px_rgba(0,0,0,0.5)] rounded-2xl
                bg-[#191D20]/90 border border-white/10 overflow-hidden">

                {/* Traffic lights */}
                <div className="bg-[#1c2124] border-b border-white/10 flex px-4 py-3 items-center gap-2">
                  <div className="size-2.5 rounded-full bg-red-400/70" />
                  <div className="size-2.5 rounded-full bg-yellow-400/70" />
                  <div className="size-2.5 rounded-full bg-emerald-400/70" />
                  <span className="text-[#9BA3AF] text-xs ml-3">Planify — AI Workspace</span>
                </div>

                {/* Sidebar + main */}
                <div className="grid grid-cols-[120px_1fr] sm:grid-cols-[140px_1fr]">

                  {/* Sidebar */}
                  <div className="bg-[#1c2124] border-r border-white/10 flex p-3 flex-col gap-1">
                    {[
                      { icon: LayoutGrid, label: "Overview",  active: true  },
                      { icon: Workflow,   label: "Workflows", active: false },
                      { icon: Brain,      label: "AI Brain",  active: false },
                      { icon: Users,      label: "Team",      active: false },
                      { icon: BarChart3,  label: "Insights",  active: false },
                    ].map(({ icon: Icon, label, active }) => (
                      <div
                        key={label}
                        className={`rounded-lg text-xs leading-4 flex p-2 items-center gap-2 cursor-pointer transition-colors
                          ${active
                            ? "bg-white/5 text-slate-50"
                            : "text-[#9BA3AF] hover:text-[#D7DBE2] hover:bg-white/5"
                          }`}
                      >
                        <Icon className="size-3.5 shrink-0"
                          style={active ? { color: "oklch(0.75 0.12 190)" } : undefined}
                        />
                        {label}
                      </div>
                    ))}
                  </div>

                  {/* Main workspace */}
                  <div className="relative flex p-3 sm:p-4 flex-col gap-3">

                    {/* AI Brain Processing row */}
                    <div className="rounded-xl bg-[#23272C] border border-white/10 flex p-3 items-center gap-3">
                      <div className="size-9 rounded-lg flex justify-center items-center shrink-0"
                        style={{ background: "linear-gradient(135deg, oklch(0.55 0.09 195 / 0.3), oklch(0.75 0.12 190 / 0.3))" }}
                      >
                        <Brain className="size-4" style={{ color: "oklch(0.75 0.12 190)" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-50 text-xs leading-4">AI Brain Processing</p>
                        <p className="text-[#9BA3AF] text-[10px] truncate">Structuring roadmap from notes...</p>
                      </div>
                      <span className="text-[10px] font-medium shrink-0"
                        style={{ color: "oklch(0.75 0.12 190)" }}
                      >87%</span>
                    </div>

                    {/* Project Canvas */}
                    <div className="rounded-xl bg-[#23272C] border border-white/10 p-3">
                      <div className="flex mb-2 justify-between items-center">
                        <p className="font-medium text-slate-50 text-xs leading-4">Project Canvas</p>
                        <MoreHorizontal className="size-3.5 text-[#9BA3AF]" />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: "Discovery", pct: 100, c: "oklch(0.75 0.12 190)" },
                          { label: "Design",    pct: 65,  c: "oklch(0.6 0.1 195)"   },
                          { label: "Build",     pct: 30,  c: "oklch(0.5 0.08 195)"  },
                        ].map(({ label, pct, c }) => (
                          <div key={label} className="rounded-lg bg-[#2B3138] p-2">
                            <p className="text-[#9BA3AF] text-[9px] mb-1">{label}</p>
                            <div className="rounded-full bg-white/10 w-full h-1.5">
                              <motion.div
                                className="rounded-full h-1.5"
                                style={{ backgroundColor: c }}
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 1.4, ease: "easeOut", delay: 0.6 }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Live Activity + Analytics */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* Live Activity */}
                      <div className="rounded-xl bg-[#23272C] border border-white/10 p-3">
                        <p className="text-[#9BA3AF] text-[10px] mb-2">Live Activity</p>
                        <div className="flex flex-col gap-1.5">
                          {[
                            { color: "#34D399", text: "Sarah completed Sprint 3" },
                            { color: "oklch(0.75 0.12 190)", text: "AI generated 4 new tasks" },
                            { color: "#FBBF24", text: "Review pending on Roadmap" },
                          ].map(({ color, text }) => (
                            <div key={text} className="flex items-center gap-2">
                              <span className="size-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                              <span className="text-[#D7DBE2] text-[10px] truncate">{text}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Analytics mini-chart */}
                      <div className="rounded-xl bg-[#23272C] border border-white/10 p-3">
                        <p className="text-[#9BA3AF] text-[10px] mb-2">Analytics</p>
                        <div className="flex items-end gap-1 h-12">
                          {[
                            { h: "40%", c: "oklch(0.55 0.09 195)" },
                            { h: "70%", c: "oklch(0.6 0.1 195)"   },
                            { h: "55%", c: "oklch(0.65 0.11 192)" },
                            { h: "90%", c: "oklch(0.7 0.11 191)"  },
                            { h: "65%", c: "oklch(0.75 0.12 190)" },
                          ].map(({ h, c }, i) => (
                            <motion.div
                              key={i}
                              className="rounded-t-sm w-2"
                              style={{ backgroundColor: c }}
                              initial={{ height: 0 }}
                              animate={{ height: h }}
                              transition={{ duration: 0.8, ease: "easeOut", delay: 0.7 + i * 0.08 }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Floating "Workflow Ready" badge */}
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0  }}
                      transition={{ duration: 0.5, delay: 1.2 }}
                      className="backdrop-blur-md shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-xl
                        bg-[#2B3138]/95 border border-white/10 absolute -right-3 top-24 p-3 w-36 hidden sm:block"
                    >
                      <div className="flex mb-1 items-center gap-1.5">
                        <CheckCircle2 className="size-3.5 text-emerald-400" />
                        <span className="font-medium text-slate-50 text-[10px]">Workflow Ready</span>
                      </div>
                      <p className="text-[#9BA3AF] text-[9px]">12 tasks structured automatically</p>
                    </motion.div>
                  </div>
                </div>
              </div>

              {/* Floating "Productivity +42%" badge */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0   }}
                transition={{ duration: 0.5, delay: 1.4 }}
                className="backdrop-blur-md shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-xl
                  bg-[#2B3138]/95 border border-white/10 flex absolute -left-4 sm:-left-6 -bottom-5 sm:-bottom-6 p-3 items-center gap-3"
              >
                <div className="size-8 rounded-lg flex justify-center items-center"
                  style={{ background: "oklch(0.55 0.09 195 / 0.25)" }}
                >
                  <TrendingUp className="size-4" style={{ color: "oklch(0.75 0.12 190)" }} />
                </div>
                <div>
                  <p className="font-medium text-slate-50 text-xs leading-4">Productivity +42%</p>
                  <p className="text-[#9BA3AF] text-[10px]">vs last quarter</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── 2. Trusted By Section ───────────────────────────────────── */}
      <section className="relative flex px-4 sm:px-6 md:px-8 py-14 sm:py-16 flex-col items-center gap-8 scroll-reveal"
        aria-label="Trusted by teams"
      >
        <p className="font-medium uppercase text-[#9BA3AF] text-sm leading-5 tracking-widest text-center">
          Trusted by innovative teams worldwide
        </p>
        <div className="max-w-[980px] mx-auto opacity-60 flex flex-wrap justify-center sm:justify-between items-center gap-6 sm:gap-8 w-full">
          {LOGOS.map(({ name, icon: Icon }) => (
            <div
              key={name}
              className="grayscale hover:grayscale-0 hover:opacity-100 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Icon className="size-5 text-[#D7DBE2]" />
              <span className="font-semibold text-[#D7DBE2] text-sm leading-5">{name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3. Features / Capabilities Section ──────────────────────── */}
      <section
        id="product"
        className="relative max-w-[1080px] mx-auto px-4 sm:px-6 md:px-8 py-16 sm:py-24"
        aria-label="Product capabilities"
      >
        <div className="text-center flex flex-col items-center gap-3 mb-12 sm:mb-16 scroll-reveal">
          <span
            className="font-medium uppercase text-xs leading-4 tracking-widest"
            style={{ color: "oklch(0.75 0.12 190)" }}
          >
            Capabilities
          </span>
          <h2 className="font-bold text-slate-50 text-[clamp(1.75rem,3.5vw,2.5rem)] leading-tight tracking-tight">
            Intelligent structuring at scale
          </h2>
          <p className="max-w-[560px] text-[#9BA3AF] text-base leading-6">
            Everything you need to move from raw ideas to a fully structured,
            actionable execution plan.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {FEATURES.map(({ icon: Icon, title, desc }, idx) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: idx * 0.07 }}
              className="feature-card backdrop-blur-md rounded-2xl bg-[#191D20]/80 border border-white/10
                p-6 flex flex-col gap-4 cursor-pointer group"
            >
              <div
                className="size-11 rounded-xl flex justify-center items-center transition-transform duration-300 group-hover:scale-105"
                style={{ background: "oklch(0.55 0.09 195 / 0.2)" }}
              >
                <Icon className="size-5" style={{ color: "oklch(0.75 0.12 190)" }} />
              </div>
              <div>
                <h3 className="font-semibold text-slate-50 text-base leading-6 mb-2">
                  {title}
                </h3>
                <p className="text-[#9BA3AF] text-sm leading-5">{desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── 4. CTA Section ──────────────────────────────────────────── */}
      <section
        id="pricing"
        className="relative max-w-[1080px] mx-auto px-4 sm:px-6 md:px-8 py-16 sm:py-20 mb-8 sm:mb-16"
        aria-label="Call to action"
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.6 }}
          className="relative text-center rounded-3xl bg-[#191D20] border border-white/10
            flex p-10 sm:p-14 md:p-16 flex-col items-center gap-6 overflow-hidden"
        >
          {/* Internal glows */}
          <div className="pointer-events-none left-1/4 rounded-full absolute -top-20 w-96 h-96"
            style={{
              background: "radial-gradient(circle, oklch(0.55 0.09 195 / 0.35), transparent 70%)",
              filter: "blur(48px)",
            }}
          />
          <div className="pointer-events-none right-1/4 rounded-full absolute -bottom-20 w-96 h-96"
            style={{
              background: "radial-gradient(circle, oklch(0.75 0.12 190 / 0.3), transparent 70%)",
              filter: "blur(48px)",
            }}
          />

          <h2 className="relative max-w-[600px] font-bold text-slate-50 text-[clamp(1.75rem,3.5vw,2.5rem)] leading-tight tracking-tight">
            Ready to build faster with AI?
          </h2>
          <p className="relative max-w-[480px] text-[#9BA3AF] text-base leading-6">
            Join thousands of teams turning ideas into execution-ready plans with Planify.
            Start your first AI-powered project today.
          </p>
          <div className="relative flex flex-wrap justify-center items-center gap-4 pt-2">
            <AppEntryCta
              guestLabel="Get Started"
              authLabel="Open Dashboard"
              className="btn-primary font-medium text-sm text-[#0d1210] px-7 py-4 rounded-xl
                flex items-center gap-2 whitespace-nowrap"
              iconRight={<ArrowRight className="w-4 h-4" />}
            />
            <a
              href="#demo"
              className="flex items-center gap-2 font-medium text-sm text-slate-50 px-7 py-4 rounded-xl
                bg-white/5 border border-white/10 hover:bg-white/10 transition-colors duration-200 whitespace-nowrap"
            >
              <Calendar className="w-4 h-4" />
              Book a Demo
            </a>
          </div>
        </motion.div>
      </section>
    </main>
  );
};

export default MainSection;