import { NextResponse } from "next/server";
import { z } from "zod";
import { getSubmission, upsertVote } from "@/lib/db/queries";

export const runtime = "nodejs";

const Body = z.object({
  submissionId: z.string().min(1).max(80),
  deviceId: z.string().min(8).max(80),
  stars: z.number().int().min(1).max(5),
  eventCode: z.string().max(40).nullable().optional(),
  email: z.string().email().max(120).nullable().optional(),
});

export async function POST(req: Request) {
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
  const v = parsed.data;
  if (!(await getSubmission(v.submissionId))) {
    return NextResponse.json(
      { error: "submission_not_found" },
      { status: 404 },
    );
  }
  await upsertVote({
    id: `vote-${v.deviceId.slice(0, 8)}-${v.submissionId.slice(0, 12)}-${Date.now().toString(36)}`,
    submissionId: v.submissionId,
    deviceId: v.deviceId,
    stars: v.stars,
    eventCode: v.eventCode ?? null,
    email: v.email ?? null,
  });
  return NextResponse.json({ ok: true });
}
