import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import {
  listSubmissions,
  getEvaluations,
  listJudgeEvaluations,
  listVotes,
} from "@/lib/db/queries";
import { scoreBreakdown, type ScoreBreakdown } from "@/lib/score";
import type { SubmissionRow } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "HACK-26 · Projetos",
  // Listagem central das submissões — URL estável mas privada (não
  // indexada e sem link no nav público).
  robots: { index: false, follow: false },
};

type Row = SubmissionRow & { breakdown: ScoreBreakdown };

const STATUS_LABEL: Record<SubmissionRow["status"], string> = {
  pending: "na fila",
  evaluating: "avaliando",
  done: "avaliado",
  failed: "falhou",
};

export default async function ProjetosPage() {
  const submissions = await listSubmissions();
  const rows: Row[] = await Promise.all(
    submissions.map(async (s) => {
      const [evs, judges, votes] = await Promise.all([
        getEvaluations(s.id).catch(() => []),
        listJudgeEvaluations(s.id).catch(() => []),
        listVotes(s.id).catch(() => []),
      ]);
      return { ...s, breakdown: scoreBreakdown(evs, judges, votes) };
    }),
  );

  // Sort by final composite desc — null/missing scores last, preserving
  // input order for ties.
  rows.sort((a, b) => {
    const fa = a.breakdown.final;
    const fb = b.breakdown.final;
    if (fa == null && fb == null) return 0;
    if (fa == null) return 1;
    if (fb == null) return -1;
    return fb - fa;
  });

  const total = rows.length;
  const evaluated = rows.filter((r) => r.status === "done").length;
  const totalJudgeEvals = rows.reduce(
    (acc, r) => acc + r.breakdown.juriCount,
    0,
  );
  const totalPopularVotes = rows.reduce(
    (acc, r) => acc + r.breakdown.popularCount,
    0,
  );

  return (
    <div className="page">
      <SiteHeader variant="public" />
      <div className="page-body">
        <article className="jg-stage">
          <header className="jg-hero">
            <div className="t-eyebrow">central · hack-26</div>
            <h1 className="jg-title">
              Os <em>projetos</em>.
            </h1>
            <p className="jg-lede">
              Toda submissão do HACK-26, ordenada pela nota composite
              (IA 25% · Júri 50% · Popular 25%). Click no card pra ver a
              página de feedback completo do time.
            </p>
            <div className="cf-stat-strip">
              <div className="cf-stat">
                <span className="cf-stat-val t-mono-num">
                  {String(total).padStart(2, "0")}
                </span>
                <span className="cf-stat-label">submissões</span>
              </div>
              <div className="cf-stat">
                <span className="cf-stat-val t-mono-num">
                  {String(evaluated).padStart(2, "0")}
                </span>
                <span className="cf-stat-label">avaliadas</span>
              </div>
              <div className="cf-stat">
                <span className="cf-stat-val t-mono-num">
                  {String(totalJudgeEvals).padStart(2, "0")}
                </span>
                <span className="cf-stat-label">notas humanas</span>
              </div>
              <div className="cf-stat">
                <span className="cf-stat-val t-mono-num">
                  {String(totalPopularVotes).padStart(2, "0")}
                </span>
                <span className="cf-stat-label">votos populares</span>
              </div>
            </div>
          </header>

          {rows.length === 0 ? (
            <section className="jg-rules">
              <p className="jg-lede" style={{ margin: 0 }}>
                Nenhuma submissão registrada.
              </p>
            </section>
          ) : (
            <section aria-label="Listagem de projetos">
              <div className="lp-list">
                {rows.map((r, idx) => (
                  <Link
                    key={r.id}
                    href={`/projeto/${r.id}`}
                    className="lp-card"
                  >
                    <div className="lp-card-rank">
                      <span className="lp-card-rank-num t-mono-num">
                        {r.breakdown.final != null
                          ? `#${String(idx + 1).padStart(2, "0")}`
                          : "—"}
                      </span>
                      <span className="lp-card-status t-eyebrow">
                        {STATUS_LABEL[r.status]}
                      </span>
                    </div>

                    <div className="lp-card-body">
                      <h2 className="lp-card-project">{r.projectName}</h2>
                      <div className="lp-card-team">{r.teamName}</div>
                      {r.tagline && (
                        <p className="lp-card-tagline">
                          &ldquo;{r.tagline}&rdquo;
                        </p>
                      )}
                      <div className="lp-card-counts">
                        <span>
                          IA{" "}
                          <span className="t-mono-num">
                            {r.breakdown.ai != null
                              ? r.breakdown.ai.toFixed(1)
                              : "—"}
                          </span>
                        </span>
                        <span>
                          Júri{" "}
                          <span className="t-mono-num">
                            {r.breakdown.juri != null
                              ? r.breakdown.juri.toFixed(1)
                              : "—"}
                          </span>
                          <span className="muted">
                            {" "}
                            ({r.breakdown.juriCount})
                          </span>
                        </span>
                        <span>
                          Popular{" "}
                          <span className="t-mono-num">
                            {r.breakdown.popular != null
                              ? r.breakdown.popular.toFixed(1)
                              : "—"}
                          </span>
                          <span className="muted">
                            {" "}
                            ({r.breakdown.popularCount})
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="lp-card-score">
                      <span className="lp-card-score-val t-mono-num">
                        {r.breakdown.final != null
                          ? r.breakdown.final.toFixed(2)
                          : "—"}
                      </span>
                      <span className="lp-card-score-of">/ 10</span>
                      <span className="lp-card-arrow" aria-hidden="true">
                        →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <footer className="jg-foot">
            <p>
              <em>Listagem privada.</em> Esta página não é indexada e não
              tem nav apontando — só quem tem o link chega aqui.
            </p>
          </footer>
        </article>
      </div>
    </div>
  );
}
