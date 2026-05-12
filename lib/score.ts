/**
 * Composite scoring for HACK-26.
 *
 * Final score = 0.25 × AI + 0.50 × Júri humano + 0.25 × Júri popular
 *
 * Each component is normalized to a 0–10 scale before weighting. If a
 * component has no data, it's skipped and the remaining weights are
 * renormalized — so an unjudged project still gets a meaningful number
 * out of whichever signals exist.
 */

import { avgScore } from "./db/queries";
import type {
  EvaluationRow,
  JudgeEvaluationRow,
  PopularVoteRow,
} from "./db/schema";

export const WEIGHT_AI = 0.25;
export const WEIGHT_JURI = 0.5;
export const WEIGHT_POPULAR = 0.25;

const DIMS = ["vibe", "originalidade", "execucao", "viabilidade"] as const;

export type ScoreBreakdown = {
  ai: number | null;
  juri: number | null;
  popular: number | null;
  /** How many human judges have evaluated. */
  juriCount: number;
  /** How many popular votes. */
  popularCount: number;
  /** Final composite (0–10) — null if no component has data. */
  final: number | null;
};

/** Average AI dimension scores (already 0–10). */
export function aiScore(evals: EvaluationRow[]): number | null {
  if (evals.length === 0) return null;
  return avgScore(evals);
}

/** Average across judges, of each judge's 4-dim average. 0–10 scale. */
export function juriScore(judges: JudgeEvaluationRow[]): number | null {
  if (judges.length === 0) return null;
  const totals = judges.map(
    (j) => (j.vibe + j.originalidade + j.execucao + j.viabilidade) / DIMS.length,
  );
  return totals.reduce((a, b) => a + b, 0) / totals.length;
}

/**
 * Popular vote score: average 1–5 stars, mapped linearly to 0–10
 * (1★→0, 3★→5, 5★→10). Returns null if no votes.
 */
export function popularScore(votes: PopularVoteRow[]): number | null {
  if (votes.length === 0) return null;
  const avgStars = votes.reduce((a, v) => a + v.stars, 0) / votes.length;
  return ((avgStars - 1) / 4) * 10;
}

/** Combine the 3 sources into one final score. Renormalizes when missing. */
export function compositeScore(input: {
  ai: number | null;
  juri: number | null;
  popular: number | null;
}): number | null {
  const parts: { value: number; weight: number }[] = [];
  if (input.ai != null) parts.push({ value: input.ai, weight: WEIGHT_AI });
  if (input.juri != null) parts.push({ value: input.juri, weight: WEIGHT_JURI });
  if (input.popular != null) {
    parts.push({ value: input.popular, weight: WEIGHT_POPULAR });
  }
  if (parts.length === 0) return null;
  const totalWeight = parts.reduce((a, p) => a + p.weight, 0);
  const weighted = parts.reduce((a, p) => a + p.value * p.weight, 0);
  return weighted / totalWeight;
}

/** One-shot calculator that takes the raw rows and returns the breakdown. */
export function scoreBreakdown(
  evals: EvaluationRow[],
  judges: JudgeEvaluationRow[],
  votes: PopularVoteRow[],
): ScoreBreakdown {
  const ai = aiScore(evals);
  const juri = juriScore(judges);
  const popular = popularScore(votes);
  return {
    ai,
    juri,
    popular,
    juriCount: judges.length,
    popularCount: votes.length,
    final: compositeScore({ ai, juri, popular }),
  };
}
