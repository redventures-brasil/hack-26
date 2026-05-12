import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import type {
  EvaluationRow,
  JudgeEvaluationRow,
  PopularVoteRow,
  SubmissionRow,
} from "./schema";
import type { Dimension } from "./queries";

declare global {
  var __hack26_ddb: DynamoDBDocumentClient | undefined;
}

function client(): DynamoDBDocumentClient {
  if (globalThis.__hack26_ddb) return globalThis.__hack26_ddb;
  const region = process.env.AWS_REGION_OVERRIDE || process.env.AWS_REGION || "sa-east-1";
  const base = new DynamoDBClient({ region });
  const doc = DynamoDBDocumentClient.from(base, {
    marshallOptions: { removeUndefinedValues: true, convertClassInstanceToMap: true },
  });
  globalThis.__hack26_ddb = doc;
  return doc;
}

const TABLES = {
  submissions: process.env.DYNAMO_SUBMISSIONS!,
  evaluations: process.env.DYNAMO_EVALUATIONS!,
  popularVotes: process.env.DYNAMO_POPULAR_VOTES!,
  // Optional — feature degrades gracefully if the table isn't provisioned
  // yet (env var unset → calls become no-ops returning empty lists).
  judgeEvaluations: process.env.DYNAMO_JUDGE_EVALUATIONS,
} as const;

/* ------- row <-> item mapping ----------------------------------- */

type SubmissionItem = {
  id: string;
  team_name: string;
  project_name: string;
  tagline: string;
  description: string;
  github_url: string;
  demo_url: string | null;
  video_url: string | null;
  screenshot_urls: string;
  status: SubmissionRow["status"];
  error_message: string | null;
  created_at: number;
  evaluated_at: number | null;
};

function toSubmission(it: SubmissionItem): SubmissionRow {
  return {
    id: it.id,
    teamName: it.team_name,
    projectName: it.project_name,
    tagline: it.tagline ?? "",
    description: it.description,
    githubUrl: it.github_url,
    demoUrl: it.demo_url,
    videoUrl: it.video_url,
    screenshotUrls: it.screenshot_urls ?? "[]",
    status: it.status,
    errorMessage: it.error_message,
    createdAt: new Date(it.created_at),
    evaluatedAt: it.evaluated_at ? new Date(it.evaluated_at) : null,
  };
}

type EvaluationItem = {
  submission_id: string;
  dimension: EvaluationRow["dimension"];
  id: string;
  score: number;
  one_liner: string;
  strengths: string;
  weaknesses: string;
  evidence_used: string;
  reasoning: string;
  model: string;
  created_at: number;
};

function toEvaluation(it: EvaluationItem): EvaluationRow {
  return {
    id: it.id,
    submissionId: it.submission_id,
    dimension: it.dimension,
    score: it.score,
    oneLiner: it.one_liner,
    strengths: it.strengths,
    weaknesses: it.weaknesses,
    evidenceUsed: it.evidence_used,
    reasoning: it.reasoning,
    model: it.model,
    createdAt: new Date(it.created_at),
  };
}

type VoteItem = {
  submission_id: string;
  device_id: string;
  id: string;
  stars: number;
  event_code: string | null;
  email: string | null;
  created_at: number;
  updated_at: number;
};

function toVote(it: VoteItem): PopularVoteRow {
  return {
    id: it.id,
    submissionId: it.submission_id,
    deviceId: it.device_id,
    stars: it.stars,
    eventCode: it.event_code,
    email: it.email ?? null,
    createdAt: new Date(it.created_at),
    updatedAt: new Date(it.updated_at),
  };
}

/* ------- submissions -------------------------------------------- */

export async function listSubmissions(): Promise<SubmissionRow[]> {
  const out = await client().send(
    new ScanCommand({ TableName: TABLES.submissions }),
  );
  const items = (out.Items ?? []) as SubmissionItem[];
  return items
    .map(toSubmission)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function getSubmission(id: string): Promise<SubmissionRow | null> {
  const out = await client().send(
    new GetCommand({ TableName: TABLES.submissions, Key: { id } }),
  );
  return out.Item ? toSubmission(out.Item as SubmissionItem) : null;
}

export async function createSubmission(
  v: Omit<SubmissionRow, "createdAt" | "evaluatedAt" | "errorMessage" | "status"> & {
    status?: SubmissionRow["status"];
  },
): Promise<SubmissionRow> {
  const now = Date.now();
  const item: SubmissionItem = {
    id: v.id,
    team_name: v.teamName,
    project_name: v.projectName,
    tagline: v.tagline ?? "",
    description: v.description,
    github_url: v.githubUrl,
    demo_url: v.demoUrl ?? null,
    video_url: v.videoUrl ?? null,
    screenshot_urls: v.screenshotUrls ?? "[]",
    status: v.status ?? "pending",
    error_message: null,
    created_at: now,
    evaluated_at: null,
  };
  await client().send(
    new PutCommand({ TableName: TABLES.submissions, Item: item }),
  );
  return toSubmission(item);
}

export async function updateSubmissionStatus(
  id: string,
  patch: Partial<Pick<SubmissionRow, "status" | "errorMessage" | "evaluatedAt">>,
): Promise<void> {
  const exprs: string[] = [];
  const names: Record<string, string> = {};
  const values: Record<string, unknown> = {};

  if (patch.status !== undefined) {
    exprs.push("#s = :s");
    names["#s"] = "status";
    values[":s"] = patch.status;
  }
  if (patch.errorMessage !== undefined) {
    exprs.push("#e = :e");
    names["#e"] = "error_message";
    values[":e"] = patch.errorMessage;
  }
  if (patch.evaluatedAt !== undefined) {
    exprs.push("#a = :a");
    names["#a"] = "evaluated_at";
    values[":a"] = patch.evaluatedAt ? patch.evaluatedAt.getTime() : null;
  }
  if (exprs.length === 0) return;

  await client().send(
    new UpdateCommand({
      TableName: TABLES.submissions,
      Key: { id },
      UpdateExpression: "SET " + exprs.join(", "),
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
    }),
  );
}

/* ------- evaluations -------------------------------------------- */

export async function getEvaluations(
  submissionId: string,
): Promise<EvaluationRow[]> {
  const out = await client().send(
    new QueryCommand({
      TableName: TABLES.evaluations,
      KeyConditionExpression: "submission_id = :sid",
      ExpressionAttributeValues: { ":sid": submissionId },
    }),
  );
  return ((out.Items ?? []) as EvaluationItem[]).map(toEvaluation);
}

export async function getEvaluation(
  submissionId: string,
  dimension: Dimension,
): Promise<EvaluationRow | null> {
  const out = await client().send(
    new GetCommand({
      TableName: TABLES.evaluations,
      Key: { submission_id: submissionId, dimension },
    }),
  );
  return out.Item ? toEvaluation(out.Item as EvaluationItem) : null;
}

export async function upsertEvaluation(
  v: Omit<EvaluationRow, "createdAt">,
): Promise<void> {
  const item: EvaluationItem = {
    submission_id: v.submissionId,
    dimension: v.dimension,
    id: v.id,
    score: v.score,
    one_liner: v.oneLiner,
    strengths: v.strengths,
    weaknesses: v.weaknesses,
    evidence_used: v.evidenceUsed,
    reasoning: v.reasoning,
    model: v.model,
    created_at: Date.now(),
  };
  await client().send(
    new PutCommand({ TableName: TABLES.evaluations, Item: item }),
  );
}

/* ------- popular votes ------------------------------------------ */

export async function listVotes(
  submissionId?: string,
): Promise<PopularVoteRow[]> {
  if (submissionId) {
    const out = await client().send(
      new QueryCommand({
        TableName: TABLES.popularVotes,
        KeyConditionExpression: "submission_id = :sid",
        ExpressionAttributeValues: { ":sid": submissionId },
      }),
    );
    return ((out.Items ?? []) as VoteItem[]).map(toVote);
  }
  const out = await client().send(
    new ScanCommand({ TableName: TABLES.popularVotes }),
  );
  return ((out.Items ?? []) as VoteItem[]).map(toVote);
}

/* ------- judge evaluations ------------------------------------- */

type JudgeEvalItem = {
  submission_id: string;
  judge_email: string;
  vibe: number;
  originalidade: number;
  execucao: number;
  viabilidade: number;
  notes: string | null;
  created_at: number;
  updated_at: number;
};

function toJudgeEvaluation(it: JudgeEvalItem): JudgeEvaluationRow {
  return {
    submissionId: it.submission_id,
    judgeEmail: it.judge_email,
    vibe: it.vibe,
    originalidade: it.originalidade,
    execucao: it.execucao,
    viabilidade: it.viabilidade,
    notes: it.notes ?? null,
    createdAt: new Date(it.created_at),
    updatedAt: new Date(it.updated_at),
  };
}

// Treat "table doesn't exist yet" (env points to a future TF apply) as
// "no data" so the UI and composite score gracefully drop the júri
// component until the TF PR lands.
function isMissingTable(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const name = (err as { name?: string }).name;
  return name === "ResourceNotFoundException";
}

export async function listJudgeEvaluations(
  submissionId?: string,
): Promise<JudgeEvaluationRow[]> {
  if (!TABLES.judgeEvaluations) return [];
  try {
    if (submissionId) {
      const out = await client().send(
        new QueryCommand({
          TableName: TABLES.judgeEvaluations,
          KeyConditionExpression: "submission_id = :sid",
          ExpressionAttributeValues: { ":sid": submissionId },
        }),
      );
      return ((out.Items ?? []) as JudgeEvalItem[]).map(toJudgeEvaluation);
    }
    const out = await client().send(
      new ScanCommand({ TableName: TABLES.judgeEvaluations }),
    );
    return ((out.Items ?? []) as JudgeEvalItem[]).map(toJudgeEvaluation);
  } catch (err) {
    if (isMissingTable(err)) return [];
    throw err;
  }
}

export async function getJudgeEvaluation(
  submissionId: string,
  judgeEmail: string,
): Promise<JudgeEvaluationRow | null> {
  if (!TABLES.judgeEvaluations) return null;
  try {
    const out = await client().send(
      new GetCommand({
        TableName: TABLES.judgeEvaluations,
        Key: { submission_id: submissionId, judge_email: judgeEmail },
      }),
    );
    return out.Item ? toJudgeEvaluation(out.Item as JudgeEvalItem) : null;
  } catch (err) {
    if (isMissingTable(err)) return null;
    throw err;
  }
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
  if (!TABLES.judgeEvaluations) {
    throw new Error("judge evaluations table not configured");
  }
  // Preserve created_at on update
  const existing = await client().send(
    new GetCommand({
      TableName: TABLES.judgeEvaluations,
      Key: { submission_id: v.submissionId, judge_email: v.judgeEmail },
    }),
  );
  const now = Date.now();
  const createdAt = existing.Item
    ? (existing.Item as JudgeEvalItem).created_at
    : now;
  const item: JudgeEvalItem = {
    submission_id: v.submissionId,
    judge_email: v.judgeEmail,
    vibe: v.vibe,
    originalidade: v.originalidade,
    execucao: v.execucao,
    viabilidade: v.viabilidade,
    notes: v.notes,
    created_at: createdAt,
    updated_at: now,
  };
  await client().send(
    new PutCommand({ TableName: TABLES.judgeEvaluations, Item: item }),
  );
}

/* ------- popular votes ------------------------------------------ */

export async function upsertVote(v: {
  id: string;
  submissionId: string;
  deviceId: string;
  stars: number;
  eventCode: string | null;
  email: string | null;
}): Promise<void> {
  // Composite PK (submission_id, device_id) makes upsert natural: a PutItem
  // with the same key replaces the existing item. We preserve the original
  // created_at by reading first; if absent, use now.
  const existing = await client().send(
    new GetCommand({
      TableName: TABLES.popularVotes,
      Key: { submission_id: v.submissionId, device_id: v.deviceId },
    }),
  );
  const now = Date.now();
  const createdAt = existing.Item
    ? (existing.Item as VoteItem).created_at
    : now;

  const item: VoteItem = {
    submission_id: v.submissionId,
    device_id: v.deviceId,
    id: v.id,
    stars: v.stars,
    event_code: v.eventCode,
    email: v.email,
    created_at: createdAt,
    updated_at: now,
  };
  await client().send(
    new PutCommand({ TableName: TABLES.popularVotes, Item: item }),
  );
}
