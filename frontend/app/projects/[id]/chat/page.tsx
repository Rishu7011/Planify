"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ClarificationPanel } from "@/components/ClarificationPanel";
import { apiFetch, apiStream } from "@/lib/api";

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

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} group`}>
      {!isUser && (
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center flex-shrink-0 mr-3 mt-1">
          <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
      )}
      <div
        className={`max-w-[75%] rounded-2xl px-5 py-3.5 ${
          isUser
            ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-tr-sm"
            : "bg-slate-800/80 border border-white/5 text-slate-100 rounded-tl-sm"
        }`}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
        {msg.metadata?.reports_generated?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {msg.metadata?.reports_generated?.map((r: string) => (
              <span key={r} className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1 text-xs text-emerald-400">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {r.toUpperCase()}
              </span>
            ))}
          </div>
        )}
        <p className="text-xs mt-2 opacity-40">
          {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}

function AgentStatusBar({ agent }: { agent: string }) {
  const labels: Record<string, string> = {
    input_understanding: "Understanding your idea...",
    clarification: "Checking for missing context...",
    prd: "Writing Product Requirements Document...",
    feasibility: "Assessing technical feasibility...",
    roi: "Modeling financials & ROI...",
    roadmap: "Building project roadmap...",
    final_report: "Assembling final report bundle...",
  };
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-3 rounded-2xl rounded-tl-sm bg-slate-800/80 border border-white/5 px-5 py-3.5 max-w-sm">
        <div className="flex gap-1">
          <span className="h-2 w-2 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="h-2 w-2 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
        <span className="text-sm text-slate-400">{labels[agent] || `Running ${agent}...`}</span>
      </div>
    </div>
  );
}

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
  const [project, setProject] = useState<{ title: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const accessToken = (session?.user as any)?.accessToken;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeAgent]);

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
        // Check if reports already exist
        const lastMsg = data[data.length - 1];
        if (lastMsg?.metadata?.reports_generated?.length) setReportsReady(true);
      } catch {}
    };

    fetchProject();
    fetchMessages();
  }, [session, accessToken, projectId]);

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

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

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
              if (event.reports?.length) setReportsReady(true);
              // Refresh messages to get the assistant response
              const updated = await apiFetch<Message[]>(
                `/api/projects/${projectId}/chat/messages`,
                { accessToken }
              );
              setMessages(updated);
            } else if (event.type === "error") {
              throw new Error(event.message);
            }
          } catch (parseErr) {
            // Non-JSON lines (keep-alive etc.) — skip
          }
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-white/5 px-6 py-4 bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Dashboard
          </Link>
          <span className="text-slate-600">/</span>
          <h1 className="font-semibold text-white truncate max-w-xs">
            {project?.title || "Loading..."}
          </h1>
        </div>

        {reportsReady && (
          <Link
            href={`/projects/${projectId}/reports`}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-violet-500/40"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            View Reports
          </Link>
        )}
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6">
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-center py-20">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/20 flex items-center justify-center mb-5">
              <svg className="h-8 w-8 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Describe your project idea</h2>
            <p className="text-slate-400 max-w-md text-sm leading-relaxed">
              Tell me what you want to build. Be as detailed as you like — domain, problem, budget, team, timeline.
              I'll generate a complete PRD, feasibility study, ROI model, and roadmap.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id}>
            <MessageBubble msg={msg} />
            {/* If this was an assistant clarification message, show the panel */}
            {msg.role === "assistant" &&
              msg.message_type === "text" &&
              clarificationQuestions.length > 0 &&
              msg.id === messages[messages.length - 1]?.id && (
                <div className="ml-11">
                  <ClarificationPanel
                    questions={clarificationQuestions}
                    onSubmit={(combinedAnswer) => {
                      setClarificationQuestions([]);
                      sendMessage(combinedAnswer);
                    }}
                    loading={loading}
                  />
                </div>
              )}
          </div>
        ))}

        {/* Inline clarification for new sessions */}
        {clarificationQuestions.length > 0 && messages.length > 0 &&
          messages[messages.length - 1]?.role === "user" && (
            <ClarificationPanel
              questions={clarificationQuestions}
              onSubmit={(combinedAnswer) => {
                setClarificationQuestions([]);
                sendMessage(combinedAnswer);
              }}
              loading={loading}
            />
          )}

        {activeAgent && <AgentStatusBar agent={activeAgent} />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl px-6 py-5">
        <form onSubmit={handleSubmit} className="flex items-end gap-3 max-w-4xl mx-auto">
          <textarea
            ref={textareaRef}
            id="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your project idea... (Enter to send, Shift+Enter for new line)"
            disabled={loading}
            rows={1}
            className="flex-1 resize-none rounded-xl border border-white/10 bg-slate-800/60 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-colors disabled:opacity-50 max-h-40 overflow-y-auto"
            style={{ minHeight: "48px" }}
          />
          <button
            id="send-btn"
            type="submit"
            disabled={loading || !input.trim()}
            className="flex-shrink-0 h-12 w-12 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 flex items-center justify-center text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:shadow-lg hover:shadow-violet-500/30 active:scale-95"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
        <p className="text-center text-xs text-slate-600 mt-3">
          AI-generated reports · Always review before using
        </p>
      </div>
    </div>
  );
}
