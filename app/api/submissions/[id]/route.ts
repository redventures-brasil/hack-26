import { NextResponse } from "next/server";
import {
  avgScore,
  getEvaluations,
  getSubmission,
  parseJsonArray,
} from "@/lib/db/queries";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const sub = await getSubmission(id);
  if (!sub) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const evals = await getEvaluations(id);
  return NextResponse.json({
    id: sub.id,
    teamName: sub.teamName,
    projectName: sub.projectName,
    tagline: sub.tagline,
    description: sub.description,
    githubUrl: sub.githubUrl,
    demoUrl: sub.demoUrl,
    videoUrl: sub.videoUrl,
    screenshotUrls: parseJsonArray(sub.screenshotUrls),
    status: sub.status,
    errorMessage: sub.errorMessage,
    createdAt: sub.createdAt,
    evaluatedAt: sub.evaluatedAt,
    scoreTotal: avgScore(evals),
    evaluationCount: evals.length,
  });
}
