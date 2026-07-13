"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { GLASS_PANEL, FADE_UP, TRANSITION } from "./chat/constants";

interface Props {
  questions: string[];
  onSubmit: (combinedAnswer: string) => void;
  loading: boolean;
}

export function WorkspaceClarificationPanel({ questions, onSubmit, loading }: Props) {
  const [answers, setAnswers] = useState<string[]>(Array(questions.length).fill(""));
  const firstRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setAnswers(Array(questions.length).fill(""));
  }, [questions]);

  useEffect(() => {
    firstRef.current?.focus();
  }, [questions]);

  const handleChange = (i: number, val: string) => {
    const next = [...answers];
    next[i] = val;
    setAnswers(next);
  };

  const handleSubmit = () => {
    const formatted = questions
      .map((q, i) => `**${q}**\n${answers[i].trim() || "(skipped)"}`)
      .join("\n\n");
    onSubmit(formatted);
  };

  const allAnswered = answers.every((a) => a.trim().length > 0);
  const anyAnswered = answers.some((a) => a.trim().length > 0);

  return (
    <motion.div
      {...FADE_UP}
      className={`${GLASS_PANEL} w-full max-w-[min(78%,42rem)] rounded-2xl p-4 md:p-5`}
    >
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400">
          <span className="material-symbols-outlined text-lg">help_center</span>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[#F7F8FC]">Clarifying questions</h3>
          <p className="mt-0.5 text-xs text-[#7C869A]">
            Structured answers produce accurate planning documents.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {questions.map((question, i) => (
          <div key={i} className="space-y-2">
            <label className="flex gap-2 text-sm leading-snug text-[#F7F8FC]">
              <span className="shrink-0 font-medium text-[#AEC6FF]">{i + 1}.</span>
              <span>{question}</span>
            </label>
            <textarea
              ref={i === 0 ? firstRef : undefined}
              value={answers[i]}
              onChange={(e) => handleChange(i, e.target.value)}
              disabled={loading}
              placeholder="Your answer…"
              rows={2}
              className={`w-full resize-none rounded-xl border border-white/[0.08] bg-[#090B14]/40 px-3 py-2.5 text-sm text-[#F7F8FC] placeholder:text-[#7C869A] focus:border-[#AEC6FF]/40 focus:outline-none focus:ring-1 focus:ring-[#AEC6FF]/30 ${TRANSITION}`}
            />
          </div>
        ))}
      </div>

      {anyAnswered && !allAnswered && !loading && (
        <p className="mt-3 text-xs text-[#7C869A]">
          Unanswered questions will be marked as skipped.
        </p>
      )}

      <button
        id="clarification-submit-btn"
        type="button"
        onClick={handleSubmit}
        disabled={loading || !anyAnswered}
        className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#AEC6FF] px-4 py-2.5 text-sm font-medium text-[#090B14] shadow-lg shadow-[#AEC6FF]/20 ${TRANSITION} hover:brightness-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#AEC6FF]/50 disabled:opacity-40`}
      >
        {loading ? (
          <>
            <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
            Generating reports…
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-lg">arrow_forward</span>
            Submit &amp; generate
          </>
        )}
      </button>
    </motion.div>
  );
}
