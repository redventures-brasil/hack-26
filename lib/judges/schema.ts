import { z } from "zod";

export const DimensionSchema = z.enum([
  "vibe",
  "originalidade",
  "execucao",
  "viabilidade",
]);
export type Dimension = z.infer<typeof DimensionSchema>;

export const DimensionEvalSchema = z.object({
  score: z.number().min(0).max(10),
  one_liner: z.string().min(8).max(220),
  strengths: z.array(z.string().max(220)).min(1).max(5),
  weaknesses: z.array(z.string().max(220)).min(0).max(5),
  evidence_used: z.array(z.string().max(120)).min(1).max(10),
  reasoning: z.string().min(40).max(1400),
});
export type DimensionEvalOutput = z.infer<typeof DimensionEvalSchema>;

export const DIMENSION_LABELS: Record<
  Dimension,
  { label: string; sub: string }
> = {
  vibe: { label: "Vibe", sub: "polish, identidade, gosto" },
  originalidade: {
    label: "Originalidade",
    sub: "quão novo é o ângulo",
  },
  execucao: {
    label: "Execução técnica",
    sub: "código, arquitetura, README",
  },
  viabilidade: {
    label: "Viabilidade real",
    sub: "sobrevive fora do hackathon?",
  },
};
