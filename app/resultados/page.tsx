import { listSubmissions, getEvaluations, avgScore } from "@/lib/db/queries";
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
          const evs = await getEvaluations(s.id);
          const total = avgScore(evs);
          if (total == null) return null;
          const byDim = (d: string): number | null => {
            const found = evs.find((e) => e.dimension === d);
            return found ? found.score : null;
          };
          return {
            id: s.id,
            projectName: s.projectName,
            teamName: s.teamName,
            tagline: s.tagline ?? "",
            total,
            scores: {
              vibe: byDim("vibe"),
              originalidade: byDim("originalidade"),
              execucao: byDim("execucao"),
              viabilidade: byDim("viabilidade"),
            },
          };
        }),
    )
  ).filter((r): r is WinnerRow & { total: number } => r !== null);

  rows.sort((a, b) => b.total - a.total);
  const top3 = rows.slice(0, 3);

  return <ResultadosClient winners={top3} />;
}
