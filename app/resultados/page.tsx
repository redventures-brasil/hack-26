import {
  listSubmissions,
  getEvaluations,
  listJudgeEvaluations,
  listVotes,
} from "@/lib/db/queries";
import { scoreBreakdown } from "@/lib/score";
import { ResultadosClient, type WinnerRow } from "./client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "HACK-26 · Resultados",
  // Keep the page reachable only by direct URL — no nav link, no indexing.
  robots: { index: false, follow: false },
};

export default async function ResultadosPage() {
  const submissions = await listSubmissions();
  const rows: (WinnerRow & { total: number })[] = (
    await Promise.all(
      submissions
        .filter((s) => s.status === "done")
        .map(async (s) => {
          const [evs, judges, votes] = await Promise.all([
            getEvaluations(s.id),
            listJudgeEvaluations(s.id),
            listVotes(s.id),
          ]);
          const breakdown = scoreBreakdown(evs, judges, votes);
          if (breakdown.final == null) return null;
          const byDim = (d: string): number | null => {
            const found = evs.find((e) => e.dimension === d);
            return found ? found.score : null;
          };
          return {
            id: s.id,
            projectName: s.projectName,
            teamName: s.teamName,
            tagline: s.tagline ?? "",
            // Composite score (IA 25% + Júri 50% + Popular 25%) is what
            // drives the ranking. The per-dim breakdown shown in the
            // slideshow stays AI-only since judges give a single score
            // per dim, not per evidence trail.
            total: breakdown.final,
            scores: {
              vibe: byDim("vibe"),
              originalidade: byDim("originalidade"),
              execucao: byDim("execucao"),
              viabilidade: byDim("viabilidade"),
            },
            breakdown: {
              ai: breakdown.ai,
              juri: breakdown.juri,
              popular: breakdown.popular,
              juriCount: breakdown.juriCount,
              popularCount: breakdown.popularCount,
            },
          };
        }),
    )
  ).filter((r): r is WinnerRow & { total: number } => r !== null);

  rows.sort((a, b) => b.total - a.total);
  const top3 = rows.slice(0, 3);

  return <ResultadosClient winners={top3} />;
}
