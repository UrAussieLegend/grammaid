"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, Lightbulb } from "lucide-react";
import type { AnalysisResult } from "@/lib/analysis/types";

function scoreColor(score: number) {
  if (score >= 8) return "from-emerald-500 to-teal-500";
  if (score >= 6) return "from-indigo-500 to-violet-500";
  if (score >= 4) return "from-amber-500 to-orange-500";
  return "from-rose-500 to-red-500";
}

function ScoreRing({ score }: { score: number }) {
  return (
    <div className="relative grid h-16 w-16 shrink-0 place-items-center">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="27" fill="none" strokeWidth="5" className="stroke-current opacity-15" />
        <circle
          cx="32" cy="32" r="27" fill="none" strokeWidth="5" strokeLinecap="round"
          className="stroke-indigo-500 transition-all duration-1000"
          strokeDasharray={`${(score / 10) * 169.6} 169.6`}
        />
      </svg>
      <span className="text-lg font-semibold">{score.toFixed(1)}</span>
    </div>
  );
}

const SEVERITY: Record<string, string> = {
  high: "bg-rose-500/15 text-rose-500",
  medium: "bg-amber-500/15 text-amber-500",
  low: "bg-sky-500/15 text-sky-500",
};

export function AnalysisReport({ result, createdAt }: { result: AnalysisResult; createdAt?: string }) {
  const [openAspect, setOpenAspect] = useState<string | null>(result.aspects[0]?.id ?? null);

  return (
    <div className="space-y-5">
      <div className="glass animate-fade-up p-6">
        <div className="flex items-start gap-5">
          <ScoreRing score={result.overallScore} />
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide muted">
              {result.engine === "openai" ? "AI analysis" : "Heuristic analysis"}
              {createdAt ? ` · ${new Date(createdAt).toLocaleString()}` : ""}
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight">{result.headline}</h2>
            <p className="mt-2 text-sm muted">{result.summary}</p>
            {result.notes && <p className="mt-3 rounded-xl bg-amber-500/10 px-3 py-2 text-xs text-amber-600 dark:text-amber-400">{result.notes}</p>}
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(result.stats)
          .filter(([key]) => ["words", "sentences", "avgSentenceLength", "dialoguePercent", "fleschReadingEase", "gradeLevel", "adverbPercent", "estimatedReadingMinutes"].includes(key))
          .map(([key, value], i) => (
            <div key={key} className="glass animate-fade-up p-4" style={{ animationDelay: `${i * 50}ms` }}>
              <p className="text-[11px] uppercase tracking-wide muted">{key.replace(/([A-Z])/g, " $1").toLowerCase()}</p>
              <p className="mt-1 text-xl font-semibold">{typeof value === "number" ? value.toLocaleString() : value}</p>
            </div>
          ))}
      </div>

      <div className="space-y-2.5">
        {result.aspects.map((aspect, i) => {
          const open = openAspect === aspect.id;
          return (
            <div key={aspect.id} className="glass animate-fade-up overflow-hidden" style={{ animationDelay: `${i * 40}ms` }}>
              <button
                type="button"
                onClick={() => setOpenAspect(open ? null : aspect.id)}
                className="flex w-full items-center gap-4 p-4 text-left transition hover:bg-white/15 dark:hover:bg-white/5"
                aria-expanded={open}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{aspect.label}</h3>
                    <span className="text-xs muted">{aspect.score.toFixed(1)}/10</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${scoreColor(aspect.score)} transition-all duration-1000`}
                      style={{ width: `${Math.max(4, aspect.score * 10)}%` }}
                    />
                  </div>
                  {!open && <p className="mt-2 line-clamp-1 text-xs muted">{aspect.summary}</p>}
                </div>
                <ChevronDown size={17} className={`shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
              </button>

              {open && (
                <div className="animate-fade-up space-y-4 border-t border-white/10 p-5 pt-4 text-sm">
                  <p>{aspect.summary}</p>
                  {aspect.strengths.length > 0 && (
                    <div>
                      <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-500">
                        <CheckCircle2 size={13} /> Working
                      </p>
                      <ul className="list-disc space-y-1 pl-5 muted">
                        {aspect.strengths.map((s) => <li key={s}>{s}</li>)}
                      </ul>
                    </div>
                  )}
                  {aspect.issues.length > 0 && (
                    <div>
                      <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-500">
                        <AlertTriangle size={13} /> Needs work
                      </p>
                      <ul className="list-disc space-y-1 pl-5 muted">
                        {aspect.issues.map((s) => <li key={s}>{s}</li>)}
                      </ul>
                    </div>
                  )}
                  {aspect.suggestions.length > 0 && (
                    <div>
                      <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-indigo-500">
                        <Lightbulb size={13} /> Try this
                      </p>
                      <ul className="list-disc space-y-1 pl-5 muted">
                        {aspect.suggestions.map((s) => <li key={s}>{s}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {result.lineEdits.length > 0 && (
        <div className="glass animate-fade-up p-5">
          <h3 className="font-semibold">Line edits ({result.lineEdits.length})</h3>
          <div className="mt-4 space-y-3">
            {result.lineEdits.map((edit, i) => (
              <div key={`${edit.excerpt}-${i}`} className="rounded-xl border border-white/15 p-3.5">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${SEVERITY[edit.severity] ?? SEVERITY.low}`}>
                    {edit.severity}
                  </span>
                  <p className="text-xs muted">{edit.issue}</p>
                </div>
                <p className="mt-2 border-l-2 border-indigo-500/50 pl-3 text-sm italic">{edit.excerpt}</p>
                <p className="mt-2 text-sm muted">→ {edit.suggestion}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {result.comps && result.comps.length > 0 && (
        <div className="glass animate-fade-up p-5">
          <h3 className="font-semibold">Comparable titles</h3>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm muted">
            {result.comps.map((c) => <li key={c}>{c}</li>)}
          </ul>
        </div>
      )}

      {result.nextSteps.length > 0 && (
        <div className="glass animate-fade-up p-5">
          <h3 className="font-semibold">Revision plan</h3>
          <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm muted">
            {result.nextSteps.map((s) => <li key={s}>{s}</li>)}
          </ol>
        </div>
      )}
    </div>
  );
}
