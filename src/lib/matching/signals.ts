import { clamp } from "@/lib/format";
import type { ScoreKey } from "@/lib/types";

/**
 * Pure, deterministic signal primitives used by the matching engine.
 *
 * Every function here returns a value in [0, 1] and, where meaningful, a short
 * human-readable explanation. That pairing is what lets the UI show judges the
 * actual reason behind a score instead of a black-box number.
 */

export interface Signal {
  key: ScoreKey;
  label: string;
  weight: number;
  raw: number;
  detail: string;
}

export { clamp };

/** Share of `needed` that appears in `have`. 0 when nothing is needed. */
export function coverage(have: readonly string[], needed: readonly string[]): number {
  if (needed.length === 0) return 0.5;
  const set = new Set(have.map((v) => v.toLowerCase()));
  const hits = needed.filter((n) => set.has(n.toLowerCase())).length;
  return hits / needed.length;
}

/** Symmetric overlap. Good for "do we like the same things". */
export function jaccard(a: readonly string[], b: readonly string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const sa = new Set(a.map((v) => v.toLowerCase()));
  const sb = new Set(b.map((v) => v.toLowerCase()));
  let intersection = 0;
  for (const value of sa) if (sb.has(value)) intersection += 1;
  return intersection / (sa.size + sb.size - intersection);
}

/** How much of `a` is inside `b`. Used for "do you satisfy what I need". */
export function containsRatio(a: readonly string[], b: readonly string[]): number {
  if (b.length === 0) return 0.5;
  const sb = new Set(b.map((v) => v.toLowerCase()));
  return b.filter((v) => sb.has(v.toLowerCase()) && a.map((x) => x.toLowerCase()).includes(v.toLowerCase()))
    .length / b.length;
}

/** Complement: skills the other side does not already have. Rewards diversity. */
export function novelty(have: readonly string[], wanted: readonly string[]): number {
  if (wanted.length === 0) return 0.5;
  const set = new Set(have.map((v) => v.toLowerCase()));
  const fresh = wanted.filter((v) => !set.has(v.toLowerCase()));
  return fresh.length / wanted.length;
}

/** Symmetric preference match. Same value scores 1. */
export function categorical(a: string, b: string): number {
  if (a === b) return 1;
  const related: Record<string, string[]> = {
    veg: ["vegan"],
    vegan: ["veg"],
    non_veg: ["egg_lucky"],
    egg_lucky: ["non_veg"],
    flexible: ["early_bird", "night_owl"],
    early_bird: ["flexible"],
    night_owl: ["flexible"],
    any: ["flexible", "early_bird", "night_owl", "veg", "vegan", "non_veg", "egg_lucky", "no_preference"],
    male: ["any"],
    female: ["any"],
    no_preference: ["any"],
  };
  return (related[a] ?? []).includes(b) ? 0.55 : 0.1;
}

/** Multiplier for a 1-5 cleanliness preference against a host's actual level. */
export function ordinalFit(want: number, actual: number): number {
  const diff = Math.abs(want - actual);
  if (diff === 0) return 1;
  if (diff === 1) return 0.82;
  if (diff === 2) return 0.5;
  return 0.2;
}

/** Exponential distance decay — 0.5x weight per scale kilometres. */
export function distanceDecay(km: number, scale = 6): number {
  if (km <= 0) return 1;
  return Math.exp(-km / scale);
}

/** Linear 1 -> 0 ramp between `best` and `worst`. */
export function ramp(value: number, best: number, worst: number): number {
  if (worst === best) return value === best ? 1 : 0;
  return clamp(1 - (value - best) / (worst - best), 0, 1);
}

/** 1 inside [min, max], falling off over `tolerance` on both sides. */
export function intervalFit(value: number, min: number, max: number, tolerance: number): number {
  if (value >= min && value <= max) return 1;
  const distance = value < min ? min - value : value - max;
  return clamp(1 - distance / Math.max(tolerance, 1), 0, 1);
}

/** Jaccard over availability slots. */
export function slotOverlap(a: readonly string[], b: readonly string[]): number {
  if (a.length === 0 || b.length === 0) return 0.3;
  return jaccard(a, b);
}

/** Reputational trust: rating, verification depth, transaction history. */
export function trust(rating: number, ratingCount: number, transactions: number, verifiedDepth: number): number {
  const ratingScore = clamp((rating - 3.4) / 1.6, 0, 1);
  const volumeScore = clamp(Math.log10(ratingCount + 1) / 2.3, 0, 1);
  const activityScore = clamp(Math.log10(transactions + 1) / 2.4, 0, 1);
  return 0.5 * ratingScore + 0.2 * volumeScore + 0.15 * activityScore + 0.15 * verifiedDepth;
}

const VERIFIED_DEPTH: Record<string, number> = {
  unverified: 0,
  student_id: 0.5,
  college_email: 0.85,
  aadhaar: 1,
};

export function verificationDepth(level: string): number {
  return VERIFIED_DEPTH[level] ?? 0;
}

/** Turn a weighted signal list into a 0-100 score plus per-signal contributions. */
export function aggregate(signals: Signal[]): {
  score: number;
  breakdown: {
    key: ScoreKey;
    label: string;
    raw: number;
    normalized: number;
    weight: number;
    contribution: number;
    detail: string;
  }[];
} {
  const totalWeight = signals.reduce((acc, s) => acc + s.weight, 0);
  if (totalWeight === 0) {
    return { score: 0, breakdown: [] };
  }
  const raw = signals.reduce((acc, s) => acc + s.raw * s.weight, 0) / totalWeight;
  const score = Math.round(clamp(raw, 0, 1) * 100);
  const breakdown = signals
    .map((s) => ({
      key: s.key,
      label: s.label,
      raw: Number(s.raw.toFixed(3)),
      normalized: Math.round(s.raw * 100),
      weight: Number(s.weight.toFixed(3)),
      contribution: Number(((s.raw * s.weight) / totalWeight * 100).toFixed(1)),
      detail: s.detail,
    }))
    .sort((a, b) => b.contribution - a.contribution);
  return { score, breakdown };
}

/** Short headline derived from the strongest signal. */
export function headlineFor(breakdown: { label: string; detail: string }[]): string {
  const top = breakdown[0];
  return top ? `${top.label}: ${top.detail}` : "No strong signals found";
}

export function label(value: number): string {
  if (value >= 0.85) return "Excellent fit";
  if (value >= 0.7) return "Strong fit";
  if (value >= 0.5) return "Decent fit";
  if (value >= 0.3) return "Weak fit";
  return "Poor fit";
}
