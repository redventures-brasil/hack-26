import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import {
  getEvaluations,
  getSubmission,
  listJudgeEvaluations,
  listVotes,
  parseJsonArray,
} from "@/lib/db/queries";
import { scoreBreakdown } from "@/lib/score";

type DimKey = "vibe" | "originalidade" | "execucao" | "viabilidade";

const DIM_LABELS: Record<DimKey, { label: string; sub: string }> = {
  vibe: { label: "Vibe", sub: "polish, identidade, gosto" },
  originalidade: { label: "Originalidade", sub: "quão novo é o ângulo" },
  execucao: { label: "Execução técnica", sub: "código, arquitetura, README" },
  viabilidade: { label: "Viabilidade real", sub: "sobrevive fora do hackathon?" },
};
const DIM_ORDER: DimKey[] = ["vibe", "originalidade", "execucao", "viabilidade"];

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sub = await getSubmission(id).catch(() => null);
  if (!sub) {
    return {
      title: "HACK-26 · projeto não encontrado",
      robots: { index: false, follow: false },
    };
  }
  return {
    title: `HACK-26 · ${sub.projectName}`,
    description: sub.tagline || sub.description?.slice(0, 160) || undefined,
    // URLs privadas por time, não pra SEO
    robots: { index: false, follow: false },
  };
}

export default async function ProjetoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sub = await getSubmission(id);
  if (!sub) notFound();

  const [evals, judges, votes] = await Promise.all([
    getEvaluations(id).catch(() => []),
    listJudgeEvaluations(id).catch(() => []),
    listVotes(id).catch(() => []),
  ]);
  const breakdown = scoreBreakdown(evals, judges, votes);
  const evalByDim = new Map(evals.map((e) => [e.dimension as DimKey, e]));

  // Judges anonymized by stable index (sort by created_at so the order
  // matches the chronology of evaluations, not insertion-order-by-ID).
  const judgesSorted = [...judges].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
  );

  // Per-dimension avg across all human judges (for the comparison strip)
  const juriAvgByDim: Record<DimKey, number | null> = {
    vibe: null,
    originalidade: null,
    execucao: null,
    viabilidade: null,
  };
  if (judges.length > 0) {
    for (const dim of DIM_ORDER) {
      const sum = judges.reduce((acc, j) => acc + j[dim], 0);
      juriAvgByDim[dim] = sum / judges.length;
    }
  }

  // Popular vote — average stars + count + 1..5 distribution
  const votesCount = votes.length;
  const avgStars =
    votesCount > 0 ? votes.reduce((a, v) => a + v.stars, 0) / votesCount : null;
  const starDist: Record<1 | 2 | 3 | 4 | 5, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };
  for (const v of votes) {
    const k = (v.stars >= 1 && v.stars <= 5 ? v.stars : 3) as 1 | 2 | 3 | 4 | 5;
    starDist[k]++;
  }

  if (sub.status === "failed") {
    return (
      <div className="page">
        <SiteHeader variant="public" />
        <div className="page-body">
          <article className="jg-stage">
            <header className="jg-hero">
              <div className="t-eyebrow">projeto · {sub.id}</div>
              <h1 className="jg-title">{sub.projectName}.</h1>
              <p className="jg-lede">
                A avaliação automática falhou neste projeto e a equipe foi
                notificada. Sem feedback estruturado pra mostrar aqui.
              </p>
            </header>
          </article>
        </div>
      </div>
    );
  }

  const screenshots = parseJsonArray(sub.screenshotUrls);
  const noEval = evals.length === 0 && judges.length === 0 && votes.length === 0;

  return (
    <div className="page">
      <SiteHeader variant="public" />
      <div className="page-body">
        <article className="jg-stage pf-stage">
          {/* ─── hero ──────────────────────────── */}
          <header className="jg-hero">
            <div className="t-eyebrow">feedback · {sub.teamName}</div>
            <h1 className="jg-title">{sub.projectName}.</h1>
            {sub.tagline && (
              <p className="jg-lede" style={{ fontStyle: "italic" }}>
                &ldquo;{sub.tagline}&rdquo;
              </p>
            )}

            <div className="pf-score-strip">
              <div className="pf-score-final">
                <span className="pf-score-final-eyebrow t-eyebrow">
                  nota final
                </span>
                <span className="pf-score-final-val t-mono-num">
                  {breakdown.final != null ? breakdown.final.toFixed(2) : "—"}
                  <span className="pf-score-final-of">/ 10</span>
                </span>
                <span className="pf-score-final-meta">
                  IA 25% · Júri 50% · Popular 25%
                </span>
              </div>
              <div className="pf-breakdown">
                <BreakdownItem
                  label="IA"
                  value={breakdown.ai}
                  meta="4 dimensões"
                />
                <BreakdownItem
                  label="Júri humano"
                  value={breakdown.juri}
                  meta={`${breakdown.juriCount} ${breakdown.juriCount === 1 ? "juiz" : "juízes"}`}
                />
                <BreakdownItem
                  label="Popular"
                  value={breakdown.popular}
                  meta={`${breakdown.popularCount} ${breakdown.popularCount === 1 ? "voto" : "votos"}`}
                />
              </div>
            </div>
          </header>

          {/* ─── projeto: descrição, links, mídia ─── */}
          <section className="jg-rules" aria-label="O projeto">
            <h2 className="jg-section-title">O projeto</h2>
            <p className="pf-description">{sub.description}</p>

            <div className="pf-links" aria-label="Links">
              {sub.demoUrl && (
                <a
                  className="jpv-link primary"
                  href={
                    sub.demoUrl.startsWith("http")
                      ? sub.demoUrl
                      : `https://${sub.demoUrl}`
                  }
                  target="_blank"
                  rel="noreferrer"
                >
                  Abrir demo<span className="arrow">↗</span>
                </a>
              )}
              <a
                className="jpv-link"
                href={
                  sub.githubUrl.startsWith("http")
                    ? sub.githubUrl
                    : `https://${sub.githubUrl}`
                }
                target="_blank"
                rel="noreferrer"
              >
                GitHub<span className="arrow">↗</span>
              </a>
              {sub.videoUrl && (
                <a
                  className="jpv-link"
                  href={sub.videoUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Vídeo<span className="arrow">↗</span>
                </a>
              )}
            </div>

            {screenshots.length > 0 && (
              <div className="pf-shots">
                {screenshots.slice(0, 4).map((url, i) => (
                  <a
                    key={url + i}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="pf-shot"
                    style={{ backgroundImage: `url(${url})` }}
                    aria-label={`screenshot ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </section>

          {noEval && (
            <section className="jg-rules">
              <p className="jg-lede" style={{ margin: 0 }}>
                Sem avaliações registradas ainda. Quando a IA e os juízes
                terminarem, esta página enche sozinha.
              </p>
            </section>
          )}

          {/* ─── IA: 4 dimensões ──────────────────── */}
          {evals.length > 0 && (
            <section aria-label="Feedback da IA">
              <h2 className="jg-section-title">Feedback da IA</h2>
              <p className="jg-lede" style={{ marginTop: -4 }}>
                Cada dimensão de 0 a 10, com raciocínio estruturado e
                evidência citada. Modelo:{" "}
                <span className="t-mono-num">
                  {evals[0]?.model ?? "—"}
                </span>
                .
              </p>

              <div className="pf-ai-grid">
                {DIM_ORDER.map((d, i) => {
                  const ev = evalByDim.get(d);
                  return (
                    <article
                      className="pf-dim ev-dim"
                      key={d}
                      id={`ia-${d}`}
                    >
                      <header className="jg-dim-head">
                        <div className="jg-dim-num t-mono-num">
                          {String(i + 1).padStart(2, "0")}
                        </div>
                        <div className="jg-dim-titlewrap">
                          <div className="t-eyebrow">
                            {DIM_LABELS[d].sub}
                          </div>
                          <h3 className="jg-dim-title">
                            {DIM_LABELS[d].label}.
                          </h3>
                          {ev && (
                            <p className="jg-dim-oneliner">
                              &ldquo;{ev.oneLiner}&rdquo;
                            </p>
                          )}
                        </div>
                        <div className="pf-dim-score">
                          <span className="t-mono-num">
                            {ev ? ev.score.toFixed(1) : "—"}
                          </span>
                          <span className="pf-dim-score-of">/10</span>
                        </div>
                      </header>

                      {ev ? (
                        <>
                          <p className="jg-dim-intro">{ev.reasoning}</p>
                          <div className="pf-dim-cols">
                            <ListBlock
                              eyebrow="o que funcionou"
                              tone="pros"
                              items={parseJsonArray(ev.strengths)}
                            />
                            <ListBlock
                              eyebrow="o que dá pra melhorar"
                              tone="cons"
                              items={parseJsonArray(ev.weaknesses)}
                            />
                          </div>
                          {parseJsonArray(ev.evidenceUsed).length > 0 && (
                            <div className="pf-evidence">
                              <span className="t-eyebrow">evidência</span>
                              <ul>
                                {parseJsonArray(ev.evidenceUsed).map(
                                  (e, idx) => (
                                    <li key={idx}>{e}</li>
                                  ),
                                )}
                              </ul>
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="muted-2 t-small">
                          Sem avaliação registrada nesta dimensão.
                        </p>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {/* ─── júri humano ──────────────────────── */}
          {judges.length > 0 && (
            <section aria-label="Feedback dos juízes humanos">
              <h2 className="jg-section-title">Júri humano</h2>
              <p className="jg-lede" style={{ marginTop: -4 }}>
                {judges.length} juiz{judges.length === 1 ? "" : "es"} avaliou
                este projeto. Identificação anônima, ordem cronológica.
              </p>

              <div className="pf-juri-strip">
                {DIM_ORDER.map((d) => (
                  <div className="cf-stat" key={d}>
                    <span className="cf-stat-val t-mono-num">
                      {juriAvgByDim[d] != null
                        ? juriAvgByDim[d]!.toFixed(1)
                        : "—"}
                    </span>
                    <span className="cf-stat-label">{DIM_LABELS[d].label}</span>
                  </div>
                ))}
              </div>

              <div className="pf-juri-list">
                {judgesSorted.map((j, idx) => {
                  const avg =
                    (j.vibe + j.originalidade + j.execucao + j.viabilidade) /
                    4;
                  return (
                    <article className="pf-juri" key={idx}>
                      <header className="pf-juri-head">
                        <span className="pf-juri-num t-mono-num">
                          Juiz #{String(idx + 1).padStart(2, "0")}
                        </span>
                        <span className="pf-juri-avg t-mono-num">
                          {avg.toFixed(2)}
                          <span className="pf-juri-avg-of">/10</span>
                        </span>
                      </header>
                      <div className="pf-juri-grid">
                        {DIM_ORDER.map((d) => (
                          <div className="pf-juri-cell" key={d}>
                            <span className="t-eyebrow">
                              {DIM_LABELS[d].label}
                            </span>
                            <span className="t-mono-num pf-juri-cell-val">
                              {j[d].toFixed(1)}
                            </span>
                          </div>
                        ))}
                      </div>
                      {j.notes && j.notes.trim().length > 0 && (
                        <blockquote className="pf-juri-notes">
                          {j.notes}
                        </blockquote>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {/* ─── júri popular ─────────────────────── */}
          {votesCount > 0 && (
            <section aria-label="Voto popular">
              <h2 className="jg-section-title">Júri popular</h2>
              <p className="jg-lede" style={{ marginTop: -4 }}>
                {votesCount} {votesCount === 1 ? "pessoa votou" : "pessoas votaram"}{" "}
                neste projeto. Escala de 1 a 5 estrelas.
              </p>

              <div className="pf-popular">
                <div className="pf-popular-headline">
                  <div className="pf-popular-avg t-mono-num">
                    {avgStars != null ? avgStars.toFixed(2) : "—"}
                    <span className="pf-popular-avg-of">/ 5</span>
                  </div>
                  <Stars value={avgStars ?? 0} />
                </div>
                <ul className="pf-popular-dist">
                  {[5, 4, 3, 2, 1].map((s) => {
                    const k = s as 1 | 2 | 3 | 4 | 5;
                    const count = starDist[k];
                    const pct = votesCount > 0 ? (count / votesCount) * 100 : 0;
                    return (
                      <li key={s} className="pf-popular-row">
                        <span className="pf-popular-row-label t-mono-num">
                          {s}★
                        </span>
                        <span className="pf-popular-bar">
                          <span
                            className="pf-popular-bar-fill"
                            style={{ width: `${pct.toFixed(1)}%` }}
                          />
                        </span>
                        <span className="pf-popular-row-count t-mono-num">
                          {count}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </section>
          )}

          {/* ─── footer ───────────────────────────── */}
          <footer className="jg-foot">
            <p>
              <em>HACK-26 · {new Date(2026, 4, 12).toLocaleDateString("pt-BR")}.</em>{" "}
              Compartilhar este link é estável (URL não muda) — mas a página
              não é indexada e não tem nav apontando pra ela.
              {" "}
              <Link href="/como-funciona" className="ed-link">
                Como funciona
              </Link>
              {" · "}
              <Link href="/avaliacao" className="ed-link">
                Como avaliamos
              </Link>
              .
            </p>
          </footer>
        </article>
      </div>
    </div>
  );
}

function BreakdownItem({
  label,
  value,
  meta,
}: {
  label: string;
  value: number | null;
  meta: string;
}) {
  return (
    <div className="pf-breakdown-item">
      <span className="pf-breakdown-label">{label}</span>
      <span className="pf-breakdown-value t-mono-num">
        {value != null ? value.toFixed(1) : "—"}
      </span>
      <span className="pf-breakdown-meta">{meta}</span>
    </div>
  );
}

function ListBlock({
  eyebrow,
  tone,
  items,
}: {
  eyebrow: string;
  tone: "pros" | "cons";
  items: string[];
}) {
  if (items.length === 0) return null;
  return (
    <div className={`jg-col ${tone === "pros" ? "jg-col-pros" : "jg-col-cons"}`}>
      <h4 className="t-eyebrow jg-col-head">{eyebrow}</h4>
      <ul className="jg-list">
        {items.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ul>
    </div>
  );
}

function Stars({ value }: { value: number }) {
  // Render 5 stars with fractional fill via clipping
  const stars = [1, 2, 3, 4, 5];
  return (
    <div className="pf-stars" aria-label={`${value.toFixed(2)} de 5 estrelas`}>
      {stars.map((n) => {
        const fill = Math.max(0, Math.min(1, value - (n - 1)));
        return (
          <span className="pf-star" key={n}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M12 2.5l2.95 6.55 7.05.75-5.3 4.95 1.55 7-6.25-3.7-6.25 3.7 1.55-7L2 9.8l7.05-.75L12 2.5z"
                className="pf-star-empty"
              />
              <path
                d="M12 2.5l2.95 6.55 7.05.75-5.3 4.95 1.55 7-6.25-3.7-6.25 3.7 1.55-7L2 9.8l7.05-.75L12 2.5z"
                className="pf-star-fill"
                style={{ clipPath: `inset(0 ${(1 - fill) * 100}% 0 0)` }}
              />
            </svg>
          </span>
        );
      })}
    </div>
  );
}
