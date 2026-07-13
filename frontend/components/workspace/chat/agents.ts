export const AGENT_ORDER = [
  "input_understanding",
  "clarification",
  "prd",
  "market_research",
  "competitor_analysis",
  "technical_architecture",
  "feasibility",
  "hr_planning",
  "risk_analysis",
  "roi",
  "roadmap",
  "quality_validation",
  "final_report",
] as const;

export type AgentKey = (typeof AGENT_ORDER)[number];

export interface AgentMeta {
  label: string;
  short: string;
  icon: string;
  iconBg: string;
  iconColor: string;
}

export const AGENT_META: Record<AgentKey, AgentMeta> = {
  input_understanding: {
    label: "Understanding your idea...",
    short: "Understand",
    icon: "psychology",
    iconBg: "bg-blue-500/20",
    iconColor: "text-[#AEC6FF]",
  },
  clarification: {
    label: "Checking for missing context...",
    short: "Clarify",
    icon: "help_center",
    iconBg: "bg-purple-500/20",
    iconColor: "text-purple-400",
  },
  prd: {
    label: "Writing Product Requirements Document...",
    short: "PRD",
    icon: "description",
    iconBg: "bg-blue-500/20",
    iconColor: "text-blue-400",
  },
  market_research: {
    label: "Analyzing market size and trends...",
    short: "Market Research",
    icon: "insights",
    iconBg: "bg-cyan-500/20",
    iconColor: "text-cyan-400",
  },
  competitor_analysis: {
    label: "Mapping competitors and positioning...",
    short: "Competitors",
    icon: "groups",
    iconBg: "bg-indigo-500/20",
    iconColor: "text-indigo-400",
  },
  technical_architecture: {
    label: "Designing technical architecture...",
    short: "Tech Arch",
    icon: "account_tree",
    iconBg: "bg-purple-500/20",
    iconColor: "text-purple-400",
  },
  feasibility: {
    label: "Assessing technical feasibility...",
    short: "Feasibility",
    icon: "fact_check",
    iconBg: "bg-violet-500/20",
    iconColor: "text-violet-400",
  },
  hr_planning: {
    label: "Building hiring and org plan...",
    short: "HR Plan",
    icon: "badge",
    iconBg: "bg-pink-500/20",
    iconColor: "text-pink-400",
  },
  risk_analysis: {
    label: "Evaluating risks and compliance...",
    short: "Risk",
    icon: "gavel",
    iconBg: "bg-orange-500/20",
    iconColor: "text-orange-400",
  },
  roi: {
    label: "Financial modeling and ROI analysis...",
    short: "ROI Model",
    icon: "calculate",
    iconBg: "bg-amber-500/20",
    iconColor: "text-amber-400",
  },
  roadmap: {
    label: "Building project execution roadmap...",
    short: "Roadmap",
    icon: "timeline",
    iconBg: "bg-emerald-500/20",
    iconColor: "text-emerald-400",
  },
  quality_validation: {
    label: "Validating cross-report consistency...",
    short: "QA Check",
    icon: "verified",
    iconBg: "bg-teal-500/20",
    iconColor: "text-teal-400",
  },
  final_report: {
    label: "Assembling final report bundle...",
    short: "Final Report",
    icon: "task_alt",
    iconBg: "bg-emerald-500/20",
    iconColor: "text-emerald-400",
  },
};

export const SIDEBAR_STAGES: { key: AgentKey; label: string }[] = [
  { key: "input_understanding", label: "Understand" },
  { key: "prd", label: "PRD" },
  { key: "market_research", label: "Market" },
  { key: "technical_architecture", label: "Tech Arch" },
  { key: "roi", label: "ROI Model" },
  { key: "roadmap", label: "Roadmap" },
];

const FALLBACK_META: AgentMeta = {
  label: "Processing...",
  short: "Planify AI",
  icon: "smart_toy",
  iconBg: "bg-white/10",
  iconColor: "text-[#AEC6FF]",
};

export const DISCOVERY_META: AgentMeta = {
  label: "Project discovery...",
  short: "Discovery",
  icon: "edit_note",
  iconBg: "bg-cyan-500/20",
  iconColor: "text-cyan-400",
};

/** Resolve agent metadata with a safe fallback for unknown node names. */
export function getAgentMeta(agent?: string | null): AgentMeta {
  if (!agent) return FALLBACK_META;
  if (agent === "discovery") return DISCOVERY_META;

  // LangGraph node names emitted before chat_service mapping (legacy / direct)
  const nodeAliases: Record<string, AgentKey> = {
    conversation_understanding: "input_understanding",
    project_workflow: "clarification",
    report_generator: "final_report",
  };
  const aliased = nodeAliases[agent];
  if (aliased) return AGENT_META[aliased];

  const key = agent as AgentKey;
  return AGENT_META[key] ?? { ...FALLBACK_META, short: agent.replace(/_/g, " ") };
}

export function isAgentKey(value: string): value is AgentKey {
  return (AGENT_ORDER as readonly string[]).includes(value);
}
