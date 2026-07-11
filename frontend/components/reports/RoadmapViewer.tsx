"use client";

interface RoadmapViewerProps {
  data: any;
}

const PHASE_COLORS = [
  "from-violet-600 to-indigo-600",
  "from-indigo-600 to-blue-600",
  "from-blue-600 to-cyan-600",
  "from-cyan-600 to-teal-600",
  "from-teal-600 to-emerald-600",
];

export function RoadmapViewer({ data }: RoadmapViewerProps) {
  if (!data) {
    return (
      <div className="flex flex-col items-center py-16 text-center text-slate-500">
        <p className="text-lg">Roadmap not generated yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Summary banner */}
      <div className="flex items-center gap-6 rounded-2xl border border-white/5 bg-slate-900/60 p-6">
        <div className="text-center">
          <p className="text-3xl font-bold text-white">{data.total_timeline_weeks}</p>
          <p className="text-xs text-slate-400 mt-0.5">Total Weeks</p>
        </div>
        <div className="h-12 w-px bg-white/10" />
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-300 mb-1">Critical Path</p>
          <p className="text-sm text-slate-400 leading-relaxed">{data.critical_path}</p>
        </div>
      </div>

      {/* Phase timeline */}
      <div className="space-y-4">
        {data.phases?.map((phase: any, i: number) => {
          const gradient = PHASE_COLORS[i % PHASE_COLORS.length];
          return (
            <div key={i} className="rounded-2xl border border-white/5 bg-slate-900/60 overflow-hidden">
              {/* Phase header */}
              <div className={`bg-gradient-to-r ${gradient} p-5`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-lg">{phase.phase_name}</h3>
                  <span className="rounded-full bg-white/20 px-3 py-1 text-sm text-white font-medium">
                    {phase.duration_weeks} weeks
                  </span>
                </div>
                {phase.description && (
                  <p className="text-white/80 text-sm mt-2 leading-relaxed">{phase.description}</p>
                )}
              </div>

              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Milestones */}
                {phase.milestones?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">Milestones</p>
                    <div className="space-y-2">
                      {phase.milestones.map((m: string, j: number) => (
                        <div key={j} className="flex items-start gap-2">
                          <div className="mt-1.5 h-2 w-2 rounded-full bg-violet-400 flex-shrink-0" />
                          <p className="text-sm text-slate-300">{m}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Deliverables */}
                {phase.deliverables?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">Deliverables</p>
                    <div className="space-y-2">
                      {phase.deliverables.map((d: string, j: number) => (
                        <div key={j} className="flex items-start gap-2">
                          <svg className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          <p className="text-sm text-slate-300">{d}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Priority Rationale */}
      {data.priority_rationale && (
        <div className="rounded-xl border border-violet-500/20 bg-violet-950/20 p-4">
          <p className="text-xs font-semibold text-violet-400 mb-2 uppercase tracking-wider">Prioritization Rationale</p>
          <p className="text-sm text-violet-200/80 leading-relaxed">{data.priority_rationale}</p>
        </div>
      )}
    </div>
  );
}
