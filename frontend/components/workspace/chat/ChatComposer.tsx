"use client";

import { useCallback, useEffect, useRef, type KeyboardEvent } from "react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { GLASS_PANEL, TRANSITION } from "./constants";

export type PendingAttachment = {
  /** Local id for UI list keys before/during upload */
  localId: string;
  file: File;
};

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onStop?: () => void;
  loading: boolean;
  streaming?: boolean;
  disabled?: boolean;
  attachments?: PendingAttachment[];
  onAttachmentsChange?: (files: PendingAttachment[]) => void;
  uploading?: boolean;
  maxFiles?: number;
}

const MAX_HEIGHT_PX = 200;
const DEFAULT_MAX_FILES = 5;
const ACCEPT = ".pdf,application/pdf";

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function ChatComposer({
  value,
  onChange,
  onSend,
  onStop,
  loading,
  streaming = false,
  disabled,
  attachments = [],
  onAttachmentsChange,
  uploading = false,
  maxFiles = DEFAULT_MAX_FILES,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const baseTextRef = useRef("");

  const handleSpeechResult = useCallback(
    (transcript: string) => {
      const base = baseTextRef.current;
      const separator = base ? " " : "";
      onChange(base + separator + transcript);
    },
    [onChange]
  );

  const { isListening, supported, startListening, stopListening } = useSpeechRecognition({
    onResult: handleSpeechResult,
  });

  const toggleListening = useCallback(() => {
    if (!supported) return;
    if (!isListening) {
      baseTextRef.current = value;
      startListening();
    } else {
      stopListening();
    }
  }, [supported, isListening, value, startListening, stopListening]);

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
        if (value.trim() || attachments.length) onSend();
        return;
      }
      if (!loading && !uploading && (value.trim() || attachments.length)) onSend();
    }
  };

  const isGenerating = loading || streaming;
  const canSend =
    !disabled &&
    !uploading &&
    (value.trim().length > 0 || attachments.length > 0);
  const showStop = isGenerating;
  const canAttach = !disabled && !isGenerating && !uploading && attachments.length < maxFiles;

  const pickFiles = () => {
    if (!canAttach) return;
    fileInputRef.current?.click();
  };

  const onFilePicked = (list: FileList | null) => {
    if (!list?.length || !onAttachmentsChange) return;
    const remaining = maxFiles - attachments.length;
    const next = [...attachments];
    for (const file of Array.from(list).slice(0, remaining)) {
      const isPdf =
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf");
      if (!isPdf) continue;
      next.push({
        localId:
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `f-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
      });
    }
    onAttachmentsChange(next);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = (localId: string) => {
    onAttachmentsChange?.(attachments.filter((a) => a.localId !== localId));
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-2">
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 px-1">
          {attachments.map((a) => (
            <div
              key={a.localId}
              className="group flex max-w-full items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.04] px-2.5 py-1.5 text-xs text-[#B4BCCB]"
            >
              <span className="material-symbols-outlined text-base text-[oklch(0.75_0.12_190)]">
                draft
              </span>
              <span className="truncate font-medium text-[#F7F8FC]">{a.file.name}</span>
              <span className="shrink-0 text-[10px] text-[#7C869A]">
                {formatBytes(a.file.size)}
              </span>
              <button
                type="button"
                aria-label={`Remove ${a.file.name}`}
                disabled={isGenerating || uploading}
                onClick={() => removeAttachment(a.localId)}
                className="rounded-md p-0.5 text-[#7C869A] transition-colors hover:bg-white/10 hover:text-[#F7F8FC] disabled:opacity-40"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          ))}
          {uploading && (
            <span className="flex items-center gap-1.5 text-[11px] text-[oklch(0.75_0.12_190)]">
              <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
              Uploading…
            </span>
          )}
        </div>
      )}

      <div
        className={`${GLASS_PANEL} flex items-end gap-1 rounded-2xl p-2 shadow-2xl shadow-black/20 ring-1 ring-white/[0.04] focus-within:border-[oklch(0.75_0.12_190)]/25 focus-within:ring-[oklch(0.75_0.12_190)]/20 ${TRANSITION}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={ACCEPT}
          multiple
          onChange={(e) => onFilePicked(e.target.files)}
        />

        <button
          type="button"
          className="mb-0.5 shrink-0 rounded-xl p-2.5 text-[#7C869A] transition-colors hover:bg-white/[0.04] hover:text-[#F7F8FC] focus:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.75_0.12_190)]/40 disabled:opacity-40"
          aria-label="Attach file"
          disabled={!canAttach}
          title={
            attachments.length >= maxFiles
              ? `Max ${maxFiles} files per message`
              : "Attach PDF"
          }
          onClick={pickFiles}
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
            isListening
              ? "Listening... Speak now."
              : isGenerating
              ? "Type to interrupt and send a new message…"
              : attachments.length
              ? "Add a note about the PDF(s), or press send…"
              : "Message Planify AI… (attach a PDF with the paperclip)"
          }
          aria-label="Message input"
          className={`max-h-[200px] min-h-[44px] min-w-0 flex-1 resize-none border-none bg-transparent py-2.5 text-sm leading-relaxed text-[#F7F8FC] placeholder:text-[#7C869A] focus:outline-none focus:ring-0 md:text-[15px] ${CUSTOM_SCROLLBAR}`}
          style={{ height: "44px" }}
        />

        <div className="mb-0.5 flex shrink-0 items-center gap-0.5 pr-1">
          <button
            type="button"
            className={`rounded-xl p-2 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.75_0.12_190)]/40 ${
              isListening
                ? "bg-red-500/20 text-red-400 animate-pulse ring-2 ring-red-500/30 shadow-[0_0_12px_rgba(239,68,68,0.2)]"
                : "text-[#7C869A] hover:bg-white/[0.04] hover:text-[#F7F8FC]"
            }`}
            aria-label={isListening ? "Stop voice input" : "Voice input"}
            title={
              !supported
                ? "Voice input not supported in this browser"
                : isListening
                ? "Listening... Click to stop"
                : "Voice input"
            }
            disabled={!supported || disabled}
            onClick={toggleListening}
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
                ? "bg-[#191D20] text-[#F7F8FC] ring-1 ring-white/10 hover:bg-[#191D20]/90 active:scale-[0.97]"
                : canSend
                ? "bg-[oklch(0.75_0.12_190)] text-[#0d1210] shadow-lg shadow-[oklch(0.75_0.12_190)]/25 hover:scale-[1.03] active:scale-[0.97]"
                : "bg-white/[0.06] text-[#7C869A]"
            } focus:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.75_0.12_190)]/50 disabled:pointer-events-none`}
          >
            {showStop && !canSend ? (
              <span className="material-symbols-outlined text-xl">stop_circle</span>
            ) : (
              <span className="material-symbols-outlined text-xl">send</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

const CUSTOM_SCROLLBAR =
  "[&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/10";
