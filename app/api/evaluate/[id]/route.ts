import { NextResponse } from "next/server";
import { runEvaluation } from "@/lib/judges/run-all";
import { getSubmission } from "@/lib/db/queries";

export const runtime = "nodejs";

const DIMS = ["vibe", "originalidade", "execucao", "viabilidade"] as const;
type Dim = (typeof DIMS)[number];

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const sub = await getSubmission(id);
  if (!sub) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const url = new URL(req.url);
  const only = url.searchParams.get("only");
  const onlyDim: Dim | undefined =
    only && (DIMS as readonly string[]).includes(only)
      ? (only as Dim)
      : undefined;

  // fire-and-forget
  void runEvaluation(id, { only: onlyDim }).catch((err) => {
    console.error(`[evaluate ${id}] pipeline error`, err);
  });

  return NextResponse.json({ ok: true, id, only: onlyDim ?? null });
}
