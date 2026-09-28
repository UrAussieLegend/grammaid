import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, FileUp, Gauge, Sparkles, Users, Wand2 } from "lucide-react";
import { auth } from "@/lib/auth";
import { ASPECTS } from "@/lib/analysis/types";

const FEATURES = [
  {
    icon: FileUp,
    title: "Paste or upload",
    body: "Drop in a chapter, paste a scene, or upload .docx, .md, .txt, .rtf and .html manuscripts.",
  },
  {
    icon: Gauge,
    title: "Every aspect scored",
    body: "Twelve craft dimensions from structure and pacing to POV drift and readability, each with a score.",
  },
  {
    icon: Wand2,
    title: "Line-level edits",
    body: "Run-ons, adverb stacks, filter words and passive constructions, quoted with a fix for each.",
  },
  {
    icon: Users,
    title: "Tuned to your book",
    body: "Set genre, audience, POV, tense, feedback tone and depth — or write your own editor brief.",
  },
];

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="space-y-20 pt-10">
      <section className="animate-fade-up text-center">
        <span className="glass inline-flex items-center gap-2 px-3 py-1 text-xs font-medium">
          <Sparkles size={13} className="text-indigo-500" />
          Story analysis for people who finish drafts
        </span>
        <h1 className="mt-6 text-balance text-5xl font-semibold tracking-tight sm:text-7xl">
          Your draft,{" "}
          <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500 bg-clip-text text-transparent">
            broken down
          </span>{" "}
          aspect by aspect.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-balance text-lg muted">
          Grammaid reads your manuscript the way a developmental editor does — structure, characters,
          pacing, dialogue, prose, theme — then hands you a scored report and a revision plan.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link href="/signup" className="btn-primary px-6 py-3 text-base">
            Start analysing free
            <ArrowRight size={17} />
          </Link>
          <Link href="/login" className="btn-ghost px-6 py-3 text-base glass-hover">
            I already have an account
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map(({ icon: Icon, title, body }, i) => (
          <div
            key={title}
            className="glass glass-hover animate-fade-up p-5"
            style={{ animationDelay: `${i * 90}ms` }}
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-pink-500/20 text-indigo-500 dark:text-indigo-300">
              <Icon size={18} />
            </span>
            <h3 className="mt-4 font-semibold">{title}</h3>
            <p className="mt-1.5 text-sm muted">{body}</p>
          </div>
        ))}
      </section>

      <section className="glass animate-fade-up p-8">
        <h2 className="text-2xl font-semibold tracking-tight">Twelve dimensions, one pass</h2>
        <p className="mt-2 max-w-2xl text-sm muted">
          Toggle any dimension on or off per analysis. Each returns a score, what is working, what is
          not, and concrete next actions.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ASPECTS.map((aspect, i) => (
            <div
              key={aspect.id}
              className="glass glass-hover animate-fade-up p-4"
              style={{ animationDelay: `${i * 45}ms` }}
            >
              <p className="text-sm font-medium">{aspect.label}</p>
              <p className="mt-1 text-xs muted">{aspect.hint}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
