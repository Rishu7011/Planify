"use client";

interface FeasibilityViewerProps {
  data: any;
}

const COMPLEXITY_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  low: { color: "text-emerald-400", bg: "bg-emerald-500/20 border-emerald-500/30", label: "Low Complexity" },
  medium: { color: "text-amber-400", bg: "bg-amber-500/20 border-amber-500/30", label: "Medium Complexity" },
  high: { color: "text-red-400", bg: "bg-red-500/20 border-red-500/30", label: "High Complexity" },
};

export function FeasibilityViewer({ data }: FeasibilityViewerProps) {
  if (!data) {
    return (
      <div className="flex flex-col items-center py-16 text-center text-slate-500">
        <p className="text-lg">Feasibility assessment not generated yet.</p>
      </div>
    );
  }

  const complexity = COMPLEXITY_CONFIG[data.complexity_signal] || COMPLEXITY_CONFIG.medium;

  return (
    <div className="space-y-5">
      {/* Complexity badge */}
      <div className="flex items-center gap-4 rounded-2xl border border-white/5 bg-slate-900/60 p-6">
        <div className={`flex-shrink-0 rounded-xl border px-4 py-3 ${complexity.bg}`}>
          <p className="text-xs font-medium text-slate-400 mb-0.5">Complexity</p>
          <p className={`text-xl font-bold ${complexity.color}`}>{complexity.label}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-white mb-1">Technical Assessment</p>
          <p className="text-sm text-slate-400">
            {data.complexity_signal === "high"
              ? "Significant engineering challenges. Plan for longer timelines and senior talent."
              : data.complexity_signal === "medium"
              ? "Moderate technical complexity. Standard practices apply with some custom work."
              : "Straightforward implementation. Standard tooling and practices should suffice."}
          </p>
        </div>
      </div>

      {/* Technical Approach */}
      <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-6">
        <h3 className="text-lg font-semibold text-violet-300 mb-3 flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-violet-400" />
          Technical Approach
        </h3>
        <p className="text-slate-300 leading-relaxed">{data.technical_approach}</p>
      </div>

      {/* Key Risks */}
      {data.key_risks?.length > 0 && (
        <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-6">
          <h3 className="text-lg font-semibold text-violet-300 mb-4 flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-violet-400" />
            Key Risks & Mitigations
          </h3>
          <div className="space-y-3">
            {data.key_risks.map((risk: string, i: number) => (
              <div key={i} className="flex items-start gap-3 rounded-xl bg-red-950/20 border border-red-500/10 px-4 py-3">
                <svg className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-sm text-slate-300">{risk}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Critical Dependencies */}
      {data.critical_dependencies?.length > 0 && (
        <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-6">
          <h3 className="text-lg font-semibold text-violet-300 mb-4 flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-violet-400" />
            Critical Dependencies
          </h3>
          <div className="flex flex-wrap gap-2">
            {data.critical_dependencies.map((dep: string, i: number) => (
              <span key={i} className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-3 py-1.5 text-sm text-indigo-300">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                {dep}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Regulatory Notes */}
      {data.regulatory_notes && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-950/20 p-4">
          <p className="text-xs font-semibold text-amber-400 mb-2 uppercase tracking-wider">Regulatory Considerations</p>
          <p className="text-sm text-amber-200/80">{data.regulatory_notes}</p>
        </div>
      )}
    </div>
  );
}
