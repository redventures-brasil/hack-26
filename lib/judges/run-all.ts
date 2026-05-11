/**
 * Pipeline orchestrator: fetch repo evidence, run 4 judges in parallel,
 * persist evaluations, update submission status.
 *
 * Uses real AI when AI_GATEWAY_API_KEY or ANTHROPIC_API_KEY is set;
 * otherwise falls back to the deterministic mock (so `npm run dev`
 * works with zero env vars).
 */

import {
  getSubmission,
  updateSubmissionStatus,
  upsertEvaluation,
} from "../db/queries";
import { fetchRepoEvidence } from "../evidence/fetch-repo";
import { aiAvailable, aiJudge, AI_MODEL } from "./ai";
import { mockJudge, MOCK_MODEL } from "./mock";
import type { Dimension, DimensionEvalOutput } from "./schema";

const ALL_DIMS: Dimension[] = [
  "vibe",
  "originalidade",
  "execucao",
  "viabilidade",
];

export async function runEvaluation(
  submissionId: string,
  options: { only?: Dimension } = {},
): Promise<void> {
  const sub = await getSubmission(submissionId);
  if (!sub) {
    console.warn(`[evaluate ${submissionId}] no submission found`);
    return;
  }

  await updateSubmissionStatus(submissionId, {
    status: "evaluating",
    errorMessage: null,
  });

  let repo: Awaited<ReturnType<typeof fetchRepoEvidence>>;
  try {
    repo = await fetchRepoEvidence(sub.githubUrl);
  } catch (e) {
    await updateSubmissionStatus(submissionId, {
      status: "failed",
      errorMessage: `falha ao consultar github: ${(e as Error).message}`,
    });
    return;
  }

  if (!repo.exists && repo.error) {
    // Repo unreachable — record failure (still run non-repo dims so we
    // have *something* for vibe/viabilidade).
    await updateSubmissionStatus(submissionId, {
      status: "failed",
      errorMessage: repo.error,
    });
    return;
  }

  const targetDims = options.only ? [options.only] : ALL_DIMS;
  const useAi = aiAvailable();
  const judge = async (d: Dimension): Promise<DimensionEvalOutput> => {
    if (useAi) {
      try {
        return await aiJudge(d, sub, repo);
      } catch (e) {
        console.warn(
          `[evaluate ${submissionId}] AI judge for ${d} failed, falling back to mock`,
          e,
        );
        return mockJudge(d, sub, repo);
      }
    }
    return mockJudge(d, sub, repo);
  };

  const results = await Promise.allSettled(
    targetDims.map(async (d) => ({
      dim: d,
      out: await judge(d),
    })),
  );

  let successes = 0;
  for (const r of results) {
    if (r.status !== "fulfilled") continue;
    const { dim, out } = r.value;
    await upsertEvaluation({
      id: `eval-${submissionId}-${dim}-${Date.now().toString(36)}`,
      submissionId,
      dimension: dim,
      score: out.score,
      oneLiner: out.one_liner,
      strengths: JSON.stringify(out.strengths),
      weaknesses: JSON.stringify(out.weaknesses),
      evidenceUsed: JSON.stringify(out.evidence_used),
      reasoning: out.reasoning,
      model: useAi ? AI_MODEL : MOCK_MODEL,
    });
    successes++;
  }

  // Terminal state: done if we got at least 3 of 4 (or all of the
  // requested dims when re-running a single one).
  const okThreshold = options.only ? 1 : 3;
  if (successes >= okThreshold) {
    await updateSubmissionStatus(submissionId, {
      status: "done",
      evaluatedAt: new Date(),
      errorMessage: null,
    });
  } else {
    await updateSubmissionStatus(submissionId, {
      status: "failed",
      errorMessage: `apenas ${successes}/${targetDims.length} juízes concluíram`,
    });
  }
}
