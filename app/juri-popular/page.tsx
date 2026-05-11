import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import { listSubmissions, parseJsonArray } from "@/lib/db/queries";
import { JuriPopularClient, type VotableTeam } from "./client";

export const metadata = {
  title: "HACK-26 · Júri popular",
  description: "Vote nos projetos que você viu apresentar no HACK-26.",
};

export const dynamic = "force-dynamic";

export default async function JuriPopularPage() {
  const teams: VotableTeam[] = (await listSubmissions())
    .filter((s) => s.status === "done" || s.status === "evaluating")
    .map((s) => ({
      id: s.id,
      team: s.teamName,
      project: s.projectName,
      tagline: s.tagline ?? "",
      description: s.description,
      githubUrl: s.githubUrl,
      demoUrl: s.demoUrl,
      videoUrl: s.videoUrl,
      screenshots: parseJsonArray(s.screenshotUrls),
    }));

  return (
    <div className="page">
      <SiteHeader variant="public" current="votar" />
      <div className="page-body">
        <Suspense fallback={<div className="jp-stage" />}>
          <JuriPopularClient votableTeams={teams} />
        </Suspense>
      </div>
    </div>
  );
}
