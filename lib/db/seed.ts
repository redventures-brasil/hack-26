/**
 * Seed the local SQLite DB with the fictional HACK-26 teams + Refila's
 * full evaluation. Idempotent — running it twice is safe (uses upserts).
 *
 * Run via: `npm run db:seed`
 */

import { db, schema } from "./client";
import { SEED_TEAMS, REFILA_EVAL, type DimensionEval } from "../data";

const MODEL = "anthropic/claude-sonnet-4-6";

// Parse "DD/MM/YYYY · HH:MM" into a Date (Brazil event time = local).
function parseBR(s: string | null): Date | null {
  if (!s) return null;
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4}).*?(\d{2}):(\d{2})/);
  if (!m) return null;
  const [, dd, mm, yyyy, hh, min] = m;
  return new Date(
    Number(yyyy),
    Number(mm) - 1,
    Number(dd),
    Number(hh),
    Number(min),
  );
}

function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

async function seed() {
  // wipe + reseed for predictability
  db.$client.exec(`DELETE FROM evaluations`);
  db.$client.exec(`DELETE FROM popular_votes`);
  db.$client.exec(`DELETE FROM submissions`);

  for (const t of SEED_TEAMS) {
    const created = parseBR(t.submittedAt) ?? new Date();
    const evaluatedAt = parseBR(t.evaluatedAt);

    db.insert(schema.submissions)
      .values({
        id: t.id,
        teamName: t.team,
        projectName: t.project,
        tagline: t.tagline,
        description: t.description,
        githubUrl: t.github,
        demoUrl: t.demo,
        videoUrl: t.video ? "/uploads/seed/pitch.mp4" : null,
        screenshotUrls: JSON.stringify([
          "/uploads/seed/shot-1.png",
          "/uploads/seed/shot-2.png",
          "/uploads/seed/shot-3.png",
          "/uploads/seed/shot-4.png",
        ]),
        status: t.status,
        errorMessage: t.error ?? null,
        createdAt: created,
        evaluatedAt,
      })
      .run();
  }

  // Refila gets the full curated 4-dimension eval.
  const refila = SEED_TEAMS.find((t) => t.id === "tokenless")!;
  const refilaEvalAt = parseBR(refila.evaluatedAt) ?? new Date();
  const dims: Array<{ key: keyof typeof REFILA_EVAL; data: DimensionEval }> = [
    { key: "vibe", data: REFILA_EVAL.vibe },
    { key: "originalidade", data: REFILA_EVAL.originalidade },
    { key: "execucao", data: REFILA_EVAL.execucao },
    { key: "viabilidade", data: REFILA_EVAL.viabilidade },
  ];
  for (const { key, data } of dims) {
    db.insert(schema.evaluations)
      .values({
        id: uid(`eval-${refila.id}-${key}`),
        submissionId: refila.id,
        dimension: key,
        score: data.score,
        oneLiner: data.one_liner,
        strengths: JSON.stringify(data.strengths),
        weaknesses: JSON.stringify(data.weaknesses),
        evidenceUsed: JSON.stringify(data.evidence_used),
        reasoning: data.reasoning,
        model: MODEL,
        createdAt: refilaEvalAt,
      })
      .run();
  }

  // Other "done" teams get synthetic per-dim evals so the dashboard
  // looks alive. We generate placeholder text but keep their scores.
  for (const t of SEED_TEAMS) {
    if (t.status !== "done" || t.id === "tokenless") continue;
    const evAt = parseBR(t.evaluatedAt) ?? new Date();
    const allDims = ["vibe", "originalidade", "execucao", "viabilidade"] as const;
    for (const dim of allDims) {
      const score = t.scores[dim];
      if (score == null) continue;
      db.insert(schema.evaluations)
        .values({
          id: uid(`eval-${t.id}-${dim}`),
          submissionId: t.id,
          dimension: dim,
          score,
          oneLiner: synthOneLiner(dim, score, t.project),
          strengths: JSON.stringify(synthStrengths(dim, score)),
          weaknesses: JSON.stringify(synthWeaknesses(dim, score)),
          evidenceUsed: JSON.stringify(synthEvidence(dim)),
          reasoning: synthReasoning(dim, score, t.project),
          model: MODEL,
          createdAt: evAt,
        })
        .run();
    }
  }

  const counts = {
    submissions: db.$client
      .prepare(`SELECT COUNT(*) as n FROM submissions`)
      .get() as { n: number },
    evaluations: db.$client
      .prepare(`SELECT COUNT(*) as n FROM evaluations`)
      .get() as { n: number },
  };
  console.log(
    `seeded · ${counts.submissions.n} submissions · ${counts.evaluations.n} evaluations`,
  );
}

/* ----- synthetic copy generators for the demo --------------- */

function synthOneLiner(dim: string, score: number, project: string): string {
  const high = score >= 8;
  const mid = score >= 6 && score < 8;
  const map: Record<string, [string, string, string]> = {
    vibe: [
      `${project} tem identidade visual rara pra hackathon.`,
      `Polish acima da média, mas escorrega em alguns lugares.`,
      `Funciona mas ainda parece um template.`,
    ],
    originalidade: [
      `Um ângulo que não tinha sido olhado direito antes.`,
      `Variação interessante de algo conhecido.`,
      `É uma versão de algo que já existe.`,
    ],
    execucao: [
      `Funciona ponta-a-ponta com decisões coerentes.`,
      `Funciona, mas dá pra ver onde o relógio apertou.`,
      `Tá fechado nas bordas, faltam pontos importantes.`,
    ],
    viabilidade: [
      `Vira produto sem grandes pulos.`,
      `Plausível, mas tem questões em aberto.`,
      `Mais demo do que negócio.`,
    ],
  };
  const t = map[dim] ?? ["", "", ""];
  return high ? t[0] : mid ? t[1] : t[2];
}

function synthStrengths(dim: string, score: number): string[] {
  const base: Record<string, string[]> = {
    vibe: [
      "Tipografia coerente, não parece scaffold",
      "Cor e espaço respeitam um sistema",
      "Microcopy com personalidade",
    ],
    originalidade: [
      "Insight não-óbvio sobre o problema",
      "Combina coisas conhecidas de um jeito novo",
    ],
    execucao: [
      "Demo deployada e funcionando",
      "Separação clara de responsabilidades",
      "README explica como rodar",
    ],
    viabilidade: [
      "Problema com frequência alta",
      "Caminho claro de monetização",
    ],
  };
  return (base[dim] ?? []).slice(0, score >= 7 ? 3 : 2);
}

function synthWeaknesses(dim: string, score: number): string[] {
  const base: Record<string, string[]> = {
    vibe: ["Alguns componentes ainda parecem placeholder"],
    originalidade: ["Risco de overlap com produtos existentes"],
    execucao: [
      "Falta tratamento de edge cases óbvios",
      "Sem testes",
    ],
    viabilidade: [
      "Modelo de receita não testado",
      "Custos de operação não modelados",
    ],
  };
  return (base[dim] ?? []).slice(0, score < 7 ? 2 : 1);
}

function synthEvidence(dim: string): string[] {
  switch (dim) {
    case "vibe":
      return ["screenshot 1", "screenshot 3", "demo URL"];
    case "originalidade":
      return ["descrição", "README"];
    case "execucao":
      return ["repositório", "README", "demo URL"];
    case "viabilidade":
      return ["descrição", "demo URL"];
    default:
      return ["descrição"];
  }
}

function synthReasoning(dim: string, score: number, project: string): string {
  if (score >= 8) {
    return `${project} se sai bem em ${dim}. Os pontos fortes carregam o resultado, e os pontos fracos são refinamento, não estrutura. Avaliado considerando que é um projeto de hackathon — o que torna o desempenho ainda mais notável.`;
  }
  if (score >= 6) {
    return `${project} é sólido em ${dim} mas tem pontos cegos. Não vejo problema estrutural, e sim espaço pra polir. Comum em hackathon. Vale uma segunda passada se o time tiver fôlego.`;
  }
  return `${project} fica raso em ${dim}. Não é falha técnica — é que essa dimensão não recebeu atenção. Em hackathon isso acontece; só fica registrado pra calibrar a comparação com os outros projetos.`;
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("seed failed:", err);
    process.exit(1);
  });
