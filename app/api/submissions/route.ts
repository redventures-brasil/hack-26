import { NextResponse } from "next/server";
import { z } from "zod";
import { createSubmission } from "@/lib/db/queries";
import { runEvaluation } from "@/lib/judges/run-all";

export const runtime = "nodejs";

const Body = z.object({
  teamName: z.string().min(1).max(120),
  projectName: z.string().min(1).max(120),
  tagline: z.string().max(200).optional(),
  description: z.string().min(50).max(2000),
  githubUrl: z.string().min(3).max(400),
  demoUrl: z.string().max(400).optional().nullable(),
  videoUrl: z.string().max(400).optional().nullable(),
  screenshotUrls: z.array(z.string()).max(8).optional(),
});

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 24);
}

function shortHash(): string {
  return Math.random().toString(36).slice(2, 6);
}

export async function POST(req: Request) {
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
  const v = parsed.data;
  const id = `${slugify(v.projectName) || "submission"}-${shortHash()}`;

  const row = await createSubmission({
    id,
    teamName: v.teamName,
    projectName: v.projectName,
    tagline: v.tagline ?? "",
    description: v.description,
    githubUrl: v.githubUrl,
    demoUrl: v.demoUrl ?? null,
    videoUrl: v.videoUrl ?? null,
    screenshotUrls: JSON.stringify(v.screenshotUrls ?? []),
  });

  // Fire-and-forget the evaluation pipeline. We don't await — the
  // /submit/[id] page polls /api/submissions/[id] for status changes.
  void runEvaluation(id).catch((err) => {
    console.error(`[evaluate ${id}] pipeline crashed`, err);
  });

  return NextResponse.json({ id: row.id, status: row.status }, { status: 201 });
}
