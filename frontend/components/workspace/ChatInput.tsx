"use client";

import { useRef, useState, useEffect } from "react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled: boolean;
}

export default function ChatInput({ value, onChange, onSubmit, disabled }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef     = useRef<HTMLInputElement>(null);
  const [files, setFiles]   = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);

  // Auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && value.trim()) onSubmit();
    }
  };

  const handleFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    setFiles((prev) => [...prev, ...Array.from(incoming)].slice(0, 5));
  };

  const removeFile = (i: number) => setFiles((prev) => prev.filter((_, idx) => idx !== i));

  const STARTERS = [
    "Build a B2B SaaS marketplace",
    "Healthcare appointment platform",
    "AI-powered inventory system",
    "Fintech onboarding redesign",
  ];

  return (
    <div className="w-input-zone">
      {/* Starter chips when empty */}
      {!value && !disabled && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, maxWidth: 800, margin: "0 auto 10px", justifyContent: "center" }}>
          {STARTERS.map((s) => (
            <button
              key={s}
              type="button"
              className="w-prompt-chip"
              onClick={() => { onChange(s); textareaRef.current?.focus(); }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* File chips */}
      {files.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, maxWidth: 800, margin: "0 auto 8px" }}>
          {files.map((f, i) => (
            <span key={i} className="w-file-chip">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/>
                <path d="M14 3v5h5"/>
              </svg>
              {f.name.length > 20 ? f.name.slice(0, 18) + "…" : f.name}
              <button onClick={() => removeFile(i)} aria-label={`Remove ${f.name}`}>×</button>
            </span>
          ))}
        </div>
      )}

      {/* Main input box */}
      <div
        className={`w-input-box${dragOver ? " drag" : ""}`}
        style={{ maxWidth: 800, margin: "0 auto", ...(dragOver ? { borderColor: "var(--w-accent)" } : {}) }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
      >
        <div className="w-input-top">
          <textarea
            ref={textareaRef}
            id="chat-input"
            className="w-textarea"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? "AI is working…" : "Describe your project idea… (Enter to send, Shift+Enter new line)"}
            disabled={disabled}
            rows={1}
            aria-label="Chat input"
          />
          <button
            id="send-btn"
            type="button"
            className="w-send-btn"
            onClick={onSubmit}
            disabled={disabled || !value.trim()}
            aria-label="Send message"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
            </svg>
          </button>
        </div>

        {/* Bottom toolbar */}
        <div className="w-input-bottom">
          {/* File upload */}
          <button
            type="button"
            className="w-input-tool"
            onClick={() => fileRef.current?.click()}
            aria-label="Attach files"
            title="Attach files (PDF, DOCX, PNG, XLSX)"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
            </svg>
            Attach
          </button>

          {/* Context indicator */}
          <button type="button" className="w-input-tool" title="Set project context">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 12h6M9 16h6M16 2v4M8 2v4M3 10h18M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            </svg>
            Context
          </button>

          {/* Hint */}
          <span className="w-input-hint">↵ send · ⇧↵ new line</span>
        </div>
      </div>

      <div style={{ textAlign: "center", fontSize: 11, color: "var(--w-subtle)", marginTop: 8, maxWidth: 800, marginInline: "auto" }}>
        AI-generated · always review before using
      </div>

      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.png,.jpg,.xlsx,.csv"
        style={{ display: "none" }}
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
