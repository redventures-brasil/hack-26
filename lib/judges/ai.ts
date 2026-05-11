import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import type { Dimension, DimensionEvalOutput } from "./schema";
import { DimensionEvalSchema } from "./schema";
import type { RepoEvidence } from "../evidence/fetch-repo";
import type { SubmissionRow } from "../db/schema";

export const AI_MODEL = "anthropic/claude-sonnet-4-6";

export function aiAvailable(): boolean {
  // Gateway key is preferred, but if a direct Anthropic key is set the
  // @ai-sdk/anthropic provider picks it up automatically.
  return !!(process.env.AI_GATEWAY_API_KEY || process.env.ANTHROPIC_API_KEY);
}

const SYSTEM_BASE = `Você é um juiz IA do HACK-26, um vibethon. Avalia um projeto em uma dimensão específica de 0 a 10 e devolve JSON estruturado em PT-BR. Tom: direto, sem clichê, sem "✨ powered by AI ✨". Penalize estética genérica (gradiente roxo, glassmorphism sem motivo) em "vibe". Em "execução", priorize coerência interna sobre escolha de stack. Em "originalidade", sempre referencie "isso me lembra X porque Y" se aplicável. Em "viabilidade", pense como investidor pragmático, sem ser cruel com protótipos.`;

const DIM_INSTRUCTIONS: Record<Dimension, string> = {
  vibe: `Avalie polish visual, identidade tipográfica, gosto, microinterações. Use os screenshots + URL do demo + (se houver) frames do vídeo. Penalize fortemente o "AI default look".`,
  originalidade: `Avalie quão novo é o ângulo do projeto. Use a descrição, README, e (se houver) transcrição do vídeo. Compare com soluções existentes — declare "isso me lembra X porque Y" no reasoning.`,
  execucao: `Avalie qualidade técnica: arquitetura, README, estrutura de arquivos, sinais de bugs ou red flags (secrets em client, etc). Use o tree do repositório e o README.`,
  viabilidade: `Avalie se o projeto sobrevive fora do hackathon. Usuário claro? Dor real? Modelo de receita plausível? Use descrição + (se houver) pitch + demo.`,
};

export async function aiJudge(
  dim: Dimension,
  sub: SubmissionRow,
  repo: RepoEvidence,
): Promise<DimensionEvalOutput> {
  const evidence = buildEvidence(dim, sub, repo);
  const { object } = await generateObject({
    model: anthropic("claude-sonnet-4-6"),
    schema: DimensionEvalSchema,
    system: `${SYSTEM_BASE}\n\nDimensão atual: ${dim}. ${DIM_INSTRUCTIONS[dim]}`,
    prompt: `Avalie o seguinte projeto na dimensão "${dim}". Devolva JSON conforme schema.\n\n${evidence}`,
    temperature: 0.3,
  });
  return object;
}

function buildEvidence(
  dim: Dimension,
  sub: SubmissionRow,
  repo: RepoEvidence,
): string {
  const screenshots = safeJsonArray(sub.screenshotUrls);
  const parts: string[] = [];

  parts.push(`# Projeto`);
  parts.push(`- Nome: ${sub.projectName}`);
  parts.push(`- Time: ${sub.teamName}`);
  if (sub.tagline) parts.push(`- Tagline: ${sub.tagline}`);
  parts.push(`- Descrição: ${sub.description}`);
  parts.push(`- GitHub: ${sub.githubUrl}`);
  if (sub.demoUrl) parts.push(`- Demo: ${sub.demoUrl}`);

  if (dim === "vibe" || dim === "viabilidade") {
    if (screenshots.length > 0)
      parts.push(`- Screenshots fornecidos: ${screenshots.length}`);
    if (sub.videoUrl) parts.push(`- Vídeo de pitch: ${sub.videoUrl}`);
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

  return parts.join("\n");
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
