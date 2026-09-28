"use client";

import { ASPECTS, type AnalysisOptions, type AspectId } from "@/lib/analysis/types";

const MODELS = ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini"];

type Props = {
  options: AnalysisOptions;
  onChange: (options: AnalysisOptions) => void;
  aiEnabled: boolean;
};

export function OptionsPanel({ options, onChange, aiEnabled }: Props) {
  const set = <K extends keyof AnalysisOptions>(key: K, value: AnalysisOptions[K]) =>
    onChange({ ...options, [key]: value });

  const toggleAspect = (id: AspectId) => {
    const next = options.aspects.includes(id)
      ? options.aspects.filter((a) => a !== id)
      : [...options.aspects, id];
    set("aspects", next.length ? next : options.aspects);
  };

  return (
    <div className="space-y-6">
      <section>
        <div className="flex items-center justify-between">
          <p className="label mb-0">Aspects to analyse</p>
          <div className="flex gap-2 text-[11px]">
            <button type="button" className="muted hover:underline" onClick={() => set("aspects", ASPECTS.map((a) => a.id))}>
              All
            </button>
            <button type="button" className="muted hover:underline" onClick={() => set("aspects", ["structure", "characters", "pacing"])}>
              Core
            </button>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {ASPECTS.map((aspect) => {
            const active = options.aspects.includes(aspect.id);
            return (
              <button
                key={aspect.id}
                type="button"
                title={aspect.hint}
                onClick={() => toggleAspect(aspect.id)}
                className={`rounded-full border px-3 py-1 text-xs transition-all duration-200 hover:-translate-y-0.5 ${
                  active
                    ? "border-transparent bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-500/25"
                    : "muted border-white/20 bg-white/20 dark:bg-white/5"
                }`}
                aria-pressed={active}
              >
                {aspect.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="opt-tone">Feedback tone</label>
          <select id="opt-tone" className="input" value={options.feedbackTone} onChange={(e) => set("feedbackTone", e.target.value as AnalysisOptions["feedbackTone"])}>
            <option value="gentle">Gentle — encouraging</option>
            <option value="balanced">Balanced — professional</option>
            <option value="blunt">Blunt — no cushioning</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="opt-depth">Depth</label>
          <select id="opt-depth" className="input" value={options.depth} onChange={(e) => set("depth", e.target.value as AnalysisOptions["depth"])}>
            <option value="quick">Quick pass</option>
            <option value="standard">Standard</option>
            <option value="deep">Deep dive</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="opt-pov">Intended POV</label>
          <select id="opt-pov" className="input" value={options.narrativePov} onChange={(e) => set("narrativePov", e.target.value)}>
            {["auto", "first person", "second person", "third limited", "third omniscient"].map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="opt-tense">Intended tense</label>
          <select id="opt-tense" className="input" value={options.tense} onChange={(e) => set("tense", e.target.value)}>
            {["auto", "past", "present", "mixed"].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="opt-spelling">Spelling</label>
          <select id="opt-spelling" className="input" value={options.spellingVariant} onChange={(e) => set("spellingVariant", e.target.value as "us" | "uk")}>
            <option value="us">US English</option>
            <option value="uk">UK English</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="opt-model">AI model</label>
          <select id="opt-model" className="input" value={options.model} onChange={(e) => set("model", e.target.value)} disabled={!aiEnabled}>
            {MODELS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          {!aiEnabled && <p className="mt-1 text-[11px] muted">No API key configured — the local heuristic engine runs instead.</p>}
        </div>
      </section>

      <section className="space-y-2">
        {([
          ["includeLineEdits", "Include line-level edits"],
          ["includeRewrites", "Suggest rewritten example lines"],
          ["includeComps", "Suggest comparable titles"],
          ["preserveVoice", "Preserve my authorial voice"],
        ] as const).map(([key, label]) => (
          <label key={key} className="flex cursor-pointer items-center gap-2.5 text-sm">
            <input
              type="checkbox"
              checked={options[key]}
              onChange={(e) => set(key, e.target.checked)}
              className="h-4 w-4 cursor-pointer accent-indigo-500"
            />
            {label}
          </label>
        ))}
      </section>

      <section>
        <label className="label" htmlFor="opt-custom">Custom brief for the editor</label>
        <textarea
          id="opt-custom"
          className="input h-24 resize-y"
          placeholder="e.g. This is chapter 3 of a slow-burn romance. Focus on whether the tension between Mara and Idris is earned."
          value={options.customInstructions}
          onChange={(e) => set("customInstructions", e.target.value)}
        />
      </section>
    </div>
  );
}
