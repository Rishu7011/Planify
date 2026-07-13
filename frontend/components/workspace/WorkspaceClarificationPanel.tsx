"use client";

import { useState, useRef, useEffect } from "react";

interface Props {
  questions: string[];
  onSubmit: (combinedAnswer: string) => void;
  loading: boolean;
}

export function WorkspaceClarificationPanel({ questions, onSubmit, loading }: Props) {
  const [answers, setAnswers] = useState<string[]>(Array(questions.length).fill(""));
  const firstRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    firstRef.current?.focus();
  }, []);

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
    <div className="w-clarification">
      <div className="w-clarification-header">
        <div className="w-clarification-icon">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>
          </svg>
        </div>
        <div>
          <h3>A few clarifying questions</h3>
          <div className="w-clarification-sub">Your answers produce more accurate, tailored reports.</div>
        </div>
        <span className="w-badge w-badge-ai" style={{ marginLeft: "auto" }}>
          <span className="w-badge-dot" />
          AI
        </span>
      </div>

      <div className="w-clarification-fields">
        {questions.map((question, i) => (
          <div key={i} className="w-clarification-field">
            <label>
              <span>{i + 1}.</span>
              {question}
            </label>
            <textarea
              ref={i === 0 ? firstRef : undefined}
              value={answers[i]}
              onChange={(e) => handleChange(i, e.target.value)}
              disabled={loading}
              placeholder="Your answer…"
              rows={2}
            />
          </div>
        ))}
      </div>

      {anyAnswered && !allAnswered && !loading && (
        <div className="w-clarification-hint">
          Unanswered questions will be marked as skipped.
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <button
          id="clarification-submit-btn"
          type="button"
          className="w-btn w-btn-ai"
          onClick={handleSubmit}
          disabled={loading || !anyAnswered}
          style={{ flex: 1 }}
        >
          {loading ? (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ animation: "spin 0.8s linear infinite" }}>
                <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48 2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48 2.83-2.83"/>
              </svg>
              Generating reports…
            </>
          ) : (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
              Submit &amp; generate
            </>
          )}
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}