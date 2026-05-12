import { SiteHeader } from "@/components/site-header";
import {
  LeaderboardDashboard,
  type LeaderboardRow,
} from "@/components/leaderboard";
import {
  listSubmissions,
  getEvaluations,
  listJudgeEvaluations,
  listVotes,
} from "@/lib/db/queries";
import { scoreBreakdown } from "@/lib/score";

export const dynamic = "force-dynamic";

export default async function JudgeDashboardPage() {
  const submissions = await listSubmissions();
  const rows: LeaderboardRow[] = await Promise.all(
    submissions.map(async (s) => {
      const [evs, judges, votes] = await Promise.all([
        getEvaluations(s.id),
        listJudgeEvaluations(s.id),
        listVotes(s.id),
      ]);
      const byDim = (d: string): number | null => {
        const found = evs.find((e) => e.dimension === d);
        return found ? found.score : null;
      };
      const bk = scoreBreakdown(evs, judges, votes);
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
        // Composite final replaces the AI-only avg in the ranking column.
        total: bk.final,
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
