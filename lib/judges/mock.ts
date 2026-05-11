import type { Dimension, DimensionEvalOutput } from "./schema";
import type { RepoEvidence } from "../evidence/fetch-repo";
import type { SubmissionRow } from "../db/schema";

/**
 * Deterministic mock judge — used as a fallback when AI_GATEWAY_API_KEY
 * is not configured. Scores derive from real submission signals so the
 * output isn't random:
 *
 * - vibe ............ length+structure of the description, count of screenshots
 * - originalidade ... description vocabulary diversity vs. generic words
 * - execucao ........ repo signals: file count, README size, README mentions of "test"/"deploy"
 * - viabilidade ..... description mentions of users/cost/market, demo URL presence
 */

export const MOCK_MODEL = "mock/deterministic-v1";

const GENERIC = [
  "ai",
  "ia",
  "gpt",
  "chat",
  "bot",
  "ferramenta",
  "plataforma",
  "app",
];

function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0xffffffff;
  return h;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function jitter(seed: number, span = 0.5): number {
  // returns value in [-span, +span] from a hash seed
  return ((seed % 1000) / 1000 - 0.5) * 2 * span;
}

export function mockJudge(
  dim: Dimension,
  sub: SubmissionRow,
  repo: RepoEvidence,
): DimensionEvalOutput {
  const seed = hashSeed(`${sub.id}:${dim}`);

  switch (dim) {
    case "vibe":
      return mockVibe(sub, seed);
    case "originalidade":
      return mockOriginalidade(sub, seed);
    case "execucao":
      return mockExecucao(sub, repo, seed);
    case "viabilidade":
      return mockViabilidade(sub, seed);
  }
}

function shotsCount(sub: SubmissionRow): number {
  try {
    return Array.isArray(JSON.parse(sub.screenshotUrls ?? "[]"))
      ? JSON.parse(sub.screenshotUrls ?? "[]").length
      : 0;
  } catch {
    return 0;
  }
}

function mockVibe(sub: SubmissionRow, seed: number): DimensionEvalOutput {
  const shots = shotsCount(sub);
  const hasVideo = !!sub.videoUrl;
  const descLen = sub.description.length;
  let score =
    4.5 +
    shots * 0.6 +
    (hasVideo ? 0.8 : 0) +
    (descLen > 250 ? 0.7 : 0) +
    jitter(seed);
  score = clamp(score, 3.2, 9.4);
  const strengths: string[] = [];
  if (shots >= 3) strengths.push("Screenshots mostram cuidado com identidade visual");
  if (hasVideo) strengths.push("Pitch em vídeo dá ritmo à apresentação");
  if (descLen > 250) strengths.push("Microcopy da descrição soa intencional");
  if (strengths.length === 0)
    strengths.push("Material entregue dentro do escopo pedido");
  const weaknesses: string[] = [];
  if (shots < 2) weaknesses.push("Faltam screenshots pra avaliar polish");
  if (!hasVideo)
    weaknesses.push("Sem vídeo de pitch — perde-se a leitura de tom");
  if (descLen < 200)
    weaknesses.push("Descrição curta deixa a vibe difícil de aferir");
  return {
    score: Math.round(score * 10) / 10,
    one_liner:
      score >= 7.5
        ? `${sub.projectName} tem identidade visual rara pra hackathon.`
        : score >= 5.5
          ? `Funcional, mas ainda parece um scaffold.`
          : `Falta polish suficiente pra ler como produto.`,
    strengths,
    weaknesses,
    evidence_used: [
      ...(shots > 0 ? [`screenshot 1`, `screenshot ${shots}`] : []),
      ...(hasVideo ? ["pitch (auto-stub)"] : []),
      "descrição",
    ],
    reasoning: `Avaliação determinística baseada em sinais entregues: ${shots} screenshot(s), vídeo ${
      hasVideo ? "presente" : "ausente"
    }, descrição de ${descLen} caracteres. Em ${
      sub.projectName
    }, a leitura é que ${
      score >= 7.5
        ? "o time investiu em identidade e isso transparece nos artefatos."
        : "o produto tá funcional mas ainda não comunica gosto próprio."
    } Substituir por avaliação real com AI Gateway pra leitura visual completa.`,
  };
}

function mockOriginalidade(
  sub: SubmissionRow,
  seed: number,
): DimensionEvalOutput {
  const desc = sub.description.toLowerCase();
  const genericHits = GENERIC.filter((w) => desc.includes(w)).length;
  const uniqueWords = new Set(
    desc.replace(/[^\p{L}\s]/gu, "").split(/\s+/).filter(Boolean),
  ).size;
  let score = 5 + uniqueWords / 40 - genericHits * 0.4 + jitter(seed, 0.6);
  score = clamp(score, 3.0, 9.5);
  return {
    score: Math.round(score * 10) / 10,
    one_liner:
      score >= 7.5
        ? "Ângulo não-óbvio — não é mais um wrapper de LLM."
        : score >= 5.5
          ? "Variação reconhecível, mas com twist próprio."
          : "Bem perto de coisas que já existem.",
    strengths: [
      `Vocabulário diverso (${uniqueWords} palavras únicas) — descrição não é template`,
      ...(genericHits === 0
        ? ["Não cai em jargão genérico de pitch de IA"]
        : []),
    ],
    weaknesses:
      genericHits >= 2
        ? [
            `Descrição usa ${genericHits} termos genéricos ("${GENERIC.filter((w) => desc.includes(w))
              .slice(0, 3)
              .join('", "')}") — pode esconder o ângulo`,
          ]
        : [],
    evidence_used: ["descrição", "README"],
    reasoning: `Análise determinística por proxy: a descrição do projeto tem ${uniqueWords} palavras únicas e ${genericHits} termos de jargão (${GENERIC.slice(
      0,
      3,
    ).join(
      ", ",
    )}). Originalidade é onde o juiz LLM ganha mais — vale rodar com chave de verdade pra comparar com produtos similares e calibrar.`,
  };
}

function mockExecucao(
  sub: SubmissionRow,
  repo: RepoEvidence,
  seed: number,
): DimensionEvalOutput {
  if (!repo.exists) {
    return {
      score: 1.5,
      one_liner:
        "não consegui inspecionar o repositório — sem evidência técnica.",
      strengths: [],
      weaknesses: [
        repo.error ?? "repositório inacessível",
        "sem código pra avaliar arquitetura",
      ],
      evidence_used: [`tentativa de clonar ${sub.githubUrl}`],
      reasoning: `O avaliador automático não conseguiu acessar ${sub.githubUrl} (${
        repo.error ?? "motivo desconhecido"
      }). Sem evidência, fica registrada a nota mínima pra essa dimensão. Tornar o repo público e re-avaliar.`,
    };
  }
  const fileCount = repo.fileTree.length;
  const readmeLen = repo.readme?.length ?? 0;
  const hasReadme = readmeLen > 200;
  const hasTests = repo.fileTree.some((p) =>
    /(__tests__|\.test\.|\.spec\.|cypress|playwright|vitest)/.test(p),
  );
  const hasCI = repo.fileTree.some((p) => p.startsWith(".github/workflows/"));
  let score =
    4.5 +
    Math.min(2, fileCount / 25) +
    (hasReadme ? 1.2 : -0.4) +
    (hasTests ? 0.8 : 0) +
    (hasCI ? 0.6 : 0) +
    jitter(seed);
  score = clamp(score, 2.5, 9.4);
  const strengths: string[] = [];
  if (hasReadme) strengths.push("README com conteúdo (não é só placeholder)");
  if (fileCount > 30)
    strengths.push(`${fileCount}+ arquivos versionados — projeto tem corpo`);
  if (hasTests) strengths.push("Existe estrutura de testes");
  if (hasCI) strengths.push("CI configurado");
  if (strengths.length === 0)
    strengths.push("Repositório acessível e clonável");
  const weaknesses: string[] = [];
  if (!hasReadme)
    weaknesses.push("README ausente ou raso — dificulta avaliar");
  if (!hasTests) weaknesses.push("Sem sinais de testes automatizados");
  if (fileCount < 10)
    weaknesses.push(`Apenas ${fileCount} arquivos — escopo curto`);
  return {
    score: Math.round(score * 10) / 10,
    one_liner:
      score >= 7.5
        ? "Estrutura sólida pro tempo disponível."
        : score >= 5.5
          ? "Funciona, mas dá pra ver onde o relógio apertou."
          : "Tá fechado nas bordas, faltam pontos importantes.",
    strengths,
    weaknesses,
    evidence_used: [
      `repositório (${fileCount} arquivos)`,
      ...(hasReadme ? ["README"] : []),
      ...(hasCI ? [".github/workflows"] : []),
    ],
    reasoning: `Heurística sobre o tree do repo: ${fileCount} arquivos (filtrados), README de ${readmeLen} chars, testes ${
      hasTests ? "presentes" : "ausentes"
    }, CI ${hasCI ? "configurado" : "não configurado"}. Linguagem principal: ${
      repo.language ?? "—"
    }. Trocar por juiz LLM dá leitura real do código.`,
  };
}

function mockViabilidade(
  sub: SubmissionRow,
  seed: number,
): DimensionEvalOutput {
  const desc = sub.description.toLowerCase();
  const hasDemo = !!sub.demoUrl;
  const mentionsUser = /usuário|user|cliente|mercado|cobrar|grátis|premium|saa?s|b2b|b2c/.test(
    desc,
  );
  let score =
    5 + (hasDemo ? 1 : 0) + (mentionsUser ? 1.2 : 0) + jitter(seed, 0.7);
  score = clamp(score, 3.0, 9.0);
  return {
    score: Math.round(score * 10) / 10,
    one_liner:
      score >= 7.5
        ? "Tem caminho claro pra continuar fora do hackathon."
        : score >= 5.5
          ? "Plausível, mas tem questões em aberto."
          : "Mais demo do que produto.",
    strengths: [
      ...(hasDemo ? ["Demo deployada permite testes reais"] : []),
      ...(mentionsUser ? ["Descrição cita usuários e modelo de negócio"] : []),
      "Problema com frequência de uso identificável",
    ],
    weaknesses:
      score < 7
        ? [
            ...(hasDemo ? [] : ["Sem demo pública — depende de imaginar"]),
            "Custo unitário não modelado",
            "Distribuição depende de partnership/SEO ainda não testados",
          ]
        : ["Risco de plataforma — feature pode ser absorvida por incumbentes"],
    evidence_used: ["descrição", ...(hasDemo ? ["demo URL"] : []), "README"],
    reasoning: `Análise determinística pela descrição (${desc.length} chars). Sinal de ${
      mentionsUser ? "menção a usuário/modelo de negócio" : "ausência de tese de mercado"
    }, demo ${hasDemo ? "deployada" : "ausente"}. Viabilidade real precisa de juiz LLM porque é a dimensão que mais depende de raciocínio sobre tese — substituir quando AI key estiver disponível.`,
  };
}
