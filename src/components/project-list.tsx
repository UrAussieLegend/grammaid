"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BarChart3, FileText, Loader2, Plus, Trash2, X } from "lucide-react";

export type ProjectSummary = {
  id: string;
  title: string;
  genre: string;
  audience: string;
  wordCount: number;
  updatedAt: string;
  analyses: number;
};

const GENRES = [
  "Literary fiction", "Fantasy", "Science fiction", "Mystery", "Thriller", "Romance",
  "Horror", "Historical", "Young adult", "Middle grade", "Memoir", "Non-fiction", "Screenplay",
];

export function ProjectList({ projects, userName }: { projects: ProjectSummary[]; userName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [audience, setAudience] = useState("adult");
  const [synopsis, setSynopsis] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function create(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, genre, audience, synopsis }),
      });
      const data = (await res.json()) as { project?: { id: string }; error?: string };
      if (!res.ok || !data.project) {
        setError(data.error ?? "Could not create the project.");
        return;
      }
      router.push(`/projects/${data.project.id}`);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this project and all of its analyses?")) return;
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-7 pt-4">
      <div className="animate-fade-up flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Hello, {userName.split(" ")[0]}</h1>
          <p className="mt-1 text-sm muted">
            {projects.length
              ? `${projects.length} project${projects.length === 1 ? "" : "s"} in your workspace.`
              : "Create your first project to start analysing."}
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setOpen(true)}>
          <Plus size={16} />
          New project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="glass animate-fade-up grid place-items-center p-16 text-center">
          <FileText size={30} className="text-indigo-500" />
          <p className="mt-4 font-medium">No projects yet</p>
          <p className="mt-1 max-w-sm text-sm muted">
            A project holds one manuscript, its analysis history, and the preferences you use to
            review it.
          </p>
          <button type="button" className="btn-primary mt-5" onClick={() => setOpen(true)}>
            <Plus size={16} /> Create a project
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, i) => (
            <div
              key={project.id}
              className="glass glass-hover animate-fade-up group relative p-5"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <Link href={`/projects/${project.id}`} className="block">
                <h2 className="pr-7 text-lg font-semibold tracking-tight">{project.title}</h2>
                <p className="mt-1 text-xs muted">
                  {[project.genre || "No genre", project.audience || "any audience"].join(" · ")}
                </p>
                <div className="mt-5 flex items-center gap-4 text-xs muted">
                  <span className="inline-flex items-center gap-1.5">
                    <FileText size={13} />
                    {project.wordCount.toLocaleString()} words
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <BarChart3 size={13} />
                    {project.analyses} analys{project.analyses === 1 ? "is" : "es"}
                  </span>
                </div>
                <p className="mt-3 text-[11px] muted">
                  Updated {new Date(project.updatedAt).toLocaleDateString()}
                </p>
              </Link>
              <button
                type="button"
                aria-label={`Delete ${project.title}`}
                onClick={() => remove(project.id)}
                className="absolute right-3 top-3 rounded-lg p-1.5 opacity-0 transition hover:bg-red-500/15 hover:text-red-500 group-hover:opacity-100"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-sm">
          <form onSubmit={create} className="glass animate-fade-up w-full max-w-lg p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">New project</h2>
                <p className="mt-1 text-sm muted">You can change all of this later.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="rounded-lg p-1.5 hover:bg-white/20">
                <X size={17} />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="label" htmlFor="title">Title</label>
                <input id="title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="genre">Genre</label>
                  <select id="genre" className="input" value={genre} onChange={(e) => setGenre(e.target.value)}>
                    <option value="">Unspecified</option>
                    {GENRES.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="audience">Audience</label>
                  <select id="audience" className="input" value={audience} onChange={(e) => setAudience(e.target.value)}>
                    {["children", "middle grade", "young adult", "adult", "academic", "general"].map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="label" htmlFor="synopsis">Synopsis or intent (optional)</label>
                <textarea id="synopsis" className="input h-24 resize-y" value={synopsis} onChange={(e) => setSynopsis(e.target.value)} />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={busy}>
                {busy && <Loader2 size={15} className="animate-spin" />}
                Create project
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
