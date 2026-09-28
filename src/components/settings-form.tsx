"use client";

import { useState } from "react";
import { Check, Loader2, Save } from "lucide-react";
import { OptionsPanel } from "./options-panel";
import { useTheme, type Theme } from "./theme-provider";
import type { AnalysisOptions } from "@/lib/analysis/types";

export function SettingsForm({ defaults, aiEnabled }: { defaults: AnalysisOptions; aiEnabled: boolean }) {
  const { theme, setTheme } = useTheme();
  const [options, setOptions] = useState(defaults);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await fetch("/api/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ defaults: options, theme }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="glass animate-fade-up p-6">
        <h2 className="font-semibold">Appearance</h2>
        <div className="mt-3 flex gap-2">
          {(["light", "system", "dark"] as Theme[]).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setTheme(value)}
              className={`rounded-xl border px-4 py-2 text-sm capitalize transition-all duration-200 hover:-translate-y-0.5 ${
                theme === value ? "border-transparent bg-gradient-to-r from-indigo-500 to-violet-500 text-white" : "border-white/20"
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <div className="glass animate-fade-up p-6">
        <h2 className="font-semibold">Default analysis options</h2>
        <div className="mt-5">
          <OptionsPanel options={options} onChange={setOptions} aiEnabled={aiEnabled} />
        </div>
        <button type="button" className="btn-primary mt-6" onClick={save} disabled={saving}>
          {saving ? <Loader2 size={15} className="animate-spin" /> : saved ? <Check size={15} /> : <Save size={15} />}
          {saved ? "Saved" : "Save preferences"}
        </button>
      </div>
    </div>
  );
}
