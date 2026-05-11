import { sql } from "drizzle-orm";
import {
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

/* ============================================================
   submissions — one row per project submitted to the hackathon.
   `id` is human-readable (e.g. "refila-87df") so it can be the
   URL slug — generated server-side from project name + 4-char hash.
   ============================================================ */
export const submissions = sqliteTable("submissions", {
  id: text("id").primaryKey(),
  teamName: text("team_name").notNull(),
  projectName: text("project_name").notNull(),
  tagline: text("tagline").default(""),
  description: text("description").notNull(),
  githubUrl: text("github_url").notNull(),
  demoUrl: text("demo_url"),
  videoUrl: text("video_url"), // saved upload path (public/uploads/...)
  screenshotUrls: text("screenshot_urls").default("[]"), // JSON array
  status: text("status", {
    enum: ["pending", "evaluating", "done", "failed"],
  })
    .notNull()
    .default("pending"),
  errorMessage: text("error_message"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  evaluatedAt: integer("evaluated_at", { mode: "timestamp_ms" }),
});

/* ============================================================
   evaluations — one row per (submission, dimension). Allows
   re-running a single judge without touching the others.
   ============================================================ */
export const evaluations = sqliteTable(
  "evaluations",
  {
    id: text("id").primaryKey(),
    submissionId: text("submission_id")
      .notNull()
      .references(() => submissions.id, { onDelete: "cascade" }),
    dimension: text("dimension", {
      enum: ["vibe", "originalidade", "execucao", "viabilidade"],
    }).notNull(),
    score: real("score").notNull(),
    oneLiner: text("one_liner").notNull(),
    strengths: text("strengths").notNull(), // JSON array
    weaknesses: text("weaknesses").notNull(), // JSON array
    evidenceUsed: text("evidence_used").notNull(), // JSON array
    reasoning: text("reasoning").notNull(),
    model: text("model").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => [
    uniqueIndex("evaluations_submission_dimension_idx").on(
      t.submissionId,
      t.dimension,
    ),
  ],
);

/* ============================================================
   popular_votes — anonymous 1-5 star vote per device per project.
   `deviceId` comes from the client (localStorage uuid) — good
   enough for a same-day audience vote, not for fraud-proof tally.
   ============================================================ */
export const popularVotes = sqliteTable(
  "popular_votes",
  {
    id: text("id").primaryKey(),
    submissionId: text("submission_id")
      .notNull()
      .references(() => submissions.id, { onDelete: "cascade" }),
    deviceId: text("device_id").notNull(),
    stars: integer("stars").notNull(),
    eventCode: text("event_code"),
    email: text("email"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => [
    uniqueIndex("popular_votes_device_submission_idx").on(
      t.deviceId,
      t.submissionId,
    ),
  ],
);

export type SubmissionRow = typeof submissions.$inferSelect;
export type EvaluationRow = typeof evaluations.$inferSelect;
export type PopularVoteRow = typeof popularVotes.$inferSelect;
