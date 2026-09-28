import OpenAI from "openai";
import { heuristicAnalysis, analyzeText } from "./heuristics";
import { ASPECTS, type AnalysisOptions, type AnalysisResult } from "./types";

export const aiEnabled = Boolean(process.env.OPENAI_API_KEY);

const MAX_CHARS = 60_000;

function buildPrompt(text: string, options: AnalysisOptions) {
  const aspectLines = ASPECTS.filter((a) => options.aspects.includes(a.id)).map(
    (a) => `- ${a.id} (${a.label}): ${a.hint}`,
  );
  const toneMap = {
    gentle: "Encouraging developmental editor. Lead with what works, frame problems as opportunities.",
    balanced: "Professional developmental editor. Honest, specific, constructive.",
    blunt: "Blunt acquisitions editor. No cushioning; name every weakness directly.",
  } as const;
  const depthMap = {
    quick: "Keep each aspect to 2 short bullets.",
    standard: "Give 2-4 substantive bullets per aspect.",
    deep: "Give 4-6 detailed bullets per aspect with textual evidence.",
  } as const;

  return [
    `You are Grammaid, a story analysis engine. Voice: ${toneMap[options.feedbackTone]} ${depthMap[options.depth]}`,
    `Genre: ${options.genre || "unspecified"}. Audience: ${options.audience}. Target POV: ${options.narrativePov}. Target tense: ${options.tense}. Spelling: ${options.spellingVariant.toUpperCase()}.`,
    options.preserveVoice ? "Preserve the author's stylistic voice; never homogenize it." : "",
    options.includeRewrites ? "Include concrete rewritten example lines where useful." : "",
    options.includeComps ? "Include 3-5 comparable published titles in `comps`." : "",
    options.customInstructions ? `Author instructions: ${options.customInstructions}` : "",
    "Analyze these dimensions:",
    ...aspectLines,
    "",
    "Respond with JSON only, matching this shape:",
    `{"overallScore": number 0-10, "headline": string, "summary": string,
 "aspects": [{"id": string, "label": string, "score": number 0-10, "summary": string, "strengths": string[], "issues": string[], "suggestions": string[]}],
 "lineEdits": [{"excerpt": string, "issue": string, "suggestion": string, "severity": "low"|"medium"|"high"}],
 "nextSteps": string[], "comps": string[]}`,
    options.includeLineEdits ? "Include up to 15 lineEdits quoting real excerpts." : "Leave lineEdits empty.",
    "",
    "MANUSCRIPT:",
    text.slice(0, MAX_CHARS),
  ]
    .filter(Boolean)
    .join("\n");
}

export async function runAnalysis(
  text: string,
  options: AnalysisOptions,
): Promise<{ result: AnalysisResult; tokens: number }> {
  if (!aiEnabled) {
    return { result: heuristicAnalysis(text, options), tokens: 0 };
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  try {
    const completion = await client.chat.completions.create({
      model: options.model || "gpt-4o-mini",
      response_format: { type: "json_object" },
      temperature: 0.4,
      messages: [
        { role: "system", content: "You are a meticulous developmental editor. Output valid JSON only." },
        { role: "user", content: buildPrompt(text, options) },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as Partial<AnalysisResult>;
    const stats = analyzeText(text);

    const result: AnalysisResult = {
      overallScore: Number(parsed.overallScore ?? 0),
      headline: parsed.headline ?? "Story analysis",
      summary: parsed.summary ?? "",
      aspects: parsed.aspects ?? [],
      lineEdits: parsed.lineEdits ?? [],
      nextSteps: parsed.nextSteps ?? [],
      comps: parsed.comps,
      stats: {
        ...stats,
        topWords: stats.topWords.map((w) => `${w.word}×${w.count}`).join(", "),
      } as unknown as Record<string, number | string>,
      engine: "openai",
    };
    return { result, tokens: completion.usage?.total_tokens ?? 0 };
  } catch (error) {
    const fallback = heuristicAnalysis(text, options);
    fallback.notes = `AI request failed (${(error as Error).message}); showing local heuristic analysis instead.`;
    return { result: fallback, tokens: 0 };
  }
}
