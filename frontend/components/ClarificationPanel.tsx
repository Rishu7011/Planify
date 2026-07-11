"use client";

import { useState } from "react";

interface ClarificationPanelProps {
  questions: string[];
  onSubmit: (combinedAnswer: string) => void;
  loading: boolean;
}

export function ClarificationPanel({ questions, onSubmit, loading }: ClarificationPanelProps) {
  const [answers, setAnswers] = useState<string[]>(Array(questions.length).fill(""));

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

  return (
    <div className="rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-950/40 to-indigo-950/40 p-6 my-4 backdrop-blur-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="h-8 w-8 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0">
          <svg className="h-4 w-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-white text-sm">A few questions to get started</h3>
          <p className="text-xs text-slate-400 mt-0.5">Your answers help generate more accurate and useful reports.</p>
        </div>
      </div>

      <div className="space-y-5">
        {questions.map((question, i) => (
          <div key={i}>
            <label className="block text-sm font-medium text-slate-200 mb-2">
              <span className="text-violet-400 mr-2">{i + 1}.</span>
              {question}
            </label>
            <textarea
              value={answers[i]}
              onChange={(e) => handleChange(i, e.target.value)}
              disabled={loading}
              placeholder="Your answer..."
              rows={2}
              className="w-full resize-none rounded-xl border border-white/10 bg-slate-800/60 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-colors disabled:opacity-50"
            />
          </div>
        ))}
      </div>

      <button
        id="clarification-submit-btn"
        onClick={handleSubmit}
        disabled={loading || !allAnswered}
        className="mt-5 w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:shadow-lg hover:shadow-violet-500/30 active:scale-[0.98]"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" strokeLinecap="round" />
            </svg>
            Generating reports...
          </span>
        ) : (
          "Submit Answers & Generate Reports"
        )}
      </button>
    </div>
  );
}
