import { SiteHeader } from "@/components/site-header";
import {
  LeaderboardDashboard,
  type LeaderboardRow,
} from "@/components/leaderboard";
import { listSubmissions, getEvaluations, avgScore } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function JudgeDashboardPage() {
  const submissions = await listSubmissions();
  const rows: LeaderboardRow[] = await Promise.all(
    submissions.map(async (s) => {
      const evs = await getEvaluations(s.id);
      const byDim = (d: string): number | null => {
        const found = evs.find((e) => e.dimension === d);
        return found ? found.score : null;
      };
      return {
        id: s.id,
        projectName: s.projectName,
        teamName: s.teamName,
        status: s.status,
        scores: {
          vibe: byDim("vibe"),
          originalidade: byDim("originalidade"),
          execucao: byDim("execucao"),
          viabilidade: byDim("viabilidade"),
        },
        total: avgScore(evs),
      };
    }),
  );

  return (
    <div className="page">
      <SiteHeader variant="judge" current="ranking" />
      <div className="page-body">
        <LeaderboardDashboard rows={rows} />
      </div>
    </div>
  );
}
