import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { SiteHeader } from "@/components/site-header";
import { ScoreNumber } from "@/components/score";
import { ScoreCard } from "@/components/score-card";
import { JudgeScoreInput } from "@/components/judge-score-input";
import {
  getEvaluations,
  getJudgeEvaluation,
  getSubmission,
  listJudgeEvaluations,
  listSubmissions,
  listVotes,
  parseJsonArray,
} from "@/lib/db/queries";
import { JUDGE_EMAIL_COOKIE, isValidEmail, normalizeEmail } from "@/lib/auth";
import { scoreBreakdown } from "@/lib/score";
import { PipelineFailureView } from "./failure-view";
import { ReevaluateControls } from "./reevaluate-controls";

type DimKey = "vibe" | "originalidade" | "execucao" | "viabilidade";
const DIM_LABELS: Record<
  DimKey,
  { label: string; sub: string }
> = {
  vibe: { label: "Vibe", sub: "polish, identidade, gosto" },
  originalidade: { label: "Originalidade", sub: "quão novo é o ângulo" },
  execucao: {
    label: "Execução técnica",
    sub: "código, arquitetura, README",
  },
  viabilidade: {
    label: "Viabilidade real",
    sub: "sobrevive fora do hackathon?",
  },
};
const DIM_ORDER: DimKey[] = [
  "vibe",
  "originalidade",
  "execucao",
  "viabilidade",
];

type Params = { id: string };
type Search = { [key: string]: string | string[] | undefined };

export const dynamic = "force-dynamic";

export default async function DrilldownPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<Search>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const sub = await getSubmission(id);
  if (!sub) notFound();

  if (sub.status === "failed") {
    return (
      <PipelineFailureView
        team={{
          id: sub.id,
          team: sub.teamName,
          project: sub.projectName,
          github: sub.githubUrl,
          tagline: sub.tagline ?? "",
          error: sub.errorMessage,
        }}
      />
    );
  }

  const allEvals = await getEvaluations(id);
  const evalByDim = new Map(allEvals.map((e) => [e.dimension as DimKey, e]));

  // Belt-and-suspenders: judge evals are stored in a table that may not
  // exist yet (TF apply pending). The dynamo backend already swallows
  // ResourceNotFoundException, but wrap here too so a permission glitch
  // or unrelated SDK error doesn't crash the whole /judge/[id] page.
  const allJudgeEvals = await listJudgeEvaluations(id).catch((err) => {
    console.error(`[judge ${id}] listJudgeEvaluations failed`, err);
    return [];
  });
  const allVotes = await listVotes(id).catch((err) => {
    console.error(`[judge ${id}] listVotes failed`, err);
    return [];
  });
  const breakdown = scoreBreakdown(allEvals, allJudgeEvals, allVotes);

  // Identify the logged-in judge from the cookie set on /api/judge/login,
  // and load their existing evaluation (if any) for prefill.
  const jar = await cookies();
  const rawJudgeEmail = jar.get(JUDGE_EMAIL_COOKIE)?.value ?? "";
  const judgeEmail = isValidEmail(rawJudgeEmail)
    ? normalizeEmail(rawJudgeEmail)
    : null;
  const myEval = judgeEmail
    ? await getJudgeEvaluation(id, judgeEmail).catch((err) => {
        console.error(`[judge ${id}] getJudgeEvaluation failed`, err);
        return null;
      })
    : null;
  const otherJudgesCount =
    allJudgeEvals.filter((j) => j.judgeEmail !== judgeEmail).length;
  const aiScoresByDim: Partial<Record<DimKey, number>> = {};
  for (const e of allEvals) {
    aiScoresByDim[e.dimension as DimKey] = e.score;
  }

  const reRaw = sp.re;
  const reParam = Array.isArray(reRaw) ? reRaw[0] : reRaw;
  const reEvaluating: DimKey | null =
    reParam === "vibe" ||
    reParam === "originalidade" ||
    reParam === "execucao" ||
    reParam === "viabilidade"
      ? (reParam as DimKey)
      : null;

  const shortId = id.length > 16 ? id.slice(0, 16) : id;

  // Compute rank among completed submissions by composite final score.
  // Same defensive catches as above — one bad submission shouldn't take
  // down the page.
  const allSubs = await listSubmissions();
  const ranked = (
    await Promise.all(
      allSubs
        .filter((s) => s.status === "done")
        .map(async (s) => {
          const [evs, judges, votes] = await Promise.all([
            getEvaluations(s.id).catch(() => []),
            listJudgeEvaluations(s.id).catch(() => []),
            listVotes(s.id).catch(() => []),
          ]);
          return { id: s.id, final: scoreBreakdown(evs, judges, votes).final };
        }),
    )
  )
    .filter((s) => s.final != null)
    .sort((a, b) => (b.final ?? 0) - (a.final ?? 0));
  const rank = ranked.findIndex((s) => s.id === id);
  const rankLabel =
    rank >= 0 ? `#${String(rank + 1).padStart(2, "0")}` : "—";

  return (
    <div className="page">
      <SiteHeader variant="judge" />

      <div className="dd-stage page-body">
        <div className="dd-crumb">
          <Link href="/judge" className="ed-link" style={{ borderBottom: 0 }}>
            ← ranking
          </Link>
          <span className="muted t-mono-num" style={{ margin: "0 12px" }}>
            ·
          </span>
          <span className="muted t-mono-num">submissão #{shortId}</span>
        </div>

        <div className="dd-grid">
          <aside className="dd-left">
            <div className="dd-rank">
              <span
                className="t-edit-display"
                style={{ fontSize: 24, color: "var(--t-accent)" }}
              >
                {rankLabel}
              </span>
              <span className="muted t-mono-num" style={{ marginLeft: 8 }}>
                de {allSubs.length}
              </span>
            </div>
            <h1
              className="t-edit-h1"
              style={{ margin: "12px 0 4px", fontSize: 64 }}
            >
              {sub.projectName}
            </h1>
            <div className="muted-2" style={{ fontSize: 16, marginBottom: 6 }}>
              {sub.teamName}
            </div>
            {sub.tagline && (
              <div
                className="t-edit-quote"
                style={{
                  fontStyle: "italic",
                  color: "var(--t-fg-2)",
                  marginBottom: 32,
                }}
              >
                &ldquo;{sub.tagline}&rdquo;
              </div>
            )}

            <div className="dd-total">
              <div className="t-eyebrow" style={{ marginBottom: 12 }}>
                score final · IA 25% + juízes 50% + popular 25%
              </div>
              <div className="dd-total-num">
                <ScoreNumber value={breakdown.final} size="huge" />
              </div>
              <div className="dd-breakdown">
                <div className="dd-breakdown-item">
                  <span className="dd-breakdown-label">IA</span>
                  <span className="dd-breakdown-value">
                    {breakdown.ai != null ? breakdown.ai.toFixed(1) : "—"}
                  </span>
                  <span className="dd-breakdown-meta">4 dim</span>
                </div>
                <div className="dd-breakdown-item">
                  <span className="dd-breakdown-label">Júri</span>
                  <span className="dd-breakdown-value">
                    {breakdown.juri != null ? breakdown.juri.toFixed(1) : "—"}
                  </span>
                  <span className="dd-breakdown-meta">
                    {breakdown.juriCount} juiz
                    {breakdown.juriCount === 1 ? "" : "es"}
                  </span>
                </div>
                <div className="dd-breakdown-item">
                  <span className="dd-breakdown-label">Popular</span>
                  <span className="dd-breakdown-value">
                    {breakdown.popular != null
                      ? breakdown.popular.toFixed(1)
                      : "—"}
                  </span>
                  <span className="dd-breakdown-meta">
                    {breakdown.popularCount} voto
                    {breakdown.popularCount === 1 ? "" : "s"}
                  </span>
                </div>
              </div>
            </div>

            <div className="dd-links">
              <a
                className="dd-link"
                href={
                  sub.githubUrl.startsWith("http")
                    ? sub.githubUrl
                    : `https://${sub.githubUrl}`
                }
                target="_blank"
                rel="noreferrer"
              >
                <span>github</span>
                <span>↗</span>
              </a>
              {sub.demoUrl && (
                <a
                  className="dd-link"
                  href={
                    sub.demoUrl.startsWith("http")
                      ? sub.demoUrl
                      : `https://${sub.demoUrl}`
                  }
                  target="_blank"
                  rel="noreferrer"
                >
                  <span>demo</span>
                  <span>↗</span>
                </a>
              )}
              {sub.videoUrl && (
                <a className="dd-link">
                  <span>vídeo</span>
                  <span>↗</span>
                </a>
              )}
            </div>

            <section className="dd-section">
              <div className="t-eyebrow">descrição</div>
              <p
                style={{
                  margin: "12px 0 0",
                  lineHeight: 1.6,
                  color: "var(--t-fg)",
                  fontSize: 15,
                }}
              >
                {sub.description}
              </p>
            </section>

            {parseJsonArray(sub.screenshotUrls).length > 0 && (
              <section className="dd-section">
                <div className="t-eyebrow">screenshots</div>
                <div className="dd-shots">
                  {parseJsonArray(sub.screenshotUrls)
                    .slice(0, 4)
                    .map((url, i) => (
                      <div
                        key={url}
                        className={`dd-shot v${(i % 4) + 1}`}
                        style={
                          url.startsWith("/uploads")
                            ? {
                                backgroundImage: `url(${url})`,
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                              }
                            : undefined
                        }
                      />
                    ))}
                </div>
              </section>
            )}

            {sub.videoUrl && (
              <section className="dd-section">
                <div className="t-eyebrow">pitch</div>
                <div className="dd-video">
                  <div className="vid-play">▶</div>
                </div>
              </section>
            )}

            <ReevaluateControls submissionId={sub.id} />
          </aside>

          <main className="dd-right">
            {judgeEmail ? (
              <JudgeScoreInput
                submissionId={sub.id}
                judgeEmail={judgeEmail}
                initial={
                  myEval
                    ? {
                        scores: {
                          vibe: myEval.vibe,
                          originalidade: myEval.originalidade,
                          execucao: myEval.execucao,
                          viabilidade: myEval.viabilidade,
                        },
                        notes: myEval.notes ?? "",
                      }
                    : null
                }
                aiScores={aiScoresByDim}
                otherJudgesCount={otherJudgesCount}
              />
            ) : null}

            {DIM_ORDER.map((d, i) => {
              const ev = evalByDim.get(d);
              const evaluating = reEvaluating === d;
              if (!ev && !evaluating) {
                return (
                  <div key={d} className="sc">
                    <header className="sc-head">
                      <div>
                        <div className="t-eyebrow">{DIM_LABELS[d].sub}</div>
                        <h3 className="sc-label">{DIM_LABELS[d].label}</h3>
                      </div>
                      <div className="sc-score muted t-mono-num">—</div>
                    </header>
                    <p className="muted-2">
                      Sem avaliação registrada nesta dimensão.
                    </p>
                  </div>
                );
              }
              return (
                <ScoreCard
                  key={d}
                  dim={d}
                  label={DIM_LABELS[d].label}
                  sub={DIM_LABELS[d].sub}
                  defaultExpanded={i === 0}
                  evaluating={evaluating}
                  data={
                    ev
                      ? {
                          score: ev.score,
                          one_liner: ev.oneLiner,
                          strengths: parseJsonArray(ev.strengths),
                          weaknesses: parseJsonArray(ev.weaknesses),
                          evidence_used: parseJsonArray(ev.evidenceUsed),
                          reasoning: ev.reasoning,
                        }
                      : {
                          score: 0,
                          one_liner: "",
                          strengths: [],
                          weaknesses: [],
                          evidence_used: [],
                          reasoning: "",
                        }
                  }
                />
              );
            })}

            <div className="dd-meta">
              {allEvals[0] ? (
                <>
                  avaliado por{" "}
                  <span className="t-mono-num">{allEvals[0].model}</span> às{" "}
                  <span className="t-mono-num">
                    {sub.evaluatedAt
                      ? new Date(sub.evaluatedAt).toLocaleString("pt-BR")
                      : "—"}
                  </span>
                </>
              ) : (
                <>aguardando primeira avaliação.</>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
