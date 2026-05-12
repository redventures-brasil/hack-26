import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import type { Dimension, DimensionEvalOutput } from "./schema";
import { DimensionEvalSchema } from "./schema";
import type { RepoEvidence } from "../evidence/fetch-repo";
import type { SubmissionRow } from "../db/schema";

// Claude Opus 4.7 is the most capable Anthropic model — better reasoning
// in vibe/viabilidade and stronger code reading in execução. Slower and
// pricier than Sonnet 4.6 but the run is 4 dims × 30 projects, so the
// total bill is still small.
export const AI_MODEL = "anthropic/claude-opus-4-7";
const ANTHROPIC_MODEL_ID = "claude-opus-4-7";

// Cap how many screenshots we attach as image inputs so we stay well
// under Anthropic's per-request image limit and bill predictably.
const MAX_IMAGES = 8;

export function aiAvailable(): boolean {
  // Gateway key is preferred, but if a direct Anthropic key is set the
  // @ai-sdk/anthropic provider picks it up automatically.
  return !!(process.env.AI_GATEWAY_API_KEY || process.env.ANTHROPIC_API_KEY);
}

const SYSTEM_BASE = `Você é um juiz IA do HACK-26, um vibethon. Avalia um projeto em uma dimensão específica de 0 a 10 e devolve JSON estruturado em PT-BR. Tom: direto, sem clichê, sem "✨ powered by AI ✨". Penalize estética genérica (gradiente roxo, glassmorphism sem motivo) em "vibe". Em "execução", priorize coerência interna sobre escolha de stack. Em "originalidade", sempre referencie "isso me lembra X porque Y" se aplicável. Em "viabilidade", pense como investidor pragmático, sem ser cruel com protótipos.`;

const DIM_INSTRUCTIONS: Record<Dimension, string> = {
  vibe: `Avalie polish visual, identidade tipográfica, gosto, microinterações. Os screenshots do projeto estão anexados como imagens — analise diretamente. URL do demo e do vídeo de pitch são citadas apenas como referência (você não consegue visitar nem assistir). Penalize fortemente o "AI default look" e dê crédito a escolhas específicas. Se não há screenshots, julgue com cautela usando apenas a descrição textual e seja transparente sobre essa limitação no reasoning.`,
  originalidade: `Avalie quão novo é o ângulo do projeto a partir da descrição, do README e da estrutura de arquivos do repositório. Compare com soluções existentes — declare "isso me lembra X porque Y" no reasoning quando se aplicar.`,
  execucao: `Avalie qualidade técnica a partir do tree do repositório, do README e dos metadados (linguagem, último push, stars). Procure por arquitetura coerente, organização modular, sinais de testes/CI, README com setup claro. Você não vê o conteúdo dos arquivos — extraia o que dá da estrutura. Cite red flags se notar (ex: secrets em filename de client, ausência de .gitignore).`,
  viabilidade: `Avalie se o projeto sobrevive fora do hackathon. Usuário claro? Dor real? Modelo de receita plausível? Os screenshots (anexados como imagens) ajudam a inferir maturidade do produto. URLs de demo/vídeo são tratadas como sinais binários (presença = team pensou em pitch). Não há fetch do demo nem leitura do código.`,
};

type Evidence = {
  text: string;
  images: string[];
};

export async function aiJudge(
  dim: Dimension,
  sub: SubmissionRow,
  repo: RepoEvidence,
): Promise<DimensionEvalOutput> {
  const evidence = buildEvidence(dim, sub, repo);

  // Vercel AI SDK v6 multimodal content: pass an array of parts on a
  // `user` message. Each `image` part gets fetched server-side and
  // converted to base64 for Anthropic's vision API.
  const userContent: Array<
    | { type: "text"; text: string }
    | { type: "image"; image: URL }
  > = [
    {
      type: "text",
      text: `Avalie o seguinte projeto na dimensão "${dim}". Devolva JSON conforme schema.\n\n${evidence.text}`,
    },
  ];
  for (const url of evidence.images.slice(0, MAX_IMAGES)) {
    try {
      userContent.push({ type: "image", image: new URL(url) });
    } catch {
      // Skip anything that doesn't parse as an absolute URL (local dev
      // fallback paths like "/uploads/...").
    }
  }

  const { object } = await generateObject({
    model: anthropic(ANTHROPIC_MODEL_ID),
    schema: DimensionEvalSchema,
    system: `${SYSTEM_BASE}\n\nDimensão atual: ${dim}. ${DIM_INSTRUCTIONS[dim]}`,
    messages: [{ role: "user", content: userContent }],
    temperature: 0.3,
  });
  return object;
}

function buildEvidence(
  dim: Dimension,
  sub: SubmissionRow,
  repo: RepoEvidence,
): Evidence {
  const screenshots = safeJsonArray(sub.screenshotUrls);
  const parts: string[] = [];
  const images: string[] = [];

  parts.push(`# Projeto`);
  parts.push(`- Nome: ${sub.projectName}`);
  parts.push(`- Time: ${sub.teamName}`);
  if (sub.tagline) parts.push(`- Tagline: ${sub.tagline}`);
  parts.push(`- Descrição: ${sub.description}`);
  parts.push(`- GitHub: ${sub.githubUrl}`);
  if (sub.demoUrl) parts.push(`- Demo: ${sub.demoUrl}`);

  if (dim === "vibe" || dim === "viabilidade") {
    if (screenshots.length > 0) {
      parts.push(
        `- Screenshots: ${screenshots.length} (anexados como imagens nesta mensagem)`,
      );
      for (const s of screenshots) {
        if (/^https?:\/\//i.test(s)) images.push(s);
      }
    } else {
      parts.push(`- Screenshots: nenhum enviado`);
    }
    if (sub.videoUrl) {
      parts.push(
        `- Vídeo de pitch: ${sub.videoUrl} (URL apenas; conteúdo não está disponível pra você)`,
      );
    }
  }

  if (dim === "execucao" || dim === "originalidade") {
    parts.push(`\n# Repositório`);
    if (!repo.exists) {
      parts.push(
        `- Status: INACESSÍVEL — ${repo.error ?? "motivo desconhecido"}`,
      );
    } else {
      parts.push(`- Linguagem: ${repo.language ?? "—"}`);
      parts.push(`- Stars: ${repo.stars}`);
      if (repo.pushedAt) parts.push(`- Último push: ${repo.pushedAt}`);
      parts.push(`\n## Tree (até 60 arquivos)`);
      parts.push(repo.fileTree.slice(0, 60).map((p) => `- ${p}`).join("\n"));
      if (repo.readme) {
        parts.push(`\n## README (truncado a 8k chars)`);
        parts.push("```");
        parts.push(repo.readme.slice(0, 8000));
        parts.push("```");
      } else {
        parts.push(`\n## README: ausente ou ilegível`);
      }
    }
  }

  return { text: parts.join("\n"), images };
}

function safeJsonArray(s: string | null): string[] {
  if (!s) return [];
  try {
    const j = JSON.parse(s);
    return Array.isArray(j) ? j : [];
  } catch {
    return [];
  }
}
