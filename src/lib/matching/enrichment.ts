import type { MatchResult } from "@/lib/types";

/**
 * Optional OpenAI-backed match *enrichment*.
 *
 * The deterministic scorer in `engine.ts` is the source of truth and needs no
 * API key. This module adds a natural-language "why this match" paragraph on
 * top of an already-computed score, and only activates when `OPENAI_API_KEY`
 * is present. With no key configured it returns `null` and the UI silently
 * falls back to the deterministic explanation — the app never breaks.
 */

export interface EnrichedReason {
  headline: string;
  paragraph: string;
  source: "openai" | "deterministic";
}

export function openaiEnabled(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

const SYSTEM_PROMPT = [
  "You explain student-to-student matches on CampusLoop, an Indian campus marketplace.",
  "Given a match score and its signal breakdown, write a 2-sentence explanation for a student.",
  "Be specific, warm, and reference concrete details from the breakdown (skills, timings, rupee amounts, campus names).",
  "Never invent facts that are not in the breakdown. Never use bullet points. No preamble.",
].join(" ");

interface ChatResponse {
  choices?: { message?: { content?: string } }[];
}

export async function enrichMatch<T>(
  result: MatchResult<T>,
): Promise<EnrichedReason | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const signalLines = result.breakdown
    .map((b) => `- ${b.label} (${b.normalized}/100, weight ${b.weight}): ${b.detail}`)
    .join("\n");

  const userPrompt = [
    `Match: ${result.title} — ${result.subtitle}`,
    `Domain: ${result.domain}`,
    `Overall score: ${result.score}/100`,
    `Signals:`,
    signalLines,
  ].join("\n");

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        max_tokens: 160,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
      }),
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) return null;
    const json = (await res.json()) as ChatResponse;
    const content = json.choices?.[0]?.message?.content?.trim();
    if (!content) return null;
    return { headline: result.headline, paragraph: content, source: "openai" };
  } catch {
    // Network failure, timeout or bad key — the deterministic headline is fine.
    return null;
  }
}
