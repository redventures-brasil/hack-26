import type {
  EvaluationRow,
  JudgeEvaluationRow,
  PopularVoteRow,
  SubmissionRow,
} from "./schema";

const DIMS = ["vibe", "originalidade", "execucao", "viabilidade"] as const;
export type Dimension = (typeof DIMS)[number];

type Backend = {
  listSubmissions(): Promise<SubmissionRow[]>;
  getSubmission(id: string): Promise<SubmissionRow | null>;
  createSubmission(
    v: Omit<
      SubmissionRow,
      "createdAt" | "evaluatedAt" | "errorMessage" | "status"
    > & { status?: SubmissionRow["status"] },
  ): Promise<SubmissionRow>;
  updateSubmissionStatus(
    id: string,
    patch: Partial<
      Pick<SubmissionRow, "status" | "errorMessage" | "evaluatedAt">
    >,
  ): Promise<void>;
  getEvaluations(submissionId: string): Promise<EvaluationRow[]>;
  getEvaluation(
    submissionId: string,
    dimension: Dimension,
  ): Promise<EvaluationRow | null>;
  upsertEvaluation(v: Omit<EvaluationRow, "createdAt">): Promise<void>;
  listVotes(submissionId?: string): Promise<PopularVoteRow[]>;
  upsertVote(v: {
    id: string;
    submissionId: string;
    deviceId: string;
    stars: number;
    eventCode: string | null;
    email: string | null;
  }): Promise<void>;
  listJudgeEvaluations(submissionId?: string): Promise<JudgeEvaluationRow[]>;
  getJudgeEvaluation(
    submissionId: string,
    judgeEmail: string,
  ): Promise<JudgeEvaluationRow | null>;
  upsertJudgeEvaluation(v: {
    submissionId: string;
    judgeEmail: string;
    vibe: number;
    originalidade: number;
    execucao: number;
    viabilidade: number;
    notes: string | null;
  }): Promise<void>;
};

let backendPromise: Promise<Backend> | null = null;

function loadBackend(): Promise<Backend> {
  if (backendPromise) return backendPromise;
  const useDynamo = !!process.env.DYNAMO_SUBMISSIONS;
  backendPromise = useDynamo
    ? (import("./dynamo") as Promise<Backend>)
    : (import("./sqlite-queries") as Promise<Backend>);
  return backendPromise;
}

/* ----- submissions ------------------------------------------ */

export async function listSubmissions(): Promise<SubmissionRow[]> {
  return (await loadBackend()).listSubmissions();
}

export async function getSubmission(
  id: string,
): Promise<SubmissionRow | null> {
  return (await loadBackend()).getSubmission(id);
}

export async function createSubmission(
  v: Omit<
    SubmissionRow,
    "createdAt" | "evaluatedAt" | "errorMessage" | "status"
  > & { status?: SubmissionRow["status"] },
): Promise<SubmissionRow> {
  return (await loadBackend()).createSubmission(v);
}

export async function updateSubmissionStatus(
  id: string,
  patch: Partial<
    Pick<SubmissionRow, "status" | "errorMessage" | "evaluatedAt">
  >,
): Promise<void> {
  return (await loadBackend()).updateSubmissionStatus(id, patch);
}

/* ----- evaluations ------------------------------------------ */

export async function getEvaluations(
  submissionId: string,
): Promise<EvaluationRow[]> {
  return (await loadBackend()).getEvaluations(submissionId);
}

export async function getEvaluation(
  submissionId: string,
  dimension: Dimension,
): Promise<EvaluationRow | null> {
  return (await loadBackend()).getEvaluation(submissionId, dimension);
}

export async function upsertEvaluation(
  v: Omit<EvaluationRow, "createdAt">,
): Promise<void> {
  return (await loadBackend()).upsertEvaluation(v);
}

/* ----- popular votes ---------------------------------------- */

export async function listVotes(
  submissionId?: string,
): Promise<PopularVoteRow[]> {
  return (await loadBackend()).listVotes(submissionId);
}

export async function upsertVote(v: {
  id: string;
  submissionId: string;
  deviceId: string;
  stars: number;
  eventCode: string | null;
  email: string | null;
}): Promise<void> {
  return (await loadBackend()).upsertVote(v);
}

/* ----- judge evaluations ------------------------------------ */

export async function listJudgeEvaluations(
  submissionId?: string,
): Promise<JudgeEvaluationRow[]> {
  return (await loadBackend()).listJudgeEvaluations(submissionId);
}

export async function getJudgeEvaluation(
  submissionId: string,
  judgeEmail: string,
): Promise<JudgeEvaluationRow | null> {
  return (await loadBackend()).getJudgeEvaluation(submissionId, judgeEmail);
}

export async function upsertJudgeEvaluation(v: {
  submissionId: string;
  judgeEmail: string;
  vibe: number;
  originalidade: number;
  execucao: number;
  viabilidade: number;
  notes: string | null;
}): Promise<void> {
  return (await loadBackend()).upsertJudgeEvaluation(v);
}

/* ----- helpers (backend-agnostic) --------------------------- */

export function parseJsonArray(s: string | null): string[] {
  if (!s) return [];
  try {
    const parsed = JSON.parse(s);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function avgScore(evals: EvaluationRow[]): number | null {
  if (evals.length === 0) return null;
  return evals.reduce((acc, e) => acc + e.score, 0) / evals.length;
}

export { DIMS };
