import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { getSubmission, parseJsonArray } from "@/lib/db/queries";
import { StatusView } from "./status-view";

type Params = { id: string };

export const dynamic = "force-dynamic";

export default async function StatusPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const sub = await getSubmission(id);
  if (!sub) notFound();

  const initial = {
    id: sub.id,
    teamName: sub.teamName,
    projectName: sub.projectName,
    tagline: sub.tagline ?? "",
    description: sub.description,
    githubUrl: sub.githubUrl,
    demoUrl: sub.demoUrl,
    videoUrl: sub.videoUrl,
    screenshotUrls: parseJsonArray(sub.screenshotUrls),
    status: sub.status,
    errorMessage: sub.errorMessage,
  };

  return (
    <div className="page">
      <SiteHeader variant="public" />
      <div className="page-body">
        <StatusView initial={initial} />
      </div>
    </div>
  );
}
