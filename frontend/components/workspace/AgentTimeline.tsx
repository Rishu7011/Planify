"use client";

import { motion } from "framer-motion";

const AGENTS = [
  { id: "input_understanding", label: "Input understanding", sub: "Parsing your brief" },
  { id: "clarification", label: "Clarification", sub: "Context gathering" },
  { id: "prd", label: "PRD", sub: "Product requirements" },
  { id: "feasibility", label: "Feasibility", sub: "Technical assessment" },
  { id: "roi", label: "ROI model", sub: "Financial modeling" },
  { id: "roadmap", label: "Roadmap", sub: "90-day execution plan" },
  { id: "final_report", label: "Final report", sub: "Assembling bundle" },
];

type AgentState = "done" | "active" | "pending" | "error";

interface Props {
  activeAgent: string | null;
  completedAgents: string[];
}

function getState(id: string, active: string | null, completed: string[]): AgentState {
  if (completed.includes(id)) return "done";
  if (active === id) return "active";
  return "pending";
}

const FLOW_LABELS: Record<string, string> = {
  input_understanding: "Understand",
  clarification: "Clarify",
  prd: "PRD",
  feasibility: "Feasibility",
  roi: "ROI",
  roadmap: "Roadmap",
  final_report: "Bundle",
};

export default function AgentTimeline({ activeAgent, completedAgents }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Timeline */}
      <div className="w-panel-section">
        <div className="w-panel-label">Agent pipeline</div>
        <div className="w-timeline" style={{ padding: 0 }}>
          {AGENTS.map((agent, i) => {
            const state = getState(agent.id, activeAgent, completedAgents);
            const isPending = state === "pending";
            const isActive = state === "active";

            return (
              <div key={agent.id} className="w-tl-item">
                <div className="w-tl-track">
                  <div style={{ position: "relative" }}>
                    {isActive && (
                      <motion.div
                        layoutId="activeTimelineDot"
                        className="absolute inset-0 rounded-full bg-[var(--w-ai)]"
                        animate={{ scale: [1, 1.4, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                        style={{
                          filter: "blur(4px)",
                          opacity: 0.5,
                        }}
                      />
                    )}
                    <div className={`w-tl-dot ${state}`} style={{ position: "relative", zIndex: 10 }} />
                  </div>
                  {i < AGENTS.length - 1 && <div className="w-tl-line" />}
                </div>
                <div className="w-tl-content">
                  <div
                    className="w-tl-name"
                    style={{
                      color: isPending
                        ? "var(--w-subtle)"
                        : isActive
                        ? "var(--w-ai)"
                        : "var(--w-fg)",
                      fontWeight: isActive ? 600 : 500,
                      transition: "color 0.2s ease",
                    }}
                  >
                    {agent.label}
                  </div>
                  <div className="w-tl-sub">{agent.sub}</div>
                  {isActive && (
                    <div className="w-progress" style={{ marginTop: 6 }}>
                      <motion.div
                        className="w-progress-fill"
                        initial={{ width: "0%" }}
                        animate={{ width: "85%" }}
                        transition={{ duration: 15, ease: "easeOut" }}
                      />
                    </div>
                  )}
                  {state === "done" && (
                    <motion.div
                      initial={{ opacity: 0, x: -3 }}
                      animate={{ opacity: 1, x: 0 }}
                      style={{
                        fontSize: 10,
                        color: "var(--w-success)",
                        marginTop: 2,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
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
                      Complete
                    </motion.div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Workflow visualization */}
      <div className="w-panel-section" style={{ marginTop: 8, flex: 1 }}>
        <div className="w-panel-label">Workflow</div>
        <div className="w-flow-nodes">
          {AGENTS.map((agent, i) => {
            const state = getState(agent.id, activeAgent, completedAgents);
            return (
              <div key={agent.id}>
                <div className={`w-flow-node ${state}`} style={{ position: "relative" }}>
                  {state === "done" && (
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--w-success)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m5 12 5 5L20 7" />
                    </svg>
                  )}
                  {state === "active" && (
                    <motion.span
                      animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "var(--w-ai)",
                        boxShadow: "0 0 8px var(--w-ai)",
                        display: "inline-block",
                        flexShrink: 0,
                      }}
                    />
                  )}
                  {state === "pending" && (
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "var(--w-border-strong)",
                        display: "inline-block",
                        flexShrink: 0,
                      }}
                    />
                  )}
                  {FLOW_LABELS[agent.id]}
                </div>
                {i < AGENTS.length - 1 && <div className="w-flow-connector" />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
