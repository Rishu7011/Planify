"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { apiFetch, apiStream } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

import "./workspace.css";
import AgentTimeline from "@/components/workspace/AgentTimeline";
import RightPanel from "@/components/workspace/RightPanel";
import { WorkspaceClarificationPanel } from "@/components/workspace/WorkspaceClarificationPanel";
import ChatInput from "@/components/workspace/ChatInput";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  message_type: string;
  created_at: string;
  metadata?: Record<string, any>;
}

interface WorkflowEvent {
  type:
    | "agent_start"
    | "agent_complete"
    | "clarification"
    | "workflow_complete"
    | "error";
  agent?: string;
  questions?: string[];
  status?: string;
  reports?: string[];
  message?: string;
}

const AGENT_ORDER = [
  "input_understanding",
  "clarification",
  "prd",
  "feasibility",
  "roi",
  "roadmap",
  "final_report",
];

const AGENT_LABELS: Record<string, string> = {
  input_understanding: "Understanding your idea...",
  clarification: "Checking for missing context...",
  prd: "Writing Product Requirements Document...",
  feasibility: "Assessing technical feasibility...",
  roi: "Financial modeling & ROI analysis...",
  roadmap: "Building project execution roadmap...",
  final_report: "Assembling final report bundle...",
};

export default function ChatPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { data: session } = useSession();
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [clarificationQuestions, setClarificationQuestions] = useState<string[]>([]);
  const [reportsReady, setReportsReady] = useState(false);
  const [reportsGenerated, setReportsGenerated] = useState<string[]>([]);
  const [project, setProject] = useState<{ title: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const accessToken = (session?.user as any)?.accessToken;

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeAgent, clarificationQuestions]);

  // Load project details and messages
  useEffect(() => {
    if (!session || !accessToken) return;

    const fetchProject = async () => {
      try {
        const p = await apiFetch<any>(`/api/projects/${projectId}`, { accessToken });
        setProject({ title: p.title });
      } catch {}
    };

    const fetchMessages = async () => {
      try {
        const data = await apiFetch<Message[]>(
          `/api/projects/${projectId}/chat/messages`,
          { accessToken }
        );
        setMessages(data);
        const lastMsg = data[data.length - 1];
        if (lastMsg?.metadata?.reports_generated?.length) {
          setReportsReady(true);
          setReportsGenerated(lastMsg.metadata.reports_generated);
        }
      } catch {}
    };

    fetchProject();
    fetchMessages();
  }, [session, accessToken, projectId]);

  // Send message implementation matching backend workflow SSE stream
  const sendMessage = async (content: string) => {
    if (!content.trim() || loading || !accessToken) return;

    const tempId = `temp-${Date.now()}`;
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
    setActiveAgent("input_understanding");
    setClarificationQuestions([]);

    try {
      const res = await apiStream(
        `/api/projects/${projectId}/chat/messages`,
        { content },
        accessToken
      );

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          try {
            const event: WorkflowEvent = JSON.parse(line.slice(5).trim());

            if (event.type === "agent_start" && event.agent) {
              setActiveAgent(event.agent);
            } else if (event.type === "clarification" && event.questions?.length) {
              setClarificationQuestions(event.questions);
              setActiveAgent(null);
            } else if (event.type === "workflow_complete") {
              setActiveAgent(null);
              if (event.reports?.length) {
                setReportsReady(true);
                setReportsGenerated(event.reports);
              }
              const updated = await apiFetch<Message[]>(
                `/api/projects/${projectId}/chat/messages`,
                { accessToken }
              );
              setMessages(updated);
              if (updated[updated.length - 1]?.metadata?.reports_generated?.length) {
                setReportsGenerated(updated[updated.length - 1].metadata!.reports_generated);
              }
            } else if (event.type === "error") {
              throw new Error(event.message);
            }
          } catch {}
        }
      }
    } catch (err: any) {
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
    } finally {
      setLoading(false);
    }
  };

  // Determine completed agents
  const completedAgents = reportsReady
    ? AGENT_ORDER
    : activeAgent
    ? AGENT_ORDER.slice(0, AGENT_ORDER.indexOf(activeAgent))
    : [];

  return (
    <div className="w-shell">
      {/* Topbar */}
      <header className="w-topbar">
        <span className="w-brand-mark" aria-hidden>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 18V6l8 6 8-6v12" />
            <path d="M4 18h16" />
          </svg>
        </span>
        <nav className="w-breadcrumb" aria-label="Breadcrumb">
          <Link href="/dashboard">Dashboard</Link>
          <span className="w-breadcrumb-sep">/</span>
          <strong>{project?.title || "Loading..."}</strong>
        </nav>

        {reportsReady && (
          <Link
            href={`/projects/${projectId}/reports`}
            className="w-btn w-btn-primary"
            style={{ height: 32 }}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
              <path d="M14 3v5h5" />
              <path d="M9 12h6M9 16h4" />
            </svg>
            View reports
          </Link>
        )}
      </header>

      {/* Main body */}
      <div className="w-body">
        {/* Left Side: Agent Timeline & Flow */}
        <aside className="w-left">
          <AgentTimeline activeAgent={activeAgent} completedAgents={completedAgents} />
        </aside>

        {/* Center Side: Chat area */}
        <main className="w-center">
          <div className="w-messages">
            {messages.length === 0 && !loading && (
              <div className="w-empty">
                <div className="w-empty-icon">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <h2>Describe your project idea</h2>
                <p>
                  Explain what you want to build. Our AI agents will collaborate to generate
                  a PRD, Feasibility, ROI Model, and Roadmap.
                </p>
              </div>
            )}

            <AnimatePresence initial={false}>
              {messages.map((msg) => {
                const isUser = msg.role === "user";
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", damping: 30, stiffness: 400 }}
                    className={`w-msg-row ${isUser ? "user" : "assistant"}`}
                  >
                    <span className={`w-msg-avatar ${isUser ? "user-avatar" : "ai-avatar"}`}>
                      {isUser ? "U" : "AI"}
                    </span>
                    <div className={`w-bubble ${isUser ? "user" : "ai"}`}>
                      <div style={{ whiteSpace: "pre-wrap" }}>{msg.content}</div>

                      {msg.metadata?.reports_generated?.length > 0 && (
                        <div className="w-report-chips">
                          {msg.metadata?.reports_generated?.map((r: string) => (
                            <span key={r} className="w-report-chip">
                              <svg
                                width="10"
                                height="10"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="m5 12 5 5L20 7" />
                              </svg>
                              {r.toUpperCase()}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="w-bubble-time">
                        {new Date(msg.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Clarification panel injection */}
            {clarificationQuestions.length > 0 && (
              <div style={{ paddingLeft: 38 }}>
                <WorkspaceClarificationPanel
                  questions={clarificationQuestions}
                  onSubmit={(combinedAnswer) => {
                    setClarificationQuestions([]);
                    sendMessage(combinedAnswer);
                  }}
                  loading={loading}
                />
              </div>
            )}

            {/* AI thinking status bubble */}
            {activeAgent && (
              <div className="w-thinking">
                <span className="w-msg-avatar ai-avatar">AI</span>
                <div className="w-thinking-bubble">
                  <div className="w-thinking-dots">
                    <span className="w-thinking-dot" />
                    <span className="w-thinking-dot" />
                    <span className="w-thinking-dot" />
                  </div>
                  <span className="w-thinking-label">
                    {AGENT_LABELS[activeAgent] || `Running ${activeAgent}...`}{" "}
                    <span className="w-thinking-agent">({activeAgent})</span>
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Bottom input area */}
          <ChatInput
            value={input}
            onChange={setInput}
            onSubmit={() => sendMessage(input)}
            disabled={loading}
          />
        </main>

        {/* Right Side: Context / Memory / Reports tabs */}
        <aside className="w-right">
          <RightPanel
            projectTitle={project?.title}
            reportsReady={reportsReady}
            reportsGenerated={reportsGenerated}
            projectId={projectId}
          />
        </aside>
      </div>
    </div>
  );
}
