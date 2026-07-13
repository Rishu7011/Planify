"use client";

import { useCallback, useEffect, useRef, type KeyboardEvent } from "react";
import { GLASS_PANEL, TRANSITION } from "./constants";

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onStop?: () => void;
  loading: boolean;
  streaming?: boolean;
  disabled?: boolean;
}

const MAX_HEIGHT_PX = 200;

export function ChatComposer({
  value,
  onChange,
  onSend,
  onStop,
  loading,
  streaming = false,
  disabled,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT_PX)}px`;
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (streaming) {
        if (value.trim()) onSend();
        return;
      }
      if (!loading && value.trim()) onSend();
    }
  };

  const isGenerating = loading || streaming;
  const canSend = !disabled && value.trim().length > 0;
  const showStop = isGenerating;

  return (
    <div
      className={`${GLASS_PANEL} mx-auto flex max-w-4xl items-end gap-1 rounded-2xl p-2 shadow-2xl shadow-black/20 ring-1 ring-white/[0.04] focus-within:border-[#AEC6FF]/25 focus-within:ring-[#AEC6FF]/20 ${TRANSITION}`}
    >
      <button
        type="button"
        className="mb-0.5 shrink-0 rounded-xl p-2.5 text-[#7C869A] transition-colors hover:bg-white/[0.04] hover:text-[#F7F8FC] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#AEC6FF]/40"
        aria-label="Attach file"
        disabled={isGenerating}
      >
        <span className="material-symbols-outlined text-[22px]">attach_file</span>
      </button>

      <textarea
        ref={textareaRef}
        rows={1}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={
          isGenerating
            ? "Type to interrupt and send a new message…"
            : "Message Planify AI… (@ to mention an agent)"
        }
        aria-label="Message input"
        className={`max-h-[200px] min-h-[44px] min-w-0 flex-1 resize-none border-none bg-transparent py-2.5 text-sm leading-relaxed text-[#F7F8FC] placeholder:text-[#7C869A] focus:outline-none focus:ring-0 md:text-[15px] ${CUSTOM_SCROLLBAR}`}
        style={{ height: "44px" }}
      />

      <div className="mb-0.5 flex shrink-0 items-center gap-0.5 pr-1">
        <button
          type="button"
          className="hidden rounded-xl p-2 text-[#7C869A] transition-colors hover:bg-white/[0.04] hover:text-[#F7F8FC] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#AEC6FF]/40 sm:block"
          aria-label="Voice input (coming soon)"
          disabled
          title="Voice input coming soon"
        >
          <span className="material-symbols-outlined text-[22px]">mic</span>
        </button>

        <button
          type="button"
          onClick={showStop && !canSend ? onStop : onSend}
          disabled={showStop ? !onStop && !canSend : !canSend}
          aria-label={
            showStop && !canSend
              ? "Stop generating"
              : showStop && canSend
              ? "Interrupt and send message"
              : "Send message"
          }
          className={`flex h-10 w-10 items-center justify-center rounded-xl md:h-11 md:w-11 ${TRANSITION} ${
            showStop && !canSend
              ? "bg-[#151A2B] text-[#F7F8FC] ring-1 ring-white/10 hover:bg-[#1B2136] active:scale-[0.97]"
              : canSend
              ? "bg-[#AEC6FF] text-[#090B14] shadow-lg shadow-[#AEC6FF]/25 hover:scale-[1.03] active:scale-[0.97]"
              : "bg-white/[0.06] text-[#7C869A]"
          } focus:outline-none focus-visible:ring-2 focus-visible:ring-[#AEC6FF]/50 disabled:pointer-events-none`}
        >
          {showStop && !canSend ? (
            <span className="material-symbols-outlined text-xl">stop_circle</span>
          ) : showStop && canSend ? (
            <span className="material-symbols-outlined text-xl">send</span>
          ) : (
            <span className="material-symbols-outlined text-xl">send</span>
          )}
        </button>
      </div>
    </div>
  );
}

const CUSTOM_SCROLLBAR =
  "[&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/10";
