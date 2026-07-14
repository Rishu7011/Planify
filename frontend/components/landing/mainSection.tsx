'use client'
import React, { useEffect, useRef } from 'react'
import {motion} from 'framer-motion'
import { BarChart2, Brain, Cloud, Code, CreditCard, FileText, GitBranch, Grid, Hexagon, HomeIcon, Play, RefreshCw, Search, Shield, Sparkles } from 'lucide-react';
import gsap from 'gsap';

import { AppEntryCta } from '@/components/auth/AppEntryCta';

const MainSection = () => {
    const heroRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      
      // Calculate normalized offsets (-0.5 to 0.5)
      const xPercent = (clientX / innerWidth) - 0.5;
      const yPercent = (clientY / innerHeight) - 0.5;

      // Smoothly animate the two background glow spheres in opposite directions
      gsap.to(".hero-glow-1", {
        x: xPercent * 40,
        y: yPercent * 40,
        duration: 1.5,
        ease: "power2.out",
      });

      gsap.to(".hero-glow-2", {
        x: xPercent * -30,
        y: yPercent * -30,
        duration: 1.5,
        ease: "power2.out",
      });
    };

    hero.addEventListener("mousemove", handleMouseMove);
    return () => {
      hero.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  // Stagger variants
  const containerVariants: any = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 80,
        damping: 15,
      },
    },
  };

  return (
    <>
    <main className="relative">
        {/* Hero Section */}
        <section
          ref={heroRef}
          className="relative min-h-[100svh] flex items-center bg-[#090B14] pt-28 sm:pt-36 md:pt-40 pb-16 sm:pb-24 overflow-hidden"
        >
          {/* Ambient Glows */}
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            <div className="hero-glow-1 absolute w-[800px] h-[800px] rounded-full bg-[radial-gradient(circle,_rgba(79,141,255,0.15)_0%,_rgba(79,141,255,0)_70%)] top-[15%] -right-[10%] filter blur-[80px]" />
            <div className="hero-glow-2 absolute w-[750px] h-[750px] rounded-full bg-[radial-gradient(circle,_rgba(142,107,255,0.12)_0%,_rgba(142,107,255,0)_70%)] bottom-[10%] -left-[10%] filter blur-[80px]" />
            <div className="vignette-edges absolute inset-0" />
          </div>

          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-8 relative z-10 w-full">
            <div className="grid lg:grid-cols-2 gap-10 sm:gap-12 lg:gap-16 items-center">
              {/* Hero Copy (Left) */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-8 text-left"
              >
                <motion.div
                  variants={itemVariants}
                  className="inline-flex items-center space-x-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 backdrop-blur-md"
                >
                  <span className="w-2 h-2 rounded-full bg-[#4F8DFF] animate-pulse" />
                  <span className="font-mono text-[11px] font-semibold text-[#B4BCCB] uppercase tracking-wider">
                    Aether AI v2.0 Live
                  </span>
                </motion.div>

                <motion.h1
                  variants={itemVariants}
                  className="text-[clamp(2rem,8vw,3.5rem)] font-extrabold text-[#F7F8FC] leading-[1.1] tracking-tight"
                >
                  Turn messy ideas into{" "}
                  <span className="text-gradient">execution-ready plans</span>
                </motion.h1>

                <motion.p
                  variants={itemVariants}
                  className="text-base md:text-lg text-[#B4BCCB] leading-relaxed max-w-xl"
                >
                  Planify AI ingests text, PDFs, images, and docs—then generates
                  PRDs, market research, architecture, ROI, risk, and roadmaps
                  your team can ship from.
                </motion.p>

                <motion.div
                  variants={itemVariants}
                  className="flex flex-col sm:flex-row gap-4 pt-2"
                >
                  <AppEntryCta
                    guestLabel="Start Building for Free"
                    authLabel="Go to Dashboard"
                    className="btn-primary font-sans text-sm text-white px-8 py-3.5 rounded-lg font-medium text-center h-12 flex items-center justify-center shadow-lg"
                  />
                  <a
                    href="#demo"
                    className="glass-panel font-sans text-sm text-[#F7F8FC] px-8 py-3.5 rounded-lg font-medium text-center h-12 flex items-center justify-center hover:bg-white/10 transition-colors"
                  >
                    <Play className="w-4 h-4 mr-2 text-white fill-white" />
                    View Demo
                  </a>
                </motion.div>
              </motion.div>

              {/* Hero Visual Mockup (Right) */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
                className="relative group w-full max-w-[540px] mx-auto lg:max-w-none"
              >
                <div className="glass-panel rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative">
                  {/* macOS Window Controls */}
                  <div className="bg-black/40 border-b border-white/5 p-3.5 flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-[#ef4444]/80" />
                    <div className="w-3 h-3 rounded-full bg-[#eab308]/80" />
                    <div className="w-3 h-3 rounded-full bg-[#22c55e]/80" />
                  </div>

                  <div className="flex h-[280px] sm:h-[360px] md:h-[400px] bg-[#11131a]/85 backdrop-blur-md">
                    {/* Sidebar */}
                    <div className="hidden sm:flex w-40 md:w-48 border-r border-white/5 p-4 flex-col space-y-4">
                      <div className="flex items-center space-x-2 text-[#F7F8FC] font-medium text-sm mb-4">
                        <Hexagon className="w-4 h-4 text-[#aec6ff] fill-[#aec6ff]/20" />
                        <span className="text-xs md:text-sm">Workspace</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 bg-white/5 px-2 py-2 rounded text-xs text-[#F7F8FC]">
                          <HomeIcon className="w-3.5 h-3.5 text-[#aec6ff]" />
                          <span>Overview</span>
                        </div>
                        <div className="flex items-center space-x-2 px-2 py-2 rounded text-xs text-[#B4BCCB] hover:text-[#F7F8FC] hover:bg-white/[0.02] transition-colors cursor-pointer">
                          <BarChart2 className="w-3.5 h-3.5" />
                          <span>Analysis</span>
                        </div>
                        <div className="flex items-center space-x-2 px-2 py-2 rounded text-xs text-[#B4BCCB] hover:text-[#F7F8FC] hover:bg-white/[0.02] transition-colors cursor-pointer">
                          <GitBranch className="w-3.5 h-3.5" />
                          <span>Workflows</span>
                        </div>
                      </div>
                    </div>

                    {/* Main Workspace Frame */}
                    <div className="flex-1 p-5 md:p-6 flex flex-col gap-4 overflow-y-auto">
                      <div className="flex justify-between items-center mb-1">
                        <h3 className="text-[#F7F8FC] font-medium text-xs md:text-sm">
                          Project Phoenix Structure
                        </h3>
                        <span className="text-[10px] text-[#aec6ff] bg-[#aec6ff]/10 border border-[#aec6ff]/20 px-2 py-0.5 rounded animate-pulse">
                          Processing...
                        </span>
                      </div>

                      {/* AI Brain Card */}
                      <div className="bg-[#151A2B] rounded-xl p-4 border border-white/5 space-y-3">
                        <div className="flex items-start space-x-3">
                          <div className="w-7 h-7 rounded bg-[#aec6ff]/15 flex items-center justify-center mt-0.5 flex-shrink-0">
                            <Brain className="w-4 h-4 text-[#aec6ff]" />
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="h-2 w-1/3 bg-[#aec6ff]/40 rounded" />
                            <div className="h-2 w-full bg-white/5 rounded" />
                            <div className="h-2 w-2/3 bg-white/5 rounded" />
                          </div>
                        </div>
                      </div>

                      {/* AI Pipeline Progress Bars */}
                      <div className="space-y-4 mt-2">
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs">
                            <span className="text-[#B4BCCB]">Data Ingestion</span>
                            <span className="text-[#34D399] font-medium">100%</span>
                          </div>
                          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: "100%" }}
                              transition={{ duration: 1.5, ease: "easeInOut" }}
                              className="h-full bg-[#34D399]"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs">
                            <span className="text-[#B4BCCB]">Semantic Analysis</span>
                            <span className="text-[#aec6ff] font-medium">75%</span>
                          </div>
                          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: "75%" }}
                              transition={{ duration: 1.8, ease: "easeInOut", delay: 0.5 }}
                              className="h-full bg-[#4F8DFF]"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Trusted By Section */}
        <section className="w-full py-12 bg-[#0F1220] border-y border-white/5">
          <div className="max-w-[1200px] mx-auto px-6 md:px-8 flex flex-col items-center">
            <p className="font-mono text-[10px] font-semibold text-[#7C869A] uppercase tracking-widest mb-8">
              Trusted by modern teams
            </p>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
              {[
                { name: "Google", icon: Search },
                { name: "Microsoft", icon: Grid },
                { name: "AWS", icon: Cloud },
                { name: "Notion", icon: FileText },
                { name: "Vercel", icon: Hexagon },
                { name: "Stripe", icon: CreditCard }
              ].map((logo) => (
                <div
                  key={logo.name}
                  className="text-[#B4BCCB] hover:text-[#F7F8FC] font-sans font-bold text-lg flex items-center transition-colors duration-200 cursor-pointer"
                >
                  <logo.icon className="w-5 h-5 mr-2 text-[#7C869A]" />
                  {logo.name}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="product" className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-8 py-16 sm:py-24 bg-[#090B14]">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16 space-y-4">
            <span className="font-mono text-xs font-bold text-[#aec6ff] uppercase tracking-wider">
              Product Capabilities
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-[40px] font-extrabold text-[#F7F8FC] leading-tight">
              Intelligent structuring at scale
            </h2>
            <p className="text-base md:text-lg text-[#B4BCCB]">
              Powerful features designed to automate the heavy lifting of project planning and data organization.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "AI Project Brain",
                desc: "Automatically connects related documents, extracting context to build a unified understanding of your project.",
                icon: Brain
              },
              {
                title: "Multi-Agent Intelligence",
                desc: "Deploy specialized AI agents that collaborate to solve complex structuring tasks simultaneously.",
                icon: Sparkles
              },
              {
                title: "Workflow Generation",
                desc: "Convert unstructured goals into precise, step-by-step technical workflows and Jira-ready tickets.",
                icon: GitBranch
              },
              {
                title: "Real-time Sync",
                desc: "Keep all your tools updated automatically as the project structure evolves in Aether AI.",
                icon: RefreshCw
              },
              {
                title: "Enterprise Security",
                desc: "Bank-grade encryption, SOC2 compliance, and granular role-based access controls built-in.",
                icon: Shield
              },
              {
                title: "Native Integrations",
                desc: "Seamlessly connects with GitHub, Linear, Jira, Notion, and your existing enterprise stack.",
                icon: Code
              }
            ].map((feature, idx) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                className="glass-panel p-6 sm:p-8 rounded-2xl hover:border-[#4F8DFF]/40 transition-all duration-300 flex flex-col text-left group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-[#4F8DFF]/10 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-300">
                  <feature.icon className="w-6 h-6 text-[#4F8DFF]" />
                </div>
                <h3 className="text-xl font-bold text-[#F7F8FC] mb-3 group-hover:text-white transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-[#B4BCCB] leading-relaxed">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Final CTA Section */}
        <section id="pricing" className="relative max-w-[1200px] mx-auto px-4 sm:px-6 md:px-8 py-16 sm:py-24 mb-8 sm:mb-16">
          <div className="cta-floating-gradient" />
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.6 }}
            className="relative z-10 glass-panel rounded-[24px] sm:rounded-[32px] p-6 sm:p-8 md:p-16 flex flex-col items-center text-center max-w-4xl mx-auto shadow-[0_20px_50px_rgba(0,0,0,0.4)] border-white/10 overflow-hidden"
          >
            <div className="absolute inset-0 bg-[#131827]/40 pointer-events-none z-0" />
            <div className="relative z-10 space-y-6 max-w-2xl">
              <h2 className="text-3xl md:text-[40px] font-extrabold text-[#F7F8FC] leading-tight">
                Ready to turn ideas into execution?
              </h2>
              <p className="text-base md:text-lg text-[#B4BCCB] max-w-xl mx-auto">
                Join thousands of modern teams accelerating their planning phase from weeks to minutes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <AppEntryCta
                  guestLabel="Start Free Trial"
                  authLabel="Open Dashboard"
                  className="btn-primary font-sans text-sm text-white px-8 py-4 rounded-xl font-semibold text-center flex items-center justify-center shadow-lg shadow-[#4F8DFF]/20"
                />
                <a
                  href="#demo"
                  className="glass-panel bg-white/5 font-sans text-sm text-[#F7F8FC] px-8 py-4 rounded-xl font-semibold text-center flex items-center justify-center hover:bg-white/10 transition-colors"
                >
                  Book a Demo
                </a>
              </div>
            </div>
          </motion.div>
        </section>
      </main>
    </>
  )
}

export default MainSection