import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import {
  JUDGE_COOKIE,
  JUDGE_COOKIE_VALUE,
  JUDGE_EMAIL_COOKIE,
  isValidEmail,
  normalizeEmail,
} from "@/lib/auth";
import {
  getSubmission,
  upsertJudgeEvaluation,
} from "@/lib/db/queries";

export const runtime = "nodejs";

// Each dimension goes from 0 to 10 in 0.5-step increments — matches the
// AI's scale so the composite math stays simple.
const Score = z.number().min(0).max(10);

const Body = z.object({
  vibe: Score,
  originalidade: Score,
  execucao: Score,
  viabilidade: Score,
  notes: z.string().max(2000).optional().nullable(),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;

  // Auth check — the proxy already gates /judge/* pages, but API routes
  // pass through (they need to be reachable from the login flow). Verify
  // the cookie here too so we don't write anonymous rows.
  const jar = await cookies();
  if (jar.get(JUDGE_COOKIE)?.value !== JUDGE_COOKIE_VALUE) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const rawEmail = jar.get(JUDGE_EMAIL_COOKIE)?.value ?? "";
  if (!isValidEmail(rawEmail)) {
    return NextResponse.json({ error: "missing_email" }, { status: 401 });
  }
  const judgeEmail = normalizeEmail(rawEmail);

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_payload", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const sub = await getSubmission(id);
  if (!sub) {
    return NextResponse.json({ error: "submission_not_found" }, { status: 404 });
  }

  await upsertJudgeEvaluation({
    submissionId: id,
    judgeEmail,
    vibe: parsed.data.vibe,
    originalidade: parsed.data.originalidade,
    execucao: parsed.data.execucao,
    viabilidade: parsed.data.viabilidade,
    notes: parsed.data.notes?.trim() ? parsed.data.notes.trim() : null,
  });

  return NextResponse.json({ ok: true });
}
