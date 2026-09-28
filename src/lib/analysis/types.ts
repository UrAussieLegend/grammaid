export const ASPECTS = [
  { id: "structure", label: "Structure & Plot", hint: "Arc, beats, causality, stakes" },
  { id: "characters", label: "Characters", hint: "Agency, arc, distinctiveness" },
  { id: "pacing", label: "Pacing & Tension", hint: "Scene rhythm, momentum, sag points" },
  { id: "dialogue", label: "Dialogue", hint: "Voice, subtext, tags, realism" },
  { id: "prose", label: "Prose & Style", hint: "Rhythm, imagery, clarity, filter words" },
  { id: "grammar", label: "Grammar & Mechanics", hint: "Syntax, punctuation, typos" },
  { id: "pov", label: "POV & Tense", hint: "Consistency, distance, head-hopping" },
  { id: "worldbuilding", label: "Setting & Worldbuilding", hint: "Sensory grounding, logic" },
  { id: "theme", label: "Theme & Meaning", hint: "Motifs, resonance, subtext" },
  { id: "emotion", label: "Emotional Impact", hint: "Reader investment, catharsis" },
  { id: "market", label: "Market & Audience Fit", hint: "Comps, genre conventions, hook" },
  { id: "readability", label: "Readability", hint: "Grade level, sentence variety" },
] as const;

export type AspectId = (typeof ASPECTS)[number]["id"];

export const DEFAULT_ASPECTS: AspectId[] = [
  "structure",
  "characters",
  "pacing",
  "dialogue",
  "prose",
  "grammar",
  "pov",
  "theme",
  "readability",
];

export type AnalysisOptions = {
  aspects: AspectId[];
  genre: string;
  audience: string;
  narrativePov: string;
  tense: string;
  feedbackTone: "gentle" | "balanced" | "blunt";
  depth: "quick" | "standard" | "deep";
  preserveVoice: boolean;
  includeLineEdits: boolean;
  includeRewrites: boolean;
  includeComps: boolean;
  spellingVariant: "us" | "uk";
  customInstructions: string;
  model: string;
};

export const DEFAULT_OPTIONS: AnalysisOptions = {
  aspects: DEFAULT_ASPECTS,
  genre: "",
  audience: "adult",
  narrativePov: "auto",
  tense: "auto",
  feedbackTone: "balanced",
  depth: "standard",
  preserveVoice: true,
  includeLineEdits: true,
  includeRewrites: false,
  includeComps: false,
  spellingVariant: "us",
  customInstructions: "",
  model: "gpt-4o-mini",
};

export type AspectReport = {
  id: string;
  label: string;
  score: number;
  summary: string;
  strengths: string[];
  issues: string[];
  suggestions: string[];
};

export type LineEdit = {
  excerpt: string;
  issue: string;
  suggestion: string;
  severity: "low" | "medium" | "high";
};

export type AnalysisResult = {
  overallScore: number;
  headline: string;
  summary: string;
  aspects: AspectReport[];
  lineEdits: LineEdit[];
  stats: Record<string, number | string>;
  nextSteps: string[];
  comps?: string[];
  engine: "openai" | "heuristic";
  notes?: string;
};

export function normalizeOptions(raw: unknown): AnalysisOptions {
  const input = (raw ?? {}) as Partial<AnalysisOptions>;
  const validAspects = new Set(ASPECTS.map((a) => a.id as string));
  const aspects = (Array.isArray(input.aspects) ? input.aspects : DEFAULT_ASPECTS).filter((a) =>
    validAspects.has(a),
  ) as AspectId[];

  return {
    ...DEFAULT_OPTIONS,
    ...input,
    aspects: aspects.length ? aspects : DEFAULT_ASPECTS,
    customInstructions: (input.customInstructions ?? "").slice(0, 2000),
  };
}
