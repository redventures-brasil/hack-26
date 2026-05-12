import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import {
  JUDGE_COOKIE,
  JUDGE_COOKIE_VALUE,
  JUDGE_EMAIL_COOKIE,
} from "@/lib/auth";
import { deleteSubmissionCascade } from "@/lib/db/queries";

export const runtime = "nodejs";

const Body = z.object({
  ids: z.array(z.string().min(1).max(80)).min(1).max(50),
});

/**
 * Admin endpoint to wipe test submissions + cascade their evaluations,
 * popular votes and judge notes. Gated by the judge cookie (anyone with
 * the event password can clean up). Logs the actor email so the action
 * is auditable in CloudWatch.
 */
export async function POST(req: Request) {
  const jar = await cookies();
  if (jar.get(JUDGE_COOKIE)?.value !== JUDGE_COOKIE_VALUE) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const actor = jar.get(JUDGE_EMAIL_COOKIE)?.value ?? "anon";

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const results: Array<{
    id: string;
    evaluations: number;
    judgeEvaluations: number;
    votes: number;
    error?: string;
  }> = [];

  for (const id of parsed.data.ids) {
    try {
      const counts = await deleteSubmissionCascade(id);
      results.push({ id, ...counts });
      console.log(`[admin/cleanup] ${actor} deleted ${id}`, counts);
    } catch (err) {
      console.error(`[admin/cleanup] ${actor} failed to delete ${id}`, err);
      results.push({
        id,
        evaluations: 0,
        judgeEvaluations: 0,
        votes: 0,
        error: (err as Error).message ?? "unknown",
      });
    }
  }

  return NextResponse.json({ ok: true, results });
}
