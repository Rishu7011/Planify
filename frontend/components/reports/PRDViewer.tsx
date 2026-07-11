"use client";

interface PRDViewerProps {
  data: any;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/5 bg-slate-900/60 p-6">
      <h3 className="text-lg font-semibold text-violet-300 mb-4 flex items-center gap-2">
        <div className="h-1.5 w-1.5 rounded-full bg-violet-400" />
        {title}
      </h3>
      {children}
    </section>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block rounded-lg bg-slate-800 border border-white/5 px-3 py-1.5 text-sm text-slate-300">
      {children}
    </span>
  );
}

export function PRDViewer({ data }: PRDViewerProps) {
  if (!data) {
    return (
      <div className="flex flex-col items-center py-16 text-center text-slate-500">
        <p className="text-lg">PRD not generated yet.</p>
        <p className="text-sm mt-2">Send a message in the chat to generate reports.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Overview */}
      <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-950/40 to-indigo-950/20 p-6">
        <h2 className="text-2xl font-bold text-white mb-3">{data.overview?.title}</h2>
        <p className="text-slate-300 leading-relaxed">{data.overview?.content}</p>
      </div>

      {/* Problem Statement */}
      <Section title="Problem Statement">
        <p className="text-slate-300 leading-relaxed">{data.problem_statement?.content}</p>
      </Section>

      {/* Goals */}
      {data.goals?.length > 0 && (
        <Section title="Goals">
          <ul className="space-y-2">
            {data.goals.map((g: string, i: number) => (
              <li key={i} className="flex items-start gap-3 text-slate-300">
                <span className="mt-0.5 flex-shrink-0 h-5 w-5 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-xs text-emerald-400 font-bold">{i + 1}</span>
                {g}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Personas */}
      {data.personas?.length > 0 && (
        <Section title="User Personas">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.personas.map((p: any, i: number) => (
              <div key={i} className="rounded-xl border border-white/5 bg-slate-800/40 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {p.name?.[0] || "?"}
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">{p.name}</p>
                    <p className="text-xs text-slate-400">{p.role}</p>
                  </div>
                </div>
                {p.needs?.length > 0 && (
                  <div className="mb-2">
                    <p className="text-xs font-medium text-slate-400 mb-1.5">Needs</p>
                    <ul className="space-y-1">
                      {p.needs.map((n: string, j: number) => (
                        <li key={j} className="text-xs text-slate-300 flex items-start gap-1.5">
                          <span className="text-emerald-400 mt-0.5">+</span> {n}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {p.pain_points?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-slate-400 mb-1.5">Pain Points</p>
                    <ul className="space-y-1">
                      {p.pain_points.map((pp: string, j: number) => (
                        <li key={j} className="text-xs text-slate-300 flex items-start gap-1.5">
                          <span className="text-red-400 mt-0.5">!</span> {pp}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* User Stories */}
      {data.user_stories?.length > 0 && (
        <Section title="User Stories">
          <div className="space-y-2">
            {data.user_stories.map((s: string, i: number) => (
              <div key={i} className="rounded-xl bg-slate-800/40 border border-white/5 px-4 py-3 text-sm text-slate-300">
                {s}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Functional Requirements */}
      {data.functional_requirements?.length > 0 && (
        <Section title="Functional Requirements">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {data.functional_requirements.map((r: string, i: number) => (
              <div key={i} className="flex items-start gap-2 text-sm text-slate-300">
                <svg className="h-4 w-4 text-violet-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {r}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* MVP Definition */}
      {data.mvp_definition && (
        <Section title="MVP Definition">
          <p className="text-slate-300 leading-relaxed">{data.mvp_definition}</p>
        </Section>
      )}

      {/* Success Metrics */}
      {data.success_metrics?.length > 0 && (
        <Section title="Success Metrics">
          <div className="flex flex-wrap gap-2">
            {data.success_metrics.map((m: string, i: number) => <Chip key={i}>{m}</Chip>)}
          </div>
        </Section>
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
