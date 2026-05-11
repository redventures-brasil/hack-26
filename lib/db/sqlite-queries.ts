import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "./client";
import type {
  EvaluationRow,
  PopularVoteRow,
  SubmissionRow,
} from "./schema";
import type { Dimension } from "./queries";

/* ----- submissions ------------------------------------------ */

export async function listSubmissions(): Promise<SubmissionRow[]> {
  return db
    .select()
    .from(schema.submissions)
    .orderBy(desc(schema.submissions.createdAt))
    .all();
}

export async function getSubmission(id: string): Promise<SubmissionRow | null> {
  return (
    db
      .select()
      .from(schema.submissions)
      .where(eq(schema.submissions.id, id))
      .get() ?? null
  );
}

export async function createSubmission(
  v: Omit<SubmissionRow, "createdAt" | "evaluatedAt" | "errorMessage" | "status"> & {
    status?: SubmissionRow["status"];
  },
): Promise<SubmissionRow> {
  db.insert(schema.submissions)
    .values({
      ...v,
      status: v.status ?? "pending",
    })
    .run();
  return (await getSubmission(v.id))!;
}

export async function updateSubmissionStatus(
  id: string,
  patch: Partial<Pick<SubmissionRow, "status" | "errorMessage" | "evaluatedAt">>,
): Promise<void> {
  db.update(schema.submissions)
    .set(patch)
    .where(eq(schema.submissions.id, id))
    .run();
}

/* ----- evaluations ------------------------------------------ */

export async function getEvaluations(
  submissionId: string,
): Promise<EvaluationRow[]> {
  return db
    .select()
    .from(schema.evaluations)
    .where(eq(schema.evaluations.submissionId, submissionId))
    .all();
}

export async function getEvaluation(
  submissionId: string,
  dimension: Dimension,
): Promise<EvaluationRow | null> {
  return (
    db
      .select()
      .from(schema.evaluations)
      .where(
        and(
          eq(schema.evaluations.submissionId, submissionId),
          eq(schema.evaluations.dimension, dimension),
        ),
      )
      .get() ?? null
  );
}

export async function upsertEvaluation(
  v: Omit<EvaluationRow, "createdAt">,
): Promise<void> {
  db.insert(schema.evaluations)
    .values(v)
    .onConflictDoUpdate({
      target: [schema.evaluations.submissionId, schema.evaluations.dimension],
      set: {
        score: v.score,
        oneLiner: v.oneLiner,
        strengths: v.strengths,
        weaknesses: v.weaknesses,
        evidenceUsed: v.evidenceUsed,
        reasoning: v.reasoning,
        model: v.model,
        createdAt: new Date(),
      },
    })
    .run();
}

/* ----- popular votes ---------------------------------------- */

export async function listVotes(
  submissionId?: string,
): Promise<PopularVoteRow[]> {
  if (submissionId) {
    return db
      .select()
      .from(schema.popularVotes)
      .where(eq(schema.popularVotes.submissionId, submissionId))
      .all();
  }
  return db.select().from(schema.popularVotes).all();
}

export async function upsertVote(v: {
  id: string;
  submissionId: string;
  deviceId: string;
  stars: number;
  eventCode: string | null;
  email: string | null;
}): Promise<void> {
  db.insert(schema.popularVotes)
    .values({
      id: v.id,
      submissionId: v.submissionId,
      deviceId: v.deviceId,
      stars: v.stars,
      eventCode: v.eventCode,
      email: v.email,
    })
    .onConflictDoUpdate({
      target: [schema.popularVotes.deviceId, schema.popularVotes.submissionId],
      set: {
        stars: v.stars,
        eventCode: v.eventCode,
        email: v.email,
        updatedAt: new Date(),
      },
    })
    .run();
}
