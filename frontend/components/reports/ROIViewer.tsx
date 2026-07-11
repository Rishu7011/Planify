"use client";

interface ROIViewerProps {
  data: any;
}

function CostCard({ label, value, subtitle }: { label: string; value: string; subtitle?: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-slate-800/40 p-5">
      <p className="text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">{label}</p>
      <p className="text-xl font-bold text-white">{value}</p>
      {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
    </div>
  );
}

export function ROIViewer({ data }: ROIViewerProps) {
  if (!data) {
    return (
      <div className="flex flex-col items-center py-16 text-center text-slate-500">
        <p className="text-lg">ROI model not generated yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Cost Overview */}
      <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-6">
        <h3 className="text-lg font-semibold text-violet-300 mb-4 flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-violet-400" />
          Cost Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <CostCard label="Development Cost" value={data.development_cost_range} subtitle="One-time build cost" />
          <CostCard label="Infrastructure" value={data.infrastructure_cost_estimate} subtitle="Monthly at MVP scale" />
          <CostCard label="Team Cost" value={data.team_cost_estimate} subtitle="Monthly operating cost" />
        </div>
      </div>

      {/* Scenarios */}
      {data.roi_scenarios?.length > 0 && (
        <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-6">
          <h3 className="text-lg font-semibold text-violet-300 mb-4 flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-violet-400" />
            ROI Scenarios
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.roi_scenarios.map((s: any, i: number) => (
              <div key={i} className="rounded-xl border border-white/5 bg-slate-800/40 p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-semibold text-white">{s.name}</p>
                  <span className="rounded-full bg-slate-700 px-2.5 py-0.5 text-xs text-slate-300">
                    {s.timeline_months}mo timeline
                  </span>
                </div>
                <p className="text-sm text-emerald-400 font-medium mb-2">{s.breakeven}</p>
                {s.notes && <p className="text-xs text-slate-400 leading-relaxed">{s.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Revenue Assumptions */}
      {data.revenue_assumptions?.length > 0 && (
        <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-6">
          <h3 className="text-lg font-semibold text-violet-300 mb-4 flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-violet-400" />
            Revenue Assumptions
          </h3>
          <ul className="space-y-2">
            {data.revenue_assumptions.map((a: string, i: number) => (
              <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                <svg className="h-4 w-4 text-violet-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {a}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Assumptions */}
      {data.assumptions_stated?.length > 0 && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-950/20 p-4">
          <p className="text-xs font-semibold text-amber-400 mb-2 uppercase tracking-wider">Stated Assumptions</p>
          <ul className="space-y-1">
            {data.assumptions_stated.map((a: string, i: number) => (
              <li key={i} className="text-sm text-amber-200/80">{a}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
