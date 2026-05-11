// NB: this module touches `better-sqlite3` (native) — it can only be loaded
// in a Node runtime (Server Components, Route Handlers, server-side scripts).
// `next/dynamic` and bundler conventions keep it out of client bundles.

import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import * as schema from "./schema";

/**
 * Local SQLite client.
 *
 * The DB file lives at `.data/hack26.db` relative to the project root.
 * Tables are created on first access (idempotent) — no separate migration
 * step required, which keeps `git clone && npm run dev` working.
 */

const DB_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DB_DIR, "hack26.db");

// next dev with HMR will reload this module — keep the connection on a
// global so we don't open new handles every code change.
declare global {
  var __hack26_db: ReturnType<typeof drizzle<typeof schema>> | undefined;
  var __hack26_db_initialized: boolean | undefined;
}

function openDb() {
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
  const sqlite = new Database(DB_FILE);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  return drizzle(sqlite, { schema });
}

function ensureTables(d: ReturnType<typeof drizzle<typeof schema>>) {
  // Idempotent CREATE TABLE — matches the Drizzle schema. We do this in
  // raw SQL so we don't need drizzle-kit at runtime.
  const stmts = [
    `CREATE TABLE IF NOT EXISTS submissions (
      id TEXT PRIMARY KEY,
      team_name TEXT NOT NULL,
      project_name TEXT NOT NULL,
      tagline TEXT DEFAULT '',
      description TEXT NOT NULL,
      github_url TEXT NOT NULL,
      demo_url TEXT,
      video_url TEXT,
      screenshot_urls TEXT DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'pending',
      error_message TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
      evaluated_at INTEGER
    )`,
    `CREATE TABLE IF NOT EXISTS evaluations (
      id TEXT PRIMARY KEY,
      submission_id TEXT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
      dimension TEXT NOT NULL,
      score REAL NOT NULL,
      one_liner TEXT NOT NULL,
      strengths TEXT NOT NULL,
      weaknesses TEXT NOT NULL,
      evidence_used TEXT NOT NULL,
      reasoning TEXT NOT NULL,
      model TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS evaluations_submission_dimension_idx
      ON evaluations (submission_id, dimension)`,
    `CREATE TABLE IF NOT EXISTS popular_votes (
      id TEXT PRIMARY KEY,
      submission_id TEXT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
      device_id TEXT NOT NULL,
      stars INTEGER NOT NULL,
      event_code TEXT,
      email TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS popular_votes_device_submission_idx
      ON popular_votes (device_id, submission_id)`,
  ];
  for (const s of stmts) {
    d.$client.exec(s);
  }
  // Idempotent additive migration for existing DBs created before `email`
  // was introduced. SQLite has no `ADD COLUMN IF NOT EXISTS`, so we probe
  // and swallow the "duplicate column" error.
  try {
    d.$client.exec(`ALTER TABLE popular_votes ADD COLUMN email TEXT`);
  } catch {
    /* column already exists */
  }
}

export const db = (() => {
  if (globalThis.__hack26_db) return globalThis.__hack26_db;
  const d = openDb();
  if (!globalThis.__hack26_db_initialized) {
    ensureTables(d);
    globalThis.__hack26_db_initialized = true;
  }
  globalThis.__hack26_db = d;
  return d;
})();

export { schema };
