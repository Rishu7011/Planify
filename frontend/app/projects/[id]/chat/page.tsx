"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { apiFetch, apiStream, apiUpload, formatApiError, isApiError } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { WorkspaceClarificationPanel } from "@/components/workspace/WorkspaceClarificationPanel";
import { DiscoveryOptionsPanel } from "@/components/workspace/DiscoveryOptionsPanel";
import { ChatMessage } from "@/components/workspace/chat/ChatMessage";
import {
  ChatComposer,
  type PendingAttachment,
} from "@/components/workspace/chat/ChatComposer";
import { ThinkingIndicator } from "@/components/workspace/chat/ThinkingIndicator";
import { ScrollToBottomButton } from "@/components/workspace/chat/ScrollToBottomButton";
import {
  GLASS_PANEL,
  CUSTOM_SCROLLBAR,
  TRANSITION,
  FADE_UP,
} from "@/components/workspace/chat/constants";
import {
  AGENT_ORDER,
  AGENT_META,
  SIDEBAR_STAGES,
  getAgentMeta,
  isAgentKey,
  type AgentKey,
} from "@/components/workspace/chat/agents";
import { useChatScroll } from "@/hooks/useChatScroll";

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
  attachments?: {
    file_id: string;
    filename: string;
    content_type?: string | null;
    size_bytes?: number;
  }[];
}

interface ChatHistoryResponse {
  messages: Message[];
  pending_discovery?: { question: string; options: string[] } | null;
}

interface MemoryItem {
  id: string;
  name: string;
  detail: string;
  icon: string;
  color: string;
}

type WorkflowEventType =
  | "stream_start"
  | "message_start"
  | "content_delta"
  | "agent_start"
  | "agent_complete"
  | "clarification"
  | "discovery_question"
  | "discovery_turn_complete"
  | "discovery_complete"
  | "workflow_complete"
  | "conversation_complete"
  | "cancelled"
  | "error";

interface WorkflowEvent {
  type: WorkflowEventType;
  agent?: string;
  questions?: string[];
  question?: string;
  options?: string[];
  status?: string;
  reports?: string[];
  message?: string;
  acknowledgment?: string;
  delta?: string;
}

function isWorkflowEvent(value: unknown): value is WorkflowEvent {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return typeof v.type === "string";
}

// ---------------------------------------------------------------------------
// Static config — see @/components/workspace/chat/agents.ts
// ---------------------------------------------------------------------------

function getMemoryTone(color?: string) {
  const tones: Record<string, { bg: string; text: string }> = {
    primary: { bg: "bg-[oklch(0.75_0.12_190)]/20", text: "text-[oklch(0.75_0.12_190)]" },
    "purple-400": { bg: "bg-[oklch(0.55_0.09_195)]/20", text: "text-[oklch(0.55_0.09_195)]" },
    "blue-400": { bg: "bg-[oklch(0.75_0.12_190)]/20", text: "text-[oklch(0.75_0.12_190)]" },
    "amber-400": { bg: "bg-amber-500/20", text: "text-amber-400" },
    "emerald-400": { bg: "bg-emerald-500/20", text: "text-emerald-400" },
    success: { bg: "bg-emerald-500/20", text: "text-emerald-400" },
  };

  return tones[color || ""] || { bg: "bg-white/10", text: "text-[#B4BCCB]" };
}

// ---------------------------------------------------------------------------
// Streaming assistant placeholder (ChatGPT-style live response)
// ---------------------------------------------------------------------------

const STREAMING_MSG_ID = "__streaming__";

function createStreamingMessage(agent?: string): Message {
  return {
    id: STREAMING_MSG_ID,
    role: "assistant",
    content: "",
    message_type: "text",
    created_at: new Date().toISOString(),
    metadata: agent ? { agent, streaming: true } : { streaming: true },
  };
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
  const [streaming, setStreaming] = useState(false);
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [clarificationQuestions, setClarificationQuestions] = useState<string[]>([]);
  const [discoveryQuestion, setDiscoveryQuestion] = useState<{
    question: string;
    options: string[];
  } | null>(null);
  const [discoveryAcknowledgment, setDiscoveryAcknowledgment] = useState<string | null>(null);
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
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpenMobile, setSidebarOpenMobile] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);

  const accessToken = session?.user?.accessToken;

  const activeAgentMeta = activeAgent ? getAgentMeta(activeAgent) : null;

  const thinkingLabel =
    activeAgentMeta?.label ?? (loading ? "Thinking" : undefined);

  const { scrollRef, bottomRef, showScrollButton, scrollToBottom } = useChatScroll([
    messages,
    loading,
    streaming,
    activeAgent,
    clarificationQuestions,
    discoveryQuestion,
  ]);

  const sendingRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const streamGenRef = useRef(0);
  const mountedRef = useRef(true);

  const applyChatHistory = useCallback((data: ChatHistoryResponse) => {
    setMessages((prev) => {
      const streamingMsg = prev.find((m) => m.id === STREAMING_MSG_ID);
      if (sendingRef.current && streamingMsg) {
        return [...data.messages, streamingMsg];
      }
      return data.messages;
    });
    if (data.pending_discovery?.question) {
      setDiscoveryQuestion({
        question: data.pending_discovery.question,
        options: data.pending_discovery.options ?? [],
      });
      const pendingQ = data.pending_discovery.question.toLowerCase();
      const ackMsg = [...data.messages]
        .reverse()
        .find(
          (m) =>
            m.role === "assistant" &&
            m.message_type === "discovery" &&
            m.content?.trim() &&
            !m.content.toLowerCase().includes(pendingQ) &&
            !m.content.includes("• ")
        );
      setDiscoveryAcknowledgment(ackMsg?.content?.trim() || null);
    } else if (!sendingRef.current) {
      // Don't wipe an in-flight discovery panel while the SSE stream is still open.
      setDiscoveryQuestion(null);
      setDiscoveryAcknowledgment(null);
    }
    const lastMsg = data.messages[data.messages.length - 1];
    if (lastMsg?.metadata?.reports_generated?.length) {
      setReportsReady(true);
      setReportsGenerated(lastMsg.metadata.reports_generated);
    }
  }, []);

  const refreshMessages = useCallback(
    async (retries = 2): Promise<ChatHistoryResponse | null> => {
      if (!accessToken) return null;

      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const data = await apiFetch<ChatHistoryResponse>(
            `/api/projects/${projectId}/chat/messages?limit=100`,
            { accessToken }
          );
          if (!mountedRef.current) return data;
          applyChatHistory(data);
          return data;
        } catch (refreshErr) {
          console.error(`Failed to refresh messages (attempt ${attempt + 1})`, refreshErr);
          if (attempt < retries) {
            await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
          }
        }
      }
      return null;
    },
    [accessToken, projectId, applyChatHistory]
  );

  const refreshProject = useCallback(async () => {
    if (!accessToken) return;
    try {
      const p = await apiFetch<{
        title: string;
        objective?: string;
        priority?: string;
        target?: string;
        memory?: MemoryItem[];
      }>(`/api/projects/${projectId}`, { accessToken });
      if (!mountedRef.current) return;
      setProject({
        title: p.title,
        objective: p.objective,
        priority: p.priority,
        target: p.target,
        memory: p.memory,
      });
    } catch (err) {
      console.error("Failed to refresh project context", err);
    }
  }, [accessToken, projectId]);

  const ensureStreamingMessage = useCallback((agent?: string) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === STREAMING_MSG_ID)) return prev;
      return [...prev, createStreamingMessage(agent)];
    });
    setStreaming(true);
  }, []);

  const appendContentDelta = useCallback((delta: string) => {
    if (!delta) return;
    setMessages((prev) => {
      const hasStreaming = prev.some((m) => m.id === STREAMING_MSG_ID);
      const base = hasStreaming ? prev : [...prev, createStreamingMessage()];
      return base.map((m) =>
        m.id === STREAMING_MSG_ID ? { ...m, content: m.content + delta } : m
      );
    });
    setStreaming(true);
  }, []);

  const removeStreamingMessage = useCallback(() => {
    setMessages((prev) => prev.filter((m) => m.id !== STREAMING_MSG_ID));
    setStreaming(false);
  }, []);

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    removeStreamingMessage();
    sendingRef.current = false;
    setLoading(false);
    setActiveAgent(null);
  }, [removeStreamingMessage]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("planify-sidebar-collapsed");
      if (saved === "true") setSidebarCollapsed(true);
    } catch {
      /* ignore */
    }
  }, []);

  // Pick up refine prompts from the reports workspace
  useEffect(() => {
    try {
      const key = `planify-pending-prompt-${projectId}`;
      const pending = sessionStorage.getItem(key);
      if (pending?.trim()) {
        sessionStorage.removeItem(key);
        setInput(pending.trim());
      }
    } catch {
      /* ignore */
    }
  }, [projectId]);

  useEffect(() => {
    try {
      localStorage.setItem("planify-sidebar-collapsed", String(sidebarCollapsed));
    } catch {
      /* ignore */
    }
  }, [sidebarCollapsed]);

  useEffect(() => {
    if (!session) return;
    if (!accessToken) {
      setErrorBanner(
        "Missing backend access token. Ensure NEXTAUTH_SECRET matches backend JWT_SECRET, then sign in again."
      );
      return;
    }

    const fetchProject = async () => {
      try {
        const p = await apiFetch<{
          title: string;
          objective?: string;
          priority?: string;
          target?: string;
          memory?: MemoryItem[];
        }>(`/api/projects/${projectId}`, { accessToken });
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
        if (mountedRef.current) {
          setErrorBanner(
            formatApiError(err, "Couldn't load project details.")
          );
        }
      }
    };

    const fetchMessages = async () => {
      try {
        const data = await apiFetch<ChatHistoryResponse>(
          `/api/projects/${projectId}/chat/messages?limit=100`,
          { accessToken }
        );
        if (!mountedRef.current) return;
        applyChatHistory(data);
      } catch (err) {
        console.error("Failed to load messages", err);
        if (mountedRef.current) {
          setErrorBanner(formatApiError(err, "Couldn't load chat history."));
        }
      }
    };

    fetchProject();
    fetchMessages();
  }, [session, accessToken, projectId, applyChatHistory]);

  const sendMessage = useCallback(
    async (
      content: string,
      opts?: {
        keepClarificationVisible?: boolean;
        keepDiscoveryVisible?: boolean;
        /** When false, ignore composer file chips (discovery/clarification answers). Default true. */
        includeAttachments?: boolean;
      }
    ) => {
      if (!accessToken) return;
      const trimmed = content.trim();
      const filesToSend =
        opts?.includeAttachments === false ? [] : [...pendingAttachments];
      if (!trimmed && filesToSend.length === 0) return;

      // Interrupt any in-flight generation (ChatGPT-style).
      if (sendingRef.current) {
        abortRef.current?.abort();
        // Give the backend a moment to mark the prior run cancelled before we POST again.
        await new Promise((r) => setTimeout(r, 350));
      }

      const streamGen = ++streamGenRef.current;
      sendingRef.current = true;
      setErrorBanner(null);

      const controller = new AbortController();
      abortRef.current = controller;

      const tempId =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      const optimisticAttachments = filesToSend.map((a) => ({
        file_id: a.localId,
        filename: a.file.name,
        content_type: a.file.type,
        size_bytes: a.file.size,
      }));

      const userMsg: Message = {
        id: tempId,
        role: "user",
        content: trimmed || (filesToSend.length
          ? `[Attached: ${filesToSend.map((f) => f.file.name).join(", ")}]`
          : ""),
        message_type: "text",
        created_at: new Date().toISOString(),
        attachments: optimisticAttachments,
      };

      setMessages((prev) => [
        ...prev.filter((m) => m.id !== STREAMING_MSG_ID),
        userMsg,
      ]);
      setInput("");
      setPendingAttachments([]);
      setLoading(true);
      setStreaming(false);
      if (!opts?.keepClarificationVisible) {
        setClarificationQuestions([]);
      }
      if (!opts?.keepDiscoveryVisible) {
        setDiscoveryQuestion(null);
        setDiscoveryAcknowledgment(null);
      }

      let receivedEvent = false;
      let fileIds: string[] = [];

      try {
        if (filesToSend.length) {
          setUploadingFiles(true);
          const uploaded = await Promise.all(
            filesToSend.map((a) =>
              apiUpload<{ file_id: string }>(
                `/api/projects/${projectId}/files`,
                a.file,
                accessToken
              )
            )
          );
          fileIds = uploaded.map((u) => u.file_id);
          // Swap optimistic local ids for real file ids in the bubble
          setMessages((prev) =>
            prev.map((m) =>
              m.id === tempId
                ? {
                    ...m,
                    attachments: filesToSend.map((a, i) => ({
                      file_id: fileIds[i],
                      filename: a.file.name,
                      content_type: a.file.type,
                      size_bytes: a.file.size,
                    })),
                  }
                : m
            )
          );
        }
      } catch (uploadErr) {
        console.error("File upload failed", uploadErr);
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        setPendingAttachments(filesToSend);
        setInput(trimmed);
        setErrorBanner(formatApiError(uploadErr, "File upload failed."));
        sendingRef.current = false;
        setLoading(false);
        setUploadingFiles(false);
        return;
      } finally {
        setUploadingFiles(false);
      }

      const handleEvent = async (event: WorkflowEvent) => {
        if (streamGen !== streamGenRef.current) return;

        receivedEvent = true;

        if (event.type === "message_start") {
          ensureStreamingMessage(event.agent);
        } else if (event.type === "content_delta" && event.delta) {
          appendContentDelta(event.delta);
        } else if (event.type === "agent_start" && event.agent) {
          setDiscoveryQuestion(null);
          setDiscoveryAcknowledgment(null);
          setActiveAgent(event.agent);
          ensureStreamingMessage(event.agent);
        } else if (event.type === "discovery_question" && event.question) {
          const ack = (event.acknowledgment || event.message || "").trim();
          removeStreamingMessage();
          setDiscoveryQuestion({
            question: event.question,
            options: event.options ?? [],
          });
          setDiscoveryAcknowledgment(ack || null);
          setActiveAgent(null);
        } else if (event.type === "discovery_complete") {
          setDiscoveryQuestion(null);
          setDiscoveryAcknowledgment(null);
        } else if (event.type === "discovery_turn_complete") {
          setActiveAgent(null);
          await refreshMessages();
          await refreshProject();
        } else if (event.type === "clarification") {
          setActiveAgent(null);
          if (event.questions?.length) {
            setClarificationQuestions(event.questions);
          }
          if (event.message) {
            ensureStreamingMessage("clarification");
            setMessages((prev) =>
              prev.map((m) =>
                m.id === STREAMING_MSG_ID ? { ...m, content: event.message! } : m
              )
            );
            setStreaming(true);
          }
        } else if (
          event.type === "workflow_complete" ||
          event.type === "conversation_complete"
        ) {
          setActiveAgent(null);
          setClarificationQuestions([]);
          setDiscoveryQuestion(null);
          setDiscoveryAcknowledgment(null);
          if (event.reports?.length) {
            setReportsReady(true);
            setReportsGenerated(event.reports);
          }
          if (event.message) {
            ensureStreamingMessage();
            setMessages((prev) =>
              prev.map((m) =>
                m.id === STREAMING_MSG_ID ? { ...m, content: event.message! } : m
              )
            );
          }
          const updated = await refreshMessages();
          await refreshProject();
          removeStreamingMessage();
          if (!updated && mountedRef.current) {
            setErrorBanner(
              "Response saved, but the latest messages couldn't be loaded. Refresh to see them."
            );
          }
        } else if (event.type === "cancelled") {
          setActiveAgent(null);
          removeStreamingMessage();
          await refreshMessages();
        } else if (event.type === "error") {
          throw new Error(event.message || "The workflow reported an error.");
        }
      };

      try {
        const res = await apiStream(
          `/api/projects/${projectId}/chat/messages`,
          {
            content: trimmed || "",
            ...(fileIds.length ? { file_ids: fileIds } : {}),
          },
          accessToken,
          { signal: controller.signal }
        );

        if (!res.body) throw new Error("No response stream from server");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

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

            await handleEvent(parsed);
          }
        }

        if (streamGen === streamGenRef.current && !receivedEvent) {
          await refreshMessages();
        }
      } catch (err: unknown) {
        if (err && typeof err === "object" && (err as { name?: string }).name === "AbortError") {
          if (streamGen === streamGenRef.current) {
            removeStreamingMessage();
            await refreshMessages();
          }
          return;
        }
        console.error("sendMessage stream error", err);

        if (streamGen !== streamGenRef.current) return;

        removeStreamingMessage();

        if (isApiError(err) && err.status === 409) {
          setMessages((prev) => prev.filter((m) => m.id !== tempId));
          setInput(trimmed);
          setPendingAttachments(filesToSend);
          setErrorBanner(
            err.detail ||
              "A workflow is already running for this project. Wait a moment, then try again."
          );
          setActiveAgent(null);
          return;
        }

        if (isApiError(err) && err.status === 401) {
          setMessages((prev) => prev.filter((m) => m.id !== tempId));
          setErrorBanner(
            "Session expired or invalid. Sign out and sign in again (NEXTAUTH_SECRET must match JWT_SECRET)."
          );
          setActiveAgent(null);
          return;
        }

        const recovered = await refreshMessages();
        if (!recovered && mountedRef.current) {
          setMessages((prev) => [
            ...prev,
            {
              id: `err-${Date.now()}`,
              role: "assistant",
              content: `Something went wrong: ${formatApiError(err)}. Please try again.`,
              message_type: "text",
              created_at: new Date().toISOString(),
            },
          ]);
        } else if (mountedRef.current) {
          setErrorBanner(formatApiError(err, "Something went wrong. Please try again."));
        }
        setActiveAgent(null);
        setClarificationQuestions([]);
        setDiscoveryQuestion(null);
        setDiscoveryAcknowledgment(null);
      } finally {
        if (streamGen === streamGenRef.current) {
          sendingRef.current = false;
          if (mountedRef.current) {
            setLoading(false);
            setStreaming(false);
          }
        }
      }
    },
    [
      accessToken,
      projectId,
      pendingAttachments,
      ensureStreamingMessage,
      appendContentDelta,
      removeStreamingMessage,
      refreshMessages,
      refreshProject,
    ]
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
    : activeAgent && isAgentKey(activeAgent)
    ? (() => {
        const idx = AGENT_ORDER.indexOf(activeAgent);
        return idx > 0 ? AGENT_ORDER.slice(0, idx) : [];
      })()
    : [];

  const activeAgentIndex =
    activeAgent && isAgentKey(activeAgent) ? AGENT_ORDER.indexOf(activeAgent) : -1;

  const progressPct = reportsReady
    ? 100
    : activeAgentIndex >= 0
    ? Math.round(((activeAgentIndex + 0.5) / AGENT_ORDER.length) * 100)
    : 0;

  const contextDesktopOpen = contextOpen;
  const sidebarWidth = sidebarCollapsed ? "md:w-[72px]" : "md:w-[240px]";

  const stageLabel = reportsReady
    ? "Complete"
    : activeAgent
    ? getAgentMeta(activeAgent).short
    : discoveryQuestion
    ? "Discovery"
    : loading
    ? "Thinking"
    : "Idle";

  const visibleMessages = messages.filter((m) => {
    if (m.role === "user") return true;
    if (m.id === STREAMING_MSG_ID) return true;
    if (!m.content?.trim()) return false;
    // Discovery panel owns the active question + acknowledgment
    if (discoveryQuestion && m.message_type === "discovery") {
      return false;
    }
    return true;
  });

  const showThinking = loading && !activeAgent && !streaming;

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-[#090B14] text-[#F7F8FC]">
      {/* Top Nav */}
      <header className="z-40 flex h-14 sm:h-16 shrink-0 items-center justify-between border-b border-white/[0.08] bg-[#090B14]/80 px-3 backdrop-blur-md sm:px-4 lg:px-6 safe-top">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
          <button
            aria-label="Toggle Sidebar"
            className="shrink-0 rounded-lg p-2 transition-colors hover:bg-white/5"
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

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium sm:hidden">
              {project?.title || "Loading..."}
            </p>
            <div className="hidden min-w-0 items-center gap-3 text-sm sm:flex">
              <span className="text-[#7C869A]">Projects</span>
              <span className="material-symbols-outlined text-xs text-[#7C869A]">
                chevron_right
              </span>
              <span className="max-w-[120px] truncate font-medium md:max-w-none">
                {project?.title || "Loading..."}
              </span>
              <span className="ml-2 whitespace-nowrap rounded bg-[oklch(0.75_0.12_190)]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[oklch(0.75_0.12_190)]">
                Stage: {stageLabel}
              </span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2 md:gap-4">
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
              aria-label="Export reports"
              className={`flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/5 px-2.5 py-1.5 text-xs font-medium transition-colors sm:px-3 ${
                reportsReady
                  ? "hover:bg-white/10"
                  : "pointer-events-none opacity-40"
              }`}
            >
              <span className="material-symbols-outlined text-lg">download</span>
              <span className="hidden sm:inline">Export</span>
            </Link>
          </div>

          <div className="mx-1 hidden h-6 w-px bg-white/[0.08] sm:block" />

          <button
            className="rounded-lg p-2 text-[#B4BCCB] transition-colors hover:bg-white/5 hover:text-[oklch(0.75_0.12_190)]"
            onClick={() => setContextOpen((v) => !v)}
            title="Context Panel"
            aria-label="Toggle context panel"
          >
            <span className="material-symbols-outlined">info</span>
          </button>

          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[oklch(0.75_0.12_190)]/40 bg-[oklch(0.75_0.12_190)]/20 text-xs font-bold text-[oklch(0.75_0.12_190)]">
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

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={[
            "group z-50 flex h-full shrink-0 flex-col overflow-hidden border-r border-white/[0.08] bg-[#191D20]",
            TRANSITION,
            "fixed inset-y-0 left-0 top-16 z-50 w-[min(85vw,240px)] md:relative md:top-0 md:h-full md:translate-x-0",
            sidebarOpenMobile ? "translate-x-0" : "-translate-x-full md:translate-x-0",
            sidebarWidth,
          ].join(" ")}
          aria-label="Workspace sidebar"
        >
          <div className={`min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 ${CUSTOM_SCROLLBAR}`}>
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
                  className="w-full rounded-lg border-r-2 border-[oklch(0.75_0.12_190)] bg-[oklch(0.75_0.12_190)]/10 px-3 py-2 text-[oklch(0.75_0.12_190)] transition-all hover:bg-[oklch(0.75_0.12_190)]/20"
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
                  const isActive =
                    activeAgent === stage.key ||
                    (stage.key === "input_understanding" && !!discoveryQuestion);

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
                            ? "bg-[oklch(0.75_0.12_190)] ring-4 ring-[oklch(0.75_0.12_190)]/20"
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

          <div className="shrink-0 border-t border-white/[0.08] p-4">
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

        {/* Main conversation */}
        <main className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-[#111315]">
          <div
            ref={scrollRef}
            className={`min-h-0 flex-1 overflow-y-auto overscroll-contain ${CUSTOM_SCROLLBAR} selection:bg-[oklch(0.75_0.12_190)]/25 selection:text-[#F7F8FC]`}
            role="log"
            aria-live="polite"
            aria-relevant="additions"
            aria-label="Chat messages"
          >
            <div className="mx-auto w-full max-w-4xl space-y-4 px-4 py-6 md:space-y-5 md:px-8 md:py-8">
              {visibleMessages.length === 0 && !loading && (
                <motion.div
                  {...FADE_UP}
                  className="flex flex-col items-center justify-center gap-4 py-20 text-center md:py-28"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/5 text-[#7C869A]">
                    <span className="material-symbols-outlined text-2xl">chat_bubble</span>
                  </div>
                  <h2 className="text-lg font-semibold text-[#F7F8FC]">Describe your project idea</h2>
                  <p className="max-w-md text-sm leading-relaxed text-[#B4BCCB]">
                    Explain what you want to build. Planify AI will run structured discovery,
                    then generate PRD, architecture, market research, and execution planning.
                  </p>
                </motion.div>
              )}

              {activeAgent && activeAgentMeta && (
                <motion.div
                  {...FADE_UP}
                  className={`${GLASS_PANEL} relative overflow-hidden rounded-2xl p-4 md:p-5`}
                >
                  <div className="pointer-events-none absolute inset-0 animate-pulse bg-gradient-to-r from-[oklch(0.75_0.12_190)]/5 to-transparent" />

                  <div className="relative mb-4 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-4">
                      {activeAgent && isAgentKey(activeAgent) && (
                        <div className="flex -space-x-3">
                          {AGENT_ORDER.slice(
                            Math.max(activeAgentIndex - 1, 0),
                            activeAgentIndex + 2
                          ).map((a) => (
                            <div
                              key={a}
                              className={`flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#191D20] ${AGENT_META[a].iconBg} ${AGENT_META[a].iconColor}`}
                            >
                              <span className="material-symbols-outlined text-xl">
                                {AGENT_META[a].icon}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div>
                        <h3 className="flex items-center gap-2 text-base font-semibold md:text-lg">
                          {activeAgentIndex >= 0
                            ? `${Math.min(activeAgentIndex + 1, AGENT_ORDER.length)} of ${AGENT_ORDER.length} agents`
                            : "AI agents working"}
                          <span className="flex gap-1">
                            <span className="h-1 w-1 rounded-full bg-[oklch(0.75_0.12_190)] animate-pulse" />
                            <span className="h-1 w-1 rounded-full bg-[oklch(0.75_0.12_190)] animate-pulse [animation-delay:200ms]" />
                            <span className="h-1 w-1 rounded-full bg-[oklch(0.75_0.12_190)] animate-pulse [animation-delay:400ms]" />
                          </span>
                        </h3>
                        <p className="mt-1 text-xs text-[#7C869A]">
                          {activeAgentMeta.label}
                        </p>
                      </div>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-2xl font-bold text-[oklch(0.75_0.12_190)]">
                        {progressPct}%
                      </span>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#7C869A]">
                        {reportsReady
                          ? "Workflow complete"
                          : activeAgentIndex >= 0
                          ? `Step ${activeAgentIndex + 1} of ${AGENT_ORDER.length}`
                          : "In progress"}
                      </p>
                    </div>
                  </div>

                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-[oklch(0.75_0.12_190)] to-[oklch(0.55_0.09_195)]"
                      initial={false}
                      animate={{ width: `${progressPct}%` }}
                      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                    />
                  </div>
                </motion.div>
              )}

              <div className="flex flex-col gap-4 md:gap-5">
                <AnimatePresence initial={false} mode="popLayout">
                  {visibleMessages.map((msg) => {
                    const agentMeta = msg.metadata?.agent
                      ? getAgentMeta(String(msg.metadata.agent))
                      : msg.message_type === "discovery"
                      ? getAgentMeta("discovery")
                      : null;
                    const isStreamingMsg = msg.id === STREAMING_MSG_ID;

                    return (
                      <ChatMessage
                        key={msg.id}
                        message={msg}
                        projectId={projectId}
                        agentMeta={agentMeta}
                        streaming={isStreamingMsg && streaming}
                        accessToken={accessToken}
                      />
                    );
                  })}
                </AnimatePresence>

                {showThinking && (
                  <ThinkingIndicator label={thinkingLabel} />
                )}

                {discoveryQuestion && (
                  <DiscoveryOptionsPanel
                    question={discoveryQuestion.question}
                    options={discoveryQuestion.options}
                    acknowledgment={discoveryAcknowledgment}
                    onSelect={(option) => {
                      sendMessage(option, {
                        keepDiscoveryVisible: true,
                        includeAttachments: false,
                      });
                    }}
                    loading={loading}
                  />
                )}

                {clarificationQuestions.length > 0 && !discoveryQuestion && (
                  <WorkspaceClarificationPanel
                    questions={clarificationQuestions}
                    onSubmit={(combinedAnswer) => {
                      sendMessage(combinedAnswer, {
                        keepClarificationVisible: true,
                        includeAttachments: false,
                      });
                    }}
                    loading={loading}
                  />
                )}

                <div ref={bottomRef} className="h-px shrink-0" aria-hidden />
              </div>
            </div>
          </div>

          <div className="relative shrink-0 border-t border-white/[0.06] bg-[#111315]/90 px-3 py-3 backdrop-blur-xl safe-bottom sm:px-4 md:px-8 md:py-4">
            <ScrollToBottomButton
              visible={showScrollButton}
              onClick={() => scrollToBottom("smooth")}
            />
            <ChatComposer
              value={input}
              onChange={setInput}
              onSend={() => sendMessage(input)}
              onStop={stopGeneration}
              loading={loading}
              streaming={streaming}
              attachments={pendingAttachments}
              onAttachmentsChange={setPendingAttachments}
              uploading={uploadingFiles}
            />
          </div>
        </main>

        {/* Context panel */}
        <aside
          className={[
            "z-50 flex h-full min-h-0 shrink-0 flex-col overflow-hidden bg-[#191D20]",
            TRANSITION,
            "fixed inset-y-0 right-0 top-16 md:relative md:top-0 md:h-full",
            contextOpen
              ? "w-[min(85vw,320px)] translate-x-0 border-l border-white/[0.08]"
              : "pointer-events-none w-0 translate-x-full border-l-0 lg:pointer-events-auto lg:translate-x-0",
            contextDesktopOpen ? "lg:w-80 lg:border-l lg:border-white/[0.08]" : "lg:w-0 lg:border-l-0",
          ].join(" ")}
          aria-label="Project context"
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

          <div className={`min-h-0 flex-1 space-y-8 overflow-y-auto overscroll-contain p-6 ${CUSTOM_SCROLLBAR}`}>
            <div>
              <h4 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-[#7C869A]">
                Project Context
              </h4>

              <motion.div
                layout
                className={`${GLASS_PANEL} space-y-4 rounded-2xl p-5`}
                initial={false}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
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
                    <span className="text-xs font-semibold text-[oklch(0.75_0.12_190)]">
                      {project?.target || "—"}
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>

            <div>
              <div className="mb-6 flex items-center justify-between">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#7C869A]">
                  Active Memory
                </h4>
                <span className="cursor-pointer text-[10px] text-[oklch(0.75_0.12_190)] hover:underline">
                  View all
                </span>
              </div>

              <div className="space-y-3">
                {project?.memory?.length ? (
                  project.memory.map((item) => {
                    const tone = getMemoryTone(item.color);

                    return (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="group flex cursor-pointer items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.04] p-3 transition-colors hover:border-white/[0.12] hover:bg-white/[0.08]"
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
                      </motion.div>
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
                    const meta = AGENT_META[a];

                    return (
                      <div key={a} className="relative flex gap-4">
                        <div
                          className={`z-10 flex h-6 w-6 items-center justify-center rounded-full border-4 border-[#191D20] ${
                            isActive ? "bg-[oklch(0.75_0.12_190)]" : "bg-emerald-400"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[10px] text-white">
                            {isActive ? "edit" : "check"}
                          </span>
                        </div>

                        <div>
                          <p className="text-xs text-[#F7F8FC]">
                            {meta?.short || a}
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
                    <div className="z-10 flex h-6 w-6 items-center justify-center rounded-full border-4 border-[#191D20] bg-white/[0.08]">
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
      <footer className="relative z-40 hidden h-10 shrink-0 items-center justify-between border-t border-white/[0.08] bg-[#191D20] px-4 sm:flex sm:px-6">
        <p className="truncate text-[9px] font-medium uppercase tracking-tighter text-[#7C869A]">
          © {new Date().getFullYear()} Planify AI • Secure Enterprise
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