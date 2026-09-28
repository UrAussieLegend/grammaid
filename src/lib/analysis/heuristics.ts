import {
  ASPECTS,
  type AnalysisOptions,
  type AnalysisResult,
  type AspectReport,
  type LineEdit,
} from "./types";

const FILTER_WORDS = [
  "saw", "heard", "felt", "noticed", "realized", "thought", "wondered", "seemed",
  "watched", "looked", "decided", "knew", "remembered",
];
const WEAK_WORDS = ["very", "really", "just", "quite", "somewhat", "actually", "literally", "basically"];
const PASSIVE_AUX = ["was", "were", "is", "are", "been", "being", "be"];
const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "if", "of", "to", "in", "on", "at", "for", "with",
  "as", "by", "from", "that", "this", "it", "its", "was", "were", "is", "are", "be", "been",
  "he", "she", "they", "them", "his", "her", "their", "i", "you", "we", "my", "me", "him",
  "not", "no", "so", "then", "than", "there", "here", "had", "have", "has", "did", "do",
  "would", "could", "should", "will", "what", "when", "which", "who", "all", "up", "out",
  "into", "about", "over", "back", "like", "said", "one", "now", "just", "down", "off",
]);

export function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  if (w.length <= 3) return 1;
  const cleaned = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").replace(/^y/, "");
  const groups = cleaned.match(/[aeiouy]{1,2}/g);
  return Math.max(1, groups ? groups.length : 1);
}

export type TextStats = {
  words: number;
  sentences: number;
  paragraphs: number;
  uniqueWords: number;
  avgSentenceLength: number;
  longestSentence: number;
  sentenceVariety: number;
  dialoguePercent: number;
  adverbPercent: number;
  passivePercent: number;
  filterWordCount: number;
  weakWordCount: number;
  fleschReadingEase: number;
  gradeLevel: number;
  topWords: { word: string; count: number }[];
  overusedWords: { word: string; count: number }[];
  estimatedReadingMinutes: number;
};

export function analyzeText(text: string): TextStats {
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
  const sentenceList = text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const wordList = text.toLowerCase().match(/\b[a-z''-]+\b/g) ?? [];
  const words = wordList.length || 1;

  const sentenceLengths = sentenceList.map((s) => (s.match(/\b[\w''-]+\b/g) ?? []).length);
  const avgSentenceLength = sentenceLengths.length
    ? sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length
    : 0;
  const variance = sentenceLengths.length
    ? sentenceLengths.reduce((a, b) => a + (b - avgSentenceLength) ** 2, 0) / sentenceLengths.length
    : 0;

  const dialogueChars = (text.match(/[“"][^“”"]*[”"]/g) ?? []).join("").length;
  const adverbs = wordList.filter((w) => w.endsWith("ly") && w.length > 4).length;
  const passive = (
    text.toLowerCase().match(new RegExp(`\\b(${PASSIVE_AUX.join("|")})\\s+\\w+(ed|en)\\b`, "g")) ?? []
  ).length;

  const freq = new Map<string, number>();
  for (const w of wordList) {
    if (STOPWORDS.has(w) || w.length < 4) continue;
    freq.set(w, (freq.get(w) ?? 0) + 1);
  }
  const sortedFreq = Array.from(freq.entries()).sort((a, b) => b[1] - a[1]);
  const per1k = (count: number) => (count / words) * 1000;

  const syllables = wordList.reduce((a, w) => a + countSyllables(w), 0);
  const sentences = sentenceList.length || 1;
  const fleschReadingEase = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
  const gradeLevel = 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59;

  return {
    words: wordList.length,
    sentences: sentenceList.length,
    paragraphs: paragraphs.length,
    uniqueWords: new Set(wordList).size,
    avgSentenceLength: round(avgSentenceLength),
    longestSentence: sentenceLengths.length ? Math.max(...sentenceLengths) : 0,
    sentenceVariety: round(Math.sqrt(variance)),
    dialoguePercent: round((dialogueChars / Math.max(text.length, 1)) * 100),
    adverbPercent: round((adverbs / words) * 100),
    passivePercent: round((passive / Math.max(sentences, 1)) * 100),
    filterWordCount: wordList.filter((w) => FILTER_WORDS.includes(w)).length,
    weakWordCount: wordList.filter((w) => WEAK_WORDS.includes(w)).length,
    fleschReadingEase: round(fleschReadingEase),
    gradeLevel: round(Math.max(0, gradeLevel)),
    topWords: sortedFreq.slice(0, 12).map(([word, count]) => ({ word, count })),
    overusedWords: sortedFreq.filter(([, c]) => per1k(c) > 3 && c > 3).slice(0, 10).map(([word, count]) => ({ word, count })),
    estimatedReadingMinutes: round(wordList.length / 230),
  };
}

function round(n: number) {
  return Math.round(n * 10) / 10;
}

function clamp(n: number) {
  return Math.max(1, Math.min(10, Math.round(n * 10) / 10));
}

export function findLineIssues(text: string, limit = 25): LineEdit[] {
  const edits: LineEdit[] = [];
  const sentences = text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  for (const sentence of sentences) {
    if (edits.length >= limit) break;
    const wordCount = (sentence.match(/\b[\w''-]+\b/g) ?? []).length;
    const lower = sentence.toLowerCase();

    if (wordCount > 45) {
      edits.push({
        excerpt: truncate(sentence),
        issue: `Run-on sentence (${wordCount} words) strains reader attention.`,
        suggestion: "Split into two or three beats, or convert a clause into its own sentence.",
        severity: "high",
      });
      continue;
    }
    const adverbs = (lower.match(/\b\w{4,}ly\b/g) ?? []).filter((w) => w !== "only" && w !== "early");
    if (adverbs.length >= 2) {
      edits.push({
        excerpt: truncate(sentence),
        issue: `Adverb stacking: ${adverbs.slice(0, 3).join(", ")}.`,
        suggestion: "Replace adverbs with stronger verbs so the action carries the emphasis.",
        severity: "medium",
      });
      continue;
    }
    const passiveMatch = lower.match(new RegExp(`\\b(${PASSIVE_AUX.join("|")})\\s+\\w+(ed|en)\\b`));
    if (passiveMatch) {
      edits.push({
        excerpt: truncate(sentence),
        issue: `Passive construction: "${passiveMatch[0]}".`,
        suggestion: "Put the actor in front of the verb to tighten the line.",
        severity: "low",
      });
      continue;
    }
    const filter = FILTER_WORDS.find((f) => new RegExp(`\\b${f}\\b`).test(lower));
    if (filter) {
      edits.push({
        excerpt: truncate(sentence),
        issue: `Filter word "${filter}" distances the reader from the POV character.`,
        suggestion: "Render the perception directly instead of narrating the act of perceiving.",
        severity: "medium",
      });
      continue;
    }
    const weak = WEAK_WORDS.find((w) => new RegExp(`\\b${w}\\b`).test(lower));
    if (weak) {
      edits.push({
        excerpt: truncate(sentence),
        issue: `Hedge word "${weak}" softens the prose.`,
        suggestion: "Delete the qualifier; the sentence usually reads stronger without it.",
        severity: "low",
      });
    }
  }
  return edits;
}

function truncate(s: string, n = 180) {
  return s.length > n ? `${s.slice(0, n)}…` : s;
}

export function heuristicAnalysis(text: string, options: AnalysisOptions): AnalysisResult {
  const stats = analyzeText(text);
  const selected = new Set<string>(options.aspects);
  const reports: AspectReport[] = [];

  const add = (id: string, build: () => Omit<AspectReport, "id" | "label">) => {
    if (!selected.has(id)) return;
    const meta = ASPECTS.find((a) => a.id === id);
    reports.push({ id, label: meta?.label ?? id, ...build() });
  };

  add("structure", () => {
    const scenes = Math.max(1, Math.round(stats.paragraphs / 8));
    return {
      score: clamp(stats.paragraphs > 6 ? 7 : 5.5),
      summary: `${stats.words.toLocaleString()} words across ${stats.paragraphs} paragraphs (~${scenes} scene units).`,
      strengths: stats.paragraphs > 6 ? ["Text is broken into enough units to carry distinct beats."] : [],
      issues:
        stats.paragraphs < 4
          ? ["Very few paragraph breaks — beats blur together and the arc is hard to track."]
          : [],
      suggestions: [
        "Outline each scene as goal → conflict → outcome and flag any scene without a change in state.",
        "Check that the inciting incident lands inside the first 10–15% of the manuscript.",
      ],
    };
  });

  add("characters", () => {
    const names = (text.match(/\b[A-Z][a-z]{2,}\b/g) ?? []).reduce<Map<string, number>>((m, n) => {
      m.set(n, (m.get(n) ?? 0) + 1);
      return m;
    }, new Map());
    const top = Array.from(names.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
    return {
      score: clamp(top.length >= 2 ? 7 : 5),
      summary: top.length
        ? `Most-referenced proper nouns: ${top.map(([n, c]) => `${n} (${c})`).join(", ")}.`
        : "No recurring proper nouns detected — characters may be referenced only by pronoun.",
      strengths: top.length >= 2 ? ["Multiple recurring figures give the scene relational texture."] : [],
      issues:
        top.length && top[0][1] > stats.words / 60
          ? [`"${top[0][0]}" is named very frequently; consider pronouns or blocking for variety.`]
          : [],
      suggestions: [
        "For each named character, state their want, their obstacle, and what they lose if they fail.",
        "Read each character's dialogue in isolation — can you tell who is speaking without tags?",
      ],
    };
  });

  add("pacing", () => ({
    score: clamp(stats.sentenceVariety > 6 ? 8 : stats.sentenceVariety > 3 ? 6.5 : 4.5),
    summary: `Average sentence ${stats.avgSentenceLength} words, variation ±${stats.sentenceVariety}, longest ${stats.longestSentence} words.`,
    strengths: stats.sentenceVariety > 6 ? ["Sentence rhythm varies well, which keeps momentum alive."] : [],
    issues: [
      ...(stats.sentenceVariety <= 3 ? ["Sentence lengths are uniform — the prose can feel metronomic."] : []),
      ...(stats.avgSentenceLength > 25 ? ["Long average sentence length slows tension in action beats."] : []),
      ...(stats.longestSentence > 60 ? [`One sentence runs ${stats.longestSentence} words.`] : []),
    ],
    suggestions: [
      "Drop a 3–6 word sentence into your highest-tension paragraph to spike the pulse.",
      "Cut the last line of slow scenes — they usually end one beat late.",
    ],
  }));

  add("dialogue", () => ({
    score: clamp(stats.dialoguePercent > 15 && stats.dialoguePercent < 60 ? 7.5 : 5.5),
    summary: `Roughly ${stats.dialoguePercent}% of the text sits inside quotation marks.`,
    strengths:
      stats.dialoguePercent > 15 && stats.dialoguePercent < 60
        ? ["Dialogue-to-narration balance sits in a comfortable commercial range."]
        : [],
    issues:
      stats.dialoguePercent < 10
        ? ["Very little dialogue — scenes may read as summary rather than drama."]
        : stats.dialoguePercent > 60
          ? ["Dialogue-heavy: add grounding action beats so speech does not float."]
          : [],
    suggestions: [
      "Replace 'said + adverb' tags with a physical beat that reveals subtext.",
      "Cut greetings and logistics; enter each exchange as late as possible.",
    ],
  }));

  add("prose", () => ({
    score: clamp(9 - stats.adverbPercent * 1.5 - stats.weakWordCount / Math.max(stats.words / 400, 1)),
    summary: `${stats.adverbPercent}% adverbs, ${stats.weakWordCount} hedge words, ${stats.filterWordCount} filter words.`,
    strengths: stats.adverbPercent < 1.2 ? ["Adverb use is disciplined; verbs are carrying the weight."] : [],
    issues: [
      ...(stats.adverbPercent >= 1.8 ? ["Adverb density above the ~1.5% craft guideline."] : []),
      ...(stats.overusedWords.length
        ? [`Repeated vocabulary: ${stats.overusedWords.slice(0, 5).map((w) => `${w.word} (${w.count})`).join(", ")}.`]
        : []),
    ],
    suggestions: [
      "Search for 'was' + '-ing' and convert to simple past for immediacy.",
      "Vary paragraph openings — avoid three consecutive paragraphs starting with the same subject.",
    ],
  }));

  add("grammar", () => {
    const doubleSpaces = (text.match(/ {2,}/g) ?? []).length;
    const missingCaps = (text.match(/(?<=[.!?]\s)[a-z]/g) ?? []).length;
    const straightQuotes = (text.match(/"/g) ?? []).length;
    return {
      score: clamp(9 - doubleSpaces / 20 - missingCaps / 5),
      summary: `${missingCaps} sentences start lowercase, ${doubleSpaces} double spaces, ${straightQuotes} straight quote marks.`,
      strengths: !missingCaps && !doubleSpaces ? ["Mechanics are clean at the surface level."] : [],
      issues: [
        ...(missingCaps ? [`${missingCaps} sentence(s) appear to start without a capital letter.`] : []),
        ...(doubleSpaces ? [`${doubleSpaces} instances of consecutive spaces.`] : []),
      ],
      suggestions: ["Run a consistency pass on dashes, ellipses, and quotation style before submission."],
    };
  });

  add("pov", () => {
    const first = (text.match(/\b(I|my|me|we)\b/g) ?? []).length;
    const third = (text.match(/\b(he|she|they|him|her|them)\b/gi) ?? []).length;
    const past = (text.match(/\b\w+ed\b/g) ?? []).length;
    const present = (text.match(/\b(is|are|says|walks|runs|looks)\b/g) ?? []).length;
    const pov = first > third ? "first person" : "third person";
    const tense = past > present ? "past" : "present";
    const mixed = Math.min(first, third) / Math.max(first, third, 1) > 0.5;
    return {
      score: clamp(mixed ? 5 : 8),
      summary: `Reads as ${pov}, ${tense} tense (${first} first-person vs ${third} third-person pronouns).`,
      strengths: mixed ? [] : ["POV signal is consistent across the sample."],
      issues: mixed ? ["First- and third-person pronouns appear at similar rates — check for POV drift."] : [],
      suggestions: ["Confirm each scene stays in one head; cut any line the POV character could not perceive."],
    };
  });

  add("worldbuilding", () => {
    const senses = ["smell", "scent", "taste", "sound", "touch", "cold", "heat", "light", "dark"];
    const hits = senses.filter((s) => new RegExp(`\\b${s}`, "i").test(text));
    return {
      score: clamp(3 + hits.length),
      summary: `Sensory channels present: ${hits.length ? hits.join(", ") : "mostly visual only"}.`,
      strengths: hits.length >= 4 ? ["Multiple senses are engaged, which grounds the setting."] : [],
      issues: hits.length < 3 ? ["Setting leans visual; sound, smell, and texture are thin."] : [],
      suggestions: ["Anchor each new location with one concrete, non-visual detail in the first paragraph."],
    };
  });

  add("theme", () => ({
    score: clamp(6.5),
    summary: stats.topWords.length
      ? `Recurring motif candidates: ${stats.topWords.slice(0, 6).map((w) => w.word).join(", ")}.`
      : "Not enough recurring imagery to infer motifs.",
    strengths: [],
    issues: [],
    suggestions: [
      "State the thematic question in one sentence, then check the ending answers it.",
      "Give the antagonist a line that argues the opposite of your theme.",
    ],
  }));

  add("emotion", () => ({
    score: clamp(6),
    summary: "Emotional impact is best judged qualitatively — connect an AI key for a deeper read.",
    strengths: [],
    issues: [],
    suggestions: ["Mark the intended emotion beside each scene and verify the prose earns it."],
  }));

  add("market", () => ({
    score: clamp(6),
    summary: `${stats.words.toLocaleString()} words${options.genre ? ` targeted at ${options.genre}` : ""} for a ${options.audience} audience.`,
    strengths: [],
    issues:
      stats.words < 500
        ? ["Sample is short; market judgements need a fuller manuscript."]
        : [],
    suggestions: ["Draft a one-line hook and test it against three recent comparable titles."],
  }));

  add("readability", () => ({
    score: clamp(stats.fleschReadingEase / 10),
    summary: `Flesch reading ease ${stats.fleschReadingEase}, approx. grade level ${stats.gradeLevel}, ~${stats.estimatedReadingMinutes} min read.`,
    strengths: stats.fleschReadingEase > 60 ? ["Accessible prose for a general readership."] : [],
    issues: stats.fleschReadingEase < 50 ? ["Dense prose — may slow readers outside literary markets."] : [],
    suggestions: ["Match readability to audience: 70+ for middle grade, 55–70 for commercial adult."],
  }));

  const overall = reports.length
    ? Math.round((reports.reduce((a, r) => a + r.score, 0) / reports.length) * 10) / 10
    : 0;

  return {
    overallScore: overall,
    headline: `${stats.words.toLocaleString()}-word draft scored ${overall}/10 across ${reports.length} craft dimensions`,
    summary: `Statistical craft pass: ${stats.sentences} sentences, average ${stats.avgSentenceLength} words, ${stats.dialoguePercent}% dialogue, reading ease ${stats.fleschReadingEase}. Add an OpenAI API key for narrative-level interpretation on top of these measurements.`,
    aspects: reports,
    lineEdits: options.includeLineEdits ? findLineIssues(text) : [],
    stats: { ...stats, topWords: stats.topWords.map((w) => `${w.word}×${w.count}`).join(", ") } as unknown as Record<string, number | string>,
    nextSteps: [
      "Fix the high-severity line edits first — they cost the least and read the loudest.",
      "Re-run the analysis after revision to compare scores between versions.",
    ],
    engine: "heuristic",
    notes: "Generated by Grammaid's local heuristic engine (no AI key configured).",
  };
}
