"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChatMarkdown } from "./ChatMarkdown";
import { FADE_UP } from "./constants";

export interface ChatMessageData {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  message_type: string;
  created_at: string;
  metadata?: {
    agent?: string;
    reports_generated?: string[];
    [key: string]: unknown;
  };
}

interface AgentMeta {
  short: string;
  icon: string;
  iconColor: string;
}

interface Props {
  message: ChatMessageData;
  projectId: string;
  agentMeta?: AgentMeta | null;
}

export function ChatMessage({ message, projectId, agentMeta }: Props) {
  const isUser = message.role === "user";
  const content = message.content?.trim() ?? "";

  if (!isUser && !content) return null;

  const bubbleWidth =
    "w-full max-w-[92%] sm:max-w-[min(78%,42rem)]";

  if (isUser) {
    return (
      <motion.div
        {...FADE_UP}
        layout="position"
        className={`flex justify-end ${bubbleWidth} ml-auto`}
      >
        <div
          className="rounded-2xl rounded-tr-md border border-[#AEC6FF]/25 bg-[#AEC6FF]/12 px-4 py-3 shadow-md shadow-[#AEC6FF]/5 selection:bg-[#AEC6FF]/30 md:px-5 md:py-3.5"
          role="article"
          aria-label="Your message"
        >
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-[#F7F8FC] md:text-[15px] md:leading-7">
            {content}
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      {...FADE_UP}
      layout="position"
      className={`flex items-start gap-3 ${bubbleWidth}`}
    >
      <div
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-[#151A2B] shadow-inner"
        aria-hidden
      >
        <span
          className={`material-symbols-outlined text-lg ${agentMeta?.iconColor || (message.message_type === "discovery" ? "text-cyan-400" : "text-[#AEC6FF]")}`}
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          {agentMeta?.icon || (message.message_type === "discovery" ? "edit_note" : "smart_toy")}
        </span>
      </div>

      <div
        className="min-w-0 flex-1 overflow-hidden rounded-2xl rounded-tl-md border border-white/[0.08] bg-[#151A2B] px-4 py-3 shadow-sm transition-colors hover:bg-[#1B2136]/80 md:px-5 md:py-4"
        role="article"
        aria-label="Assistant message"
      >
        {agentMeta ? (
          <div className="mb-2 flex items-center gap-2">
            <span
              className={`text-[10px] font-bold uppercase tracking-widest ${agentMeta.iconColor}`}
            >
              {agentMeta.short}
            </span>
          </div>
        ) : message.message_type === "discovery" ? (
          <div className="mb-2 flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">
              Discovery
            </span>
          </div>
        ) : null}

        <ChatMarkdown content={content} />

        {!!message.metadata?.reports_generated?.length && (
          <div className="mt-4 grid grid-cols-1 gap-2 border-t border-white/[0.06] pt-4 sm:grid-cols-2">
            {message.metadata.reports_generated.map((r) => (
              <Link
                key={r}
                href={`/projects/${projectId}/reports`}
                className="group flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 transition-all hover:border-[#AEC6FF]/40 hover:bg-white/[0.06]"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-emerald-400">
                    task_alt
                  </span>
                  <span className="text-xs font-medium text-[#F7F8FC]">{r.toUpperCase()}</span>
                </div>
                <span className="material-symbols-outlined text-sm text-[#7C869A] transition-colors group-hover:text-[#AEC6FF]">
                  open_in_new
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
