"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { apiFetch, apiStream } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { WorkspaceClarificationPanel } from "@/components/workspace/WorkspaceClarificationPanel";

// ---------------------------------------------------------------------------
// Tailwind-only reusable style fragments
// ---------------------------------------------------------------------------

const GLASS_PANEL =
  "bg-white/[0.03] backdrop-blur-md border border-white/[0.08]";

const CUSTOM_SCROLLBAR =
  "[&::-webkit-scrollbar]:w-1 " +
  "[&::-webkit-scrollbar-track]:bg-transparent " +
  "[&::-webkit-scrollbar-thumb]:bg-white/10 " +
  "[&::-webkit-scrollbar-thumb]:rounded-[10px]";

const TRANSITION =
  "transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  message_type: string;
  created_at: string;
  metadata?: {
    agent?: string;
    reports_generated?: string[];
    [key: string]: any;
  };
}

interface MemoryItem {
  id: string;
  name: string;
  detail: string;
  icon: string;
  color: string;
}

type WorkflowEventType =
  | "agent_start"
  | "agent_complete"
  | "clarification"
  | "workflow_complete"
  | "conversation_complete"
  | "error";

interface WorkflowEvent {
  type: WorkflowEventType;
  agent?: string;
  questions?: string[];
  status?: string;
  reports?: string[];
  message?: string;
}

function isWorkflowEvent(value: unknown): value is WorkflowEvent {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return typeof v.type === "string";
}

// ---------------------------------------------------------------------------
// Static config
// ---------------------------------------------------------------------------

const AGENT_ORDER = [
  "input_understanding",
  "clarification",
  "prd",
  "feasibility",
  "roi",
  "roadmap",
  "final_report",
] as const;

type AgentKey = (typeof AGENT_ORDER)[number];

const AGENT_META: Record<
  AgentKey,
  { label: string; short: string; icon: string; iconBg: string; iconColor: string }
> = {
  input_understanding: {
    label: "Understanding your idea...",
    short: "Understand",
    icon: "psychology",
    iconBg: "bg-blue-500/20",
    iconColor: "text-[#AEC6FF]",
  },
  clarification: {
    label: "Checking for missing context...",
    short: "Clarify",
    icon: "help_center",
    iconBg: "bg-purple-500/20",
    iconColor: "text-purple-400",
  },
  prd: {
    label: "Writing Product Requirements Document...",
    short: "PRD Generation",
    icon: "description",
    iconBg: "bg-blue-500/20",
    iconColor: "text-blue-400",
  },
  feasibility: {
    label: "Assessing technical feasibility...",
    short: "Technical Arch",
    icon: "database",
    iconBg: "bg-purple-500/20",
    iconColor: "text-purple-400",
  },
  roi: {
    label: "Financial modeling & ROI analysis...",
    short: "ROI Model",
    icon: "calculate",
    iconBg: "bg-amber-500/20",
    iconColor: "text-amber-400",
  },
  roadmap: {
    label: "Building project execution roadmap...",
    short: "Roadmap",
    icon: "account_tree",
    iconBg: "bg-emerald-500/20",
    iconColor: "text-emerald-400",
  },
  final_report: {
    label: "Assembling final report bundle...",
    short: "Final Report",
    icon: "task_alt",
    iconBg: "bg-emerald-500/20",
    iconColor: "text-emerald-400",
  },
};

const SIDEBAR_STAGES: { key: AgentKey; label: string }[] = [
  { key: "input_understanding", label: "Understand" },
  { key: "prd", label: "PRD Generation" },
  { key: "feasibility", label: "Technical Arch" },
  { key: "roi", label: "ROI Model" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getMemoryTone(color?: string) {
  const tones: Record<string, { bg: string; text: string }> = {
    primary: { bg: "bg-[#AEC6FF]/20", text: "text-[#AEC6FF]" },
    "purple-400": { bg: "bg-purple-500/20", text: "text-purple-400" },
    "blue-400": { bg: "bg-blue-500/20", text: "text-blue-400" },
    "amber-400": { bg: "bg-amber-500/20", text: "text-amber-400" },
    "emerald-400": { bg: "bg-emerald-500/20", text: "text-emerald-400" },
    success: { bg: "bg-emerald-500/20", text: "text-emerald-400" },
  };

  return tones[color || ""] || { bg: "bg-white/10", text: "text-[#B4BCCB]" };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ChatPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { data: session } = useSession();
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeAgent, setActiveAgent] = useState<AgentKey | null>(null);
  const [clarificationQuestions, setClarificationQuestions] = useState<string[]>([]);
  const [reportsReady, setReportsReady] = useState(false);
  const [reportsGenerated, setReportsGenerated] = useState<string[]>([]);
  const [project, setProject] = useState<{
    title: string;
    objective?: string;
    priority?: string;
    target?: string;
    memory?: MemoryItem[];
  } | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [copiedShare, setCopiedShare] = useState(false);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpenMobile, setSidebarOpenMobile] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const accessToken = (session?.user as any)?.accessToken;

  const sendingRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeAgent, clarificationQuestions]);

  useEffect(() => {
    if (!session || !accessToken) return;

    const fetchProject = async () => {
      try {
        const p = await apiFetch<any>(`/api/projects/${projectId}`, { accessToken });
        if (!mountedRef.current) return;
        setProject({
          title: p.title,
          objective: p.objective,
          priority: p.priority,
          target: p.target,
          memory: p.memory,
        });
      } catch (err) {
        console.error("Failed to load project", err);
        if (mountedRef.current) setErrorBanner("Couldn't load project details.");
      }
    };

    const fetchMessages = async () => {
      try {
        const data = await apiFetch<Message[]>(
          `/api/projects/${projectId}/chat/messages`,
          { accessToken }
        );
        if (!mountedRef.current) return;
        setMessages(data);
        const lastMsg = data[data.length - 1];
        if (lastMsg?.metadata?.reports_generated?.length) {
          setReportsReady(true);
          setReportsGenerated(lastMsg.metadata.reports_generated);
        }
      } catch (err) {
        console.error("Failed to load messages", err);
        if (mountedRef.current) setErrorBanner("Couldn't load chat history.");
      }
    };

    fetchProject();
    fetchMessages();
  }, [session, accessToken, projectId]);

  const sendMessage = useCallback(
    async (content: string, opts?: { keepClarificationVisible?: boolean }) => {
      if (!content.trim() || sendingRef.current || !accessToken) return;

      sendingRef.current = true;
      setErrorBanner(null);

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const tempId =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      const userMsg: Message = {
        id: tempId,
        role: "user",
        content,
        message_type: "text",
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setLoading(true);
      if (!opts?.keepClarificationVisible) {
        setClarificationQuestions([]);
      }

      try {
        const res = await apiStream(
          `/api/projects/${projectId}/chat/messages`,
          { content },
          accessToken,
          { signal: controller.signal }
        );

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        if (!res.body) throw new Error("No response stream from server");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (!mountedRef.current) break;

          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data:")) continue;
            const raw = line.slice(5).trim();
            if (!raw) continue;

            let parsed: unknown;
            try {
              parsed = JSON.parse(raw);
            } catch (parseErr) {
              console.error("Malformed SSE payload, skipping:", raw, parseErr);
              continue;
            }

            if (!isWorkflowEvent(parsed)) {
              console.error("Unexpected SSE event shape, skipping:", parsed);
              continue;
            }

            const event = parsed;

            if (event.type === "agent_start" && event.agent) {
              setActiveAgent(event.agent as AgentKey);
            } else if (event.type === "clarification" && event.questions?.length) {
              setClarificationQuestions(event.questions);
              setActiveAgent(null);
            } else if (
              event.type === "workflow_complete" ||
              event.type === "conversation_complete"
            ) {
              setActiveAgent(null);
              setClarificationQuestions([]);
              if (event.reports?.length) {
                setReportsReady(true);
                setReportsGenerated(event.reports);
              }

              try {
                const updated = await apiFetch<Message[]>(
                  `/api/projects/${projectId}/chat/messages`,
                  { accessToken }
                );
                if (!mountedRef.current) return;
                setMessages(updated);
                const lastMeta = updated[updated.length - 1]?.metadata;
                if (lastMeta?.reports_generated?.length) {
                  setReportsGenerated(lastMeta.reports_generated);
                }
              } catch (refreshErr) {
                console.error("Failed to refresh messages after completion", refreshErr);
                setErrorBanner(
                  "Workflow finished, but the latest messages couldn't be loaded. Refresh to see them."
                );
              }
            } else if (event.type === "error") {
              throw new Error(event.message || "The workflow reported an error.");
            }
          }
        }
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        console.error("sendMessage stream error", err);
        if (!mountedRef.current) return;

        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: "assistant",
            content: `Something went wrong: ${err.message || "Unknown error"}. Please try again.`,
            message_type: "text",
            created_at: new Date().toISOString(),
          },
        ]);
        setActiveAgent(null);
        setClarificationQuestions([]);
      } finally {
        sendingRef.current = false;
        if (mountedRef.current) setLoading(false);
      }
    },
    [accessToken, projectId]
  );

  const handleShare = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    } catch (err) {
      console.error("Failed to copy share link", err);
      setErrorBanner("Couldn't copy the share link to your clipboard.");
    }
  }, []);

  const completedAgents: string[] = reportsReady
    ? [...AGENT_ORDER]
    : activeAgent
    ? (() => {
        const idx = AGENT_ORDER.indexOf(activeAgent);
        return idx > 0 ? AGENT_ORDER.slice(0, idx) : [];
      })()
    : [];

  const activeAgentIndex = activeAgent ? AGENT_ORDER.indexOf(activeAgent) : -1;

  const progressPct = reportsReady
    ? 100
    : activeAgentIndex >= 0
    ? Math.round(((activeAgentIndex + 0.5) / AGENT_ORDER.length) * 100)
    : 0;

  const contextDesktopOpen = contextOpen;
  const sidebarWidth = sidebarCollapsed ? "md:w-[72px]" : "md:w-[240px]";

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#090B14] text-[#F7F8FC]">
      {/* Top Nav */}
      <header className="z-40 flex h-16 shrink-0 items-center justify-between border-b border-white/[0.08] bg-[#090B14]/80 px-4 backdrop-blur-md lg:px-6">
        <div className="flex min-w-0 items-center gap-4">
          <button
            aria-label="Toggle Sidebar"
            className="rounded-lg p-2 transition-colors hover:bg-white/5"
            onClick={() => {
              if (typeof window !== "undefined" && window.innerWidth < 768) {
                setSidebarOpenMobile((v) => !v);
              } else {
                setSidebarCollapsed((v) => !v);
              }
            }}
          >
            <span className="material-symbols-outlined">menu</span>
          </button>

          <div className="hidden min-w-0 items-center gap-3 text-sm sm:flex">
            <span className="text-[#7C869A]">Projects</span>
            <span className="material-symbols-outlined text-xs text-[#7C869A]">
              chevron_right
            </span>
            <span className="max-w-[120px] truncate font-medium md:max-w-none">
              {project?.title || "Loading..."}
            </span>
            <span className="ml-2 whitespace-nowrap rounded bg-[#AEC6FF]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#AEC6FF]">
              Stage:{" "}
              {activeAgent
                ? AGENT_META[activeAgent]?.short
                : reportsReady
                ? "Complete"
                : "Idle"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <div className="flex items-center">
            <button
              onClick={handleShare}
              className="hidden items-center gap-2 px-3 py-1.5 text-xs font-medium text-[#B4BCCB] transition-colors hover:text-[#F7F8FC] md:flex"
            >
              <span className="material-symbols-outlined text-lg">ios_share</span>
              {copiedShare ? "Copied!" : "Share"}
            </button>

            <Link
              href={reportsReady ? `/projects/${projectId}/reports` : "#"}
              className={`hidden items-center gap-2 rounded-lg border border-white/[0.08] bg-white/5 px-3 py-1.5 text-xs font-medium transition-colors sm:flex ${
                reportsReady
                  ? "hover:bg-white/10"
                  : "pointer-events-none opacity-40"
              }`}
            >
              <span className="material-symbols-outlined text-lg">download</span>
              Export
            </Link>
          </div>

          <div className="mx-1 hidden h-6 w-px bg-white/[0.08] sm:block" />

          <button
            className="rounded-lg p-2 text-[#B4BCCB] transition-colors hover:bg-white/5 hover:text-[#AEC6FF]"
            onClick={() => setContextOpen((v) => !v)}
            title="Context Panel"
            aria-label="Toggle context panel"
          >
            <span className="material-symbols-outlined">info</span>
          </button>

          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#AEC6FF]/40 bg-[#AEC6FF]/20 text-xs font-bold text-[#AEC6FF]">
            {(session?.user?.name || "U")
              .split(" ")
              .map((p: string) => p[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
        </div>
      </header>

      {errorBanner && (
        <div className="flex shrink-0 items-center justify-between border-b border-red-400/30 bg-red-400/10 px-4 py-2 text-xs text-red-300">
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">error</span>
            {errorBanner}
          </span>
          <button
            onClick={() => setErrorBanner(null)}
            className="text-red-300/70 hover:text-red-300"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      <div className="relative flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={[
            "group z-50 flex h-full shrink-0 flex-col overflow-hidden border-r border-white/[0.08] bg-[#090B14]",
            TRANSITION,
            "fixed left-0 top-16 md:top-16 bottom-10 md:bottom-0 md:h-[calc(100vh-4rem)]",
            "w-[240px] md:relative md:top-0 md:bottom-auto md:h-full",
            sidebarOpenMobile ? "translate-x-0" : "-translate-x-full md:translate-x-0",
            sidebarWidth,
          ].join(" ")}
        >
          <div className={`flex-1 space-y-8 overflow-y-auto p-4 ${CUSTOM_SCROLLBAR}`}>
            <div>
              <div
                className={`mb-4 flex items-center gap-2 px-2 ${
                  sidebarCollapsed ? "justify-center" : ""
                }`}
              >
                {!sidebarCollapsed ? (
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#7C869A]">
                    Workspace
                  </span>
                ) : (
                  <span className="material-symbols-outlined text-sm text-[#7C869A]">
                    grid_view
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <button
                  onClick={() => router.push("/dashboard")}
                  className="w-full rounded-lg border-r-2 border-[#AEC6FF] bg-[#508EFF]/10 px-3 py-2 text-[#AEC6FF] transition-all hover:bg-[#508EFF]/20"
                >
                  <div
                    className={`flex items-center gap-3 ${
                      sidebarCollapsed ? "justify-center" : ""
                    }`}
                  >
                    <span className="material-symbols-outlined text-xl">dashboard</span>
                    {!sidebarCollapsed && (
                      <span className="text-sm font-medium">Dashboard</span>
                    )}
                  </div>
                </button>

                <button
                  onClick={() => router.push("/dashboard")}
                  className="w-full rounded-lg px-3 py-2 text-[#7C869A] transition-all hover:bg-white/5 hover:text-[#F7F8FC]"
                >
                  <div
                    className={`flex items-center gap-3 ${
                      sidebarCollapsed ? "justify-center" : ""
                    }`}
                  >
                    <span className="material-symbols-outlined text-xl">folder_copy</span>
                    {!sidebarCollapsed && (
                      <span className="text-sm font-medium">Projects</span>
                    )}
                  </div>
                </button>

                <button className="w-full rounded-lg px-3 py-2 text-[#7C869A] transition-all hover:bg-white/5 hover:text-[#F7F8FC]">
                  <div
                    className={`flex items-center gap-3 ${
                      sidebarCollapsed ? "justify-center" : ""
                    }`}
                  >
                    <span className="material-symbols-outlined text-xl">bolt</span>
                    {!sidebarCollapsed && (
                      <span className="text-sm font-medium">AI Workspace</span>
                    )}
                  </div>
                </button>
              </div>
            </div>

            <div>
              <div
                className={`mb-4 flex items-center gap-2 px-2 ${
                  sidebarCollapsed ? "justify-center" : ""
                }`}
              >
                {!sidebarCollapsed ? (
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#7C869A]">
                    Workflow Stages
                  </span>
                ) : (
                  <span className="material-symbols-outlined text-sm text-[#7C869A]">
                    account_tree
                  </span>
                )}
              </div>

              <div className="space-y-1">
                {SIDEBAR_STAGES.map((stage) => {
                  const isDone = completedAgents.includes(stage.key) || reportsReady;
                  const isActive = activeAgent === stage.key;

                  return (
                    <div
                      key={stage.key}
                      className={`flex cursor-default items-center gap-3 px-3 py-2 ${
                        sidebarCollapsed ? "justify-center" : ""
                      } ${
                        isActive
                          ? "font-medium text-[#F7F8FC]"
                          : isDone
                          ? "text-[#B4BCCB]"
                          : "text-[#7C869A] opacity-50"
                      }`}
                    >
                      <div
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                          isActive
                            ? "bg-[#AEC6FF] ring-4 ring-[#AEC6FF]/20"
                            : isDone
                            ? "bg-emerald-400"
                            : "bg-[#7C869A]"
                        }`}
                      />
                      {!sidebarCollapsed && (
                        <span className="text-sm">{stage.label}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="border-t border-white/[0.08] p-4">
            <button
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/5 text-sm font-medium transition-all hover:bg-white/10"
              onClick={() => router.push("/dashboard")}
            >
              <span className="material-symbols-outlined text-xl">add</span>
              {!sidebarCollapsed && <span className="whitespace-nowrap">New Project</span>}
            </button>
          </div>
        </aside>

        {sidebarOpenMobile && (
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setSidebarOpenMobile(false)}
          />
        )}

        {/* Main */}
        <main className="relative flex min-w-0 flex-1 flex-col bg-[#0F1220]">
          <div
            className={`flex-1 space-y-12 overflow-y-auto px-4 py-8 pb-48 md:px-8 lg:px-12 ${CUSTOM_SCROLLBAR}`}
          >
            <div className="mx-auto max-w-4xl space-y-12">
              {messages.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/5 text-[#7C869A]">
                    <span className="material-symbols-outlined text-2xl">
                      chat_bubble
                    </span>
                  </div>
                  <h2 className="text-lg font-semibold">Describe your project idea</h2>
                  <p className="max-w-md text-sm text-[#B4BCCB]">
                    Explain what you want to build. Our AI agents will collaborate
                    to generate a PRD, Feasibility, ROI Model, and Roadmap.
                  </p>
                </div>
              )}

              {/* AI Status Banner */}
              {activeAgent && (
                <div className={`${GLASS_PANEL} relative overflow-hidden rounded-[1.25rem] p-6`}>
                  <div className="pointer-events-none absolute inset-0 animate-pulse bg-gradient-to-r from-[#AEC6FF]/5 to-transparent" />

                  <div className="relative mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-4">
                      <div className="flex -space-x-3">
                        {AGENT_ORDER.slice(
                          Math.max(activeAgentIndex - 1, 0),
                          activeAgentIndex + 2
                        ).map((a) => (
                          <div
                            key={a}
                            className={`flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#151A2B] ${AGENT_META[a].iconBg} ${AGENT_META[a].iconColor}`}
                          >
                            <span className="material-symbols-outlined text-xl">
                              {AGENT_META[a].icon}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div>
                        <h3 className="flex items-center gap-2 text-base font-semibold md:text-lg">
                          {Math.min(activeAgentIndex + 1, 3)} AI Agents Collaborating
                          <span className="flex gap-1">
                            <span className="h-1 w-1 rounded-full bg-[#AEC6FF] animate-pulse" />
                            <span className="h-1 w-1 rounded-full bg-[#AEC6FF] animate-pulse [animation-delay:200ms]" />
                            <span className="h-1 w-1 rounded-full bg-[#AEC6FF] animate-pulse [animation-delay:400ms]" />
                          </span>
                        </h3>
                        <p className="mt-1 text-xs text-[#7C869A]">
                          {AGENT_META[activeAgent]?.label}
                        </p>
                      </div>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-2xl font-bold text-[#AEC6FF]">
                        {progressPct}%
                      </span>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#7C869A]">
                        {reportsReady
                          ? "Workflow complete"
                          : `Step ${Math.max(activeAgentIndex + 1, 1)} of ${AGENT_ORDER.length}`}
                      </p>
                    </div>
                  </div>

                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#AEC6FF] to-[#6B5CFF] transition-all duration-1000"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div className="space-y-8">
                <AnimatePresence initial={false}>
                  {messages.map((msg) => {
                    const isUser = msg.role === "user";
                    const agentMeta = msg.metadata?.agent
                      ? AGENT_META[msg.metadata.agent as AgentKey]
                      : null;

                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ type: "spring", damping: 30, stiffness: 400 }}
                        className={isUser ? "flex justify-end pl-12" : "flex gap-4 pr-12"}
                      >
                        {isUser ? (
                          <div className="max-w-2xl rounded-2xl rounded-tr-none border border-[#AEC6FF]/20 bg-[#AEC6FF]/10 p-5 shadow-lg">
                            <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#F7F8FC] md:text-base">
                              {msg.content}
                            </p>
                          </div>
                        ) : (
                          <>
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-[#151A2B] shadow-inner">
                              <span
                                className={`material-symbols-outlined text-2xl ${
                                  agentMeta?.iconColor || "text-[#AEC6FF]"
                                }`}
                                style={{ fontVariationSettings: "'FILL' 1" }}
                              >
                                {agentMeta?.icon || "robot_2"}
                              </span>
                            </div>

                            <div className="min-w-0 flex-1 space-y-6">
                              <div className="rounded-2xl rounded-tl-none border border-white/[0.08] bg-[#151A2B] p-5 shadow-sm transition-colors hover:bg-[#1B2136]">
                                {agentMeta && (
                                  <div className="mb-4 flex items-center gap-2">
                                    <span
                                      className={`text-[10px] font-bold uppercase tracking-widest ${agentMeta.iconColor}`}
                                    >
                                      {agentMeta.short}
                                    </span>
                                    <span className="h-1 w-1 rounded-full bg-[#7C869A]" />
                                    <span className="flex items-center gap-1 text-xs text-emerald-400">
                                      <span className="material-symbols-outlined text-xs">
                                        check_circle
                                      </span>
                                      Validated
                                    </span>
                                  </div>
                                )}

                                <p className="mb-6 whitespace-pre-wrap text-sm leading-relaxed text-[#B4BCCB] md:text-base">
                                  {msg.content}
                                </p>

                                {!!msg.metadata?.reports_generated?.length && (
                                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    {msg.metadata.reports_generated.map((r) => (
                                      <Link
                                        key={r}
                                        href={`/projects/${projectId}/reports`}
                                        className="group flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/5 p-4 transition-all hover:border-[#AEC6FF]/50"
                                      >
                                        <div className="flex items-center gap-3">
                                          <span className="material-symbols-outlined text-emerald-400">
                                            task_alt
                                          </span>
                                          <span className="text-xs font-medium">
                                            {r.toUpperCase()}
                                          </span>
                                        </div>
                                        <span className="material-symbols-outlined text-sm text-[#7C869A] transition-colors group-hover:text-[#AEC6FF]">
                                          open_in_new
                                        </span>
                                      </Link>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {clarificationQuestions.length > 0 && (
                  <div className="pl-0 sm:pl-14">
                    <WorkspaceClarificationPanel
                      questions={clarificationQuestions}
                      onSubmit={(combinedAnswer) => {
                        sendMessage(combinedAnswer, { keepClarificationVisible: true });
                      }}
                      loading={loading}
                    />
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>
          </div>

          {/* Composer */}
          <div className="pointer-events-none absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#0F1220] via-[#0F1220]/95 to-transparent p-4 md:p-8">
            <div className="pointer-events-auto mx-auto max-w-4xl">
              <div className={`${GLASS_PANEL} flex items-center gap-2 rounded-2xl p-2 shadow-2xl`}>
                <button
                  type="button"
                  className="shrink-0 p-3 text-[#7C869A] transition-colors hover:text-[#F7F8FC]"
                  aria-label="Attach file"
                >
                  <span className="material-symbols-outlined">attach_file</span>
                </button>

                <input
                  className="min-w-0 flex-1 border-none bg-transparent py-3 text-sm text-[#F7F8FC] placeholder:text-[#7C869A] focus:ring-0 md:text-base"
                  placeholder="Type @ to mention an agent or ask a question..."
                  type="text"
                  value={input}
                  disabled={loading}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(input);
                    }
                  }}
                />

                <div className="flex shrink-0 items-center gap-1 px-2">
                  <button
                    type="button"
                    className="hidden p-2 text-[#7C869A] transition-colors hover:text-[#F7F8FC] sm:block"
                    aria-label="Voice input"
                  >
                    <span className="material-symbols-outlined">mic</span>
                  </button>

                  <button
                    type="button"
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#AEC6FF] text-[#090B14] shadow-lg shadow-[#AEC6FF]/20 transition-transform hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 md:h-12 md:w-12"
                    onClick={() => sendMessage(input)}
                    disabled={loading || !input.trim()}
                    aria-label="Send message"
                  >
                    <span className="material-symbols-outlined">send</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Context panel */}
        <aside
          className={[
            "z-50 flex h-full shrink-0 flex-col overflow-hidden bg-[#090B14]",
            TRANSITION,
            "fixed right-0 top-0 lg:relative",
            contextOpen
              ? "w-80 translate-x-0 border-l border-white/[0.08]"
              : "pointer-events-none w-0 translate-x-full border-l-0 lg:pointer-events-auto lg:translate-x-0",
            contextDesktopOpen ? "lg:w-80 lg:border-l lg:border-white/[0.08]" : "lg:w-0 lg:border-l-0",
          ].join(" ")}
        >
          <div className="flex items-center justify-between border-b border-white/[0.08] p-6 lg:hidden">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#F7F8FC]">
              Context
            </h4>
            <button
              className="rounded-lg p-2 hover:bg-white/5"
              onClick={() => setContextOpen(false)}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className={`flex-1 space-y-10 overflow-y-auto p-6 ${CUSTOM_SCROLLBAR}`}>
            <div>
              <h4 className="mb-6 text-[10px] font-bold uppercase tracking-widest text-[#7C869A]">
                Project Context
              </h4>

              <div className={`${GLASS_PANEL} space-y-6 rounded-2xl p-5`}>
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase text-[#7C869A]">
                    Objective
                  </label>
                  <p className="text-xs leading-relaxed text-[#B4BCCB]">
                    {project?.objective || project?.title || "No objective set yet."}
                  </p>
                </div>

                <div className="flex gap-4 border-t border-white/5 pt-4">
                  <div className="flex-1">
                    <label className="mb-1 block text-[10px] font-bold uppercase text-[#7C869A]">
                      Priority
                    </label>
                    <span className="text-xs font-semibold text-red-400">
                      {project?.priority || "—"}
                    </span>
                  </div>

                  <div className="flex-1">
                    <label className="mb-1 block text-[10px] font-bold uppercase text-[#7C869A]">
                      Target
                    </label>
                    <span className="text-xs font-semibold text-[#AEC6FF]">
                      {project?.target || "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="mb-6 flex items-center justify-between">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#7C869A]">
                  Active Memory
                </h4>
                <span className="cursor-pointer text-[10px] text-[#AEC6FF] hover:underline">
                  View all
                </span>
              </div>

              <div className="space-y-3">
                {project?.memory?.length ? (
                  project.memory.map((item) => {
                    const tone = getMemoryTone(item.color);

                    return (
                      <div
                        key={item.id}
                        className="group flex cursor-pointer items-center gap-3 rounded-xl border border-white/[0.08] bg-white/5 p-3 transition-all hover:bg-white/10"
                      >
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-lg ${tone.bg} ${tone.text}`}
                        >
                          <span className="material-symbols-outlined text-xl">
                            {item.icon}
                          </span>
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <p className="truncate text-xs font-medium">{item.name}</p>
                          <p className="mt-0.5 text-[10px] text-[#7C869A]">
                            {item.detail}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-[#7C869A]">
                    No context files or memories synced yet.
                  </p>
                )}
              </div>
            </div>

            <div>
              <h4 className="mb-6 text-[10px] font-bold uppercase tracking-widest text-[#7C869A]">
                Recent Activity
              </h4>

              <div className="relative space-y-6">
                <div className="absolute bottom-0 left-[11px] top-2 w-px bg-white/[0.08]" />

                {AGENT_ORDER.filter((a) => completedAgents.includes(a) || a === activeAgent).map(
                  (a) => {
                    const isActive = a === activeAgent;

                    return (
                      <div key={a} className="relative flex gap-4">
                        <div
                          className={`z-10 flex h-6 w-6 items-center justify-center rounded-full border-4 border-[#090B14] ${
                            isActive ? "bg-[#AEC6FF]" : "bg-emerald-400"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[10px] text-white">
                            {isActive ? "edit" : "check"}
                          </span>
                        </div>

                        <div>
                          <p className="text-xs text-[#F7F8FC]">
                            {AGENT_META[a]?.short || a}
                          </p>
                          <p className="mt-0.5 text-[10px] text-[#7C869A]">
                            {isActive ? "In progress" : "Complete"}
                          </p>
                        </div>
                      </div>
                    );
                  }
                )}

                {completedAgents.length === 0 && !activeAgent && (
                  <div className="relative flex gap-4 opacity-50">
                    <div className="z-10 flex h-6 w-6 items-center justify-center rounded-full border-4 border-[#090B14] bg-white/[0.08]">
                      <div className="h-1.5 w-1.5 rounded-full bg-[#7C869A]" />
                    </div>
                    <div>
                      <p className="text-xs text-[#7C869A]">Project Init</p>
                      <p className="mt-0.5 text-[10px] text-[#7C869A]">
                        Send a message to start
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>

        {contextOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setContextOpen(false)}
          />
        )}
      </div>

      {/* Footer */}
      <footer className="relative z-40 flex h-10 shrink-0 items-center justify-between border-t border-white/[0.08] bg-[#090B14] px-6">
        <p className="text-[9px] font-medium uppercase tracking-tighter text-[#7C869A]">
          © {new Date().getFullYear()} ProjectPilot AI • Secure Enterprise
        </p>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase text-emerald-400">
            <span className="h-1 w-1 animate-pulse rounded-full bg-emerald-400" />
            Operational
          </div>
        </div>
      </footer>
    </div>
  );
}