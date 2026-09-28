"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Clock, FileUp, Loader2, Save, Sparkles, SlidersHorizontal } from "lucide-react";
import { AnalysisReport } from "./analysis-report";
import { OptionsPanel } from "./options-panel";
import type { AnalysisOptions, AnalysisResult } from "@/lib/analysis/types";

export type StoredAnalysis = {
  id: string;
  createdAt: string;
  engine: string;
  result: AnalysisResult;
};

type Props = {
  project: {
    id: string;
    title: string;
    synopsis: string;
    genre: string;
    audience: string;
    content: string;
  };
  analyses: StoredAnalysis[];
  defaults: AnalysisOptions;
  aiEnabled: boolean;
};

export function ProjectWorkspace({ project, analyses, defaults, aiEnabled }: Props) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);

  const [content, setContent] = useState(project.content);
  const [title, setTitle] = useState(project.title);
  const [options, setOptions] = useState<AnalysisOptions>(defaults);
  const [showOptions, setShowOptions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [analysing, setAnalysing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState(analyses);
  const [activeId, setActiveId] = useState(analyses[0]?.id ?? null);

  const words = useMemo(() => (content.match(/\b[\w''-]+\b/g) ?? []).length, [content]);
  const active = history.find((a) => a.id === activeId) ?? null;

  async function save() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, title }),
      });
      if (!res.ok) {
        setError("Could not save your changes.");
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function upload(file: File) {
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/extract", { method: "POST", body: form });
      const data = (await res.json()) as { text?: string; error?: string };
      if (!res.ok || !data.text) {
        setError(data.error ?? "Could not read that file.");
        return;
      }
      setContent((prev) => (prev.trim() ? `${prev}\n\n${data.text}` : (data.text as string)));
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function analyse() {
    setAnalysing(true);
    setError("");
    try {
      await save();
      const res = await fetch(`/api/projects/${project.id}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ options }),
      });
      const data = (await res.json()) as {
        analysis?: { id: string; createdAt: string; engine: string; parsed: AnalysisResult };
        error?: string;
      };
      if (!res.ok || !data.analysis) {
        setError(data.error ?? "Analysis failed.");
        return;
      }
      const entry: StoredAnalysis = {
        id: data.analysis.id,
        createdAt: data.analysis.createdAt,
        engine: data.analysis.engine,
        result: data.analysis.parsed,
      };
      setHistory((prev) => [entry, ...prev]);
      setActiveId(entry.id);
      router.refresh();
    } finally {
      setAnalysing(false);
    }
  }

  return (
    <div className="space-y-6 pt-4">
      <div className="animate-fade-up flex flex-wrap items-center gap-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="Project title"
          className="min-w-0 flex-1 bg-transparent text-3xl font-semibold tracking-tight outline-none focus:underline decoration-indigo-500/50"
        />
        <button type="button" className="btn-ghost glass-hover" onClick={() => setShowOptions((s) => !s)} aria-expanded={showOptions}>
          <SlidersHorizontal size={15} />
          Options
        </button>
        <button type="button" className="btn-ghost glass-hover" onClick={save} disabled={saving}>
          {saving ? <Loader2 size={15} className="animate-spin" /> : saved ? <Check size={15} className="text-emerald-500" /> : <Save size={15} />}
          {saved ? "Saved" : "Save"}
        </button>
        <button type="button" className="btn-primary" onClick={analyse} disabled={analysing || words < 10}>
          {analysing ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
          {analysing ? "Analysing…" : "Analyse story"}
        </button>
      </div>

      {error && <p className="glass animate-fade-up px-4 py-3 text-sm text-red-500">{error}</p>}

      {showOptions && (
        <div className="glass animate-fade-up p-6">
          <OptionsPanel options={options} onChange={setOptions} aiEnabled={aiEnabled} />
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="glass animate-fade-up flex flex-col p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs muted">
              {words.toLocaleString()} words · ~{Math.max(1, Math.round(words / 230))} min read
            </div>
            <div className="flex items-center gap-2">
              <input
                ref={fileInput}
                type="file"
                accept=".txt,.md,.markdown,.rtf,.docx,.html,.htm"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void upload(file);
                }}
              />
              <button type="button" className="btn-ghost glass-hover text-xs" onClick={() => fileInput.current?.click()} disabled={uploading}>
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <FileUp size={14} />}
                Upload document
              </button>
            </div>
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onDrop={(e) => {
              const file = e.dataTransfer.files?.[0];
              if (file) {
                e.preventDefault();
                void upload(file);
              }
            }}
            placeholder="Paste your chapter, scene, or full manuscript here — or drop a .docx / .txt / .md file onto this box."
            aria-label="Manuscript text"
            className="input min-h-[460px] flex-1 resize-y font-mono text-sm leading-relaxed"
          />
        </div>

        <div className="glass animate-fade-up p-5">
          <h2 className="flex items-center gap-2 font-semibold">
            <Clock size={15} /> Analysis history
          </h2>
          {history.length === 0 ? (
            <p className="mt-3 text-sm muted">No analyses yet. Paste your text and run one.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {history.map((entry) => (
                <li key={entry.id}>
                  <button
                    type="button"
                    onClick={() => setActiveId(entry.id)}
                    className={`w-full rounded-xl border p-3 text-left text-sm transition-all duration-200 hover:-translate-y-0.5 ${
                      entry.id === activeId ? "border-indigo-500/60 bg-indigo-500/10" : "border-white/15"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{entry.result.overallScore.toFixed(1)}/10</span>
                      <span className="text-[11px] muted">{entry.engine}</span>
                    </div>
                    <p className="mt-1 text-[11px] muted">{new Date(entry.createdAt).toLocaleString()}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {project.synopsis && (
            <div className="mt-6">
              <p className="label">Synopsis</p>
              <p className="text-sm muted">{project.synopsis}</p>
            </div>
          )}
        </div>
      </div>

      {analysing && (
        <div className="glass animate-fade-up relative overflow-hidden p-6">
          <p className="text-sm muted">Reading your manuscript and scoring each craft dimension…</p>
          <div className="absolute inset-x-0 bottom-0 h-1 overflow-hidden">
            <div className="h-full w-1/3 animate-shimmer bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
          </div>
        </div>
      )}

      {active && <AnalysisReport result={active.result} createdAt={active.createdAt} />}
    </div>
  );
}
