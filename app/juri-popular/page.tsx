import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import { listSubmissions } from "@/lib/db/queries";
import { JuriPopularClient } from "./client";

export const metadata = {
  title: "HACK-26 · Júri popular",
  description: "Vote nos projetos que você viu apresentar no HACK-26.",
};

export const dynamic = "force-dynamic";

export default async function JuriPopularPage() {
  const teams = (await listSubmissions())
    .filter((s) => s.status === "done" || s.status === "evaluating")
    .map((s) => ({
      id: s.id,
      team: s.teamName,
      project: s.projectName,
      tagline: s.tagline ?? "",
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
