"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

const DIMS = [
  { key: "vibe", label: "Vibe", sub: "polish, identidade, gosto" },
  {
    key: "originalidade",
    label: "Originalidade",
    sub: "quão novo é o ângulo",
  },
  {
    key: "execucao",
    label: "Execução técnica",
    sub: "código, arquitetura, README",
  },
  {
    key: "viabilidade",
    label: "Viabilidade real",
    sub: "sobrevive fora do hackathon?",
  },
] as const;

type DimKey = (typeof DIMS)[number]["key"];
type Scores = Record<DimKey, number>;

type Props = {
  submissionId: string;
  /** Logged-in judge email (from the cookie, mirrored from server). */
  judgeEmail: string;
  /** Existing scores from this same judge, if any. */
  initial: { scores: Scores; notes: string } | null;
  /** AI's per-dimension scores, for inline comparison. */
  aiScores: Partial<Scores>;
  /** How many other judges already evaluated this submission. */
  otherJudgesCount: number;
};

const DEFAULT_SCORE = 5;

export function JudgeScoreInput({
  submissionId,
  judgeEmail,
  initial,
  aiScores,
  otherJudgesCount,
}: Props) {
  const router = useRouter();
  const [scores, setScores] = useState<Scores>(
    initial?.scores ?? {
      vibe: DEFAULT_SCORE,
      originalidade: DEFAULT_SCORE,
      execucao: DEFAULT_SCORE,
      viabilidade: DEFAULT_SCORE,
    },
  );
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(
    initial ? new Date() : null,
  );

  const myAvg =
    (scores.vibe + scores.originalidade + scores.execucao + scores.viabilidade) /
    4;

  async function submit() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/judge/${submissionId}/evaluate`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ...scores, notes: notes.trim() || null }),
        });
        if (!res.ok) {
          let reason = "generic";
          try {
            const j = (await res.json()) as { error?: string };
            if (j.error) reason = j.error;
          } catch {
            /* ignore */
          }
          setError(reason);
          return;
        }
        setSavedAt(new Date());
        router.refresh();
      } catch {
        setError("network");
      }
    });
  }

  return (
    <section className="je-card">
      <header className="je-head">
        <div>
          <div className="t-eyebrow">sua avaliação</div>
          <h3 className="je-title">como juiz</h3>
        </div>
        <div className="je-summary">
          <div className="t-eyebrow">sua média</div>
          <div className="je-summary-num t-mono-num">{myAvg.toFixed(1)}</div>
        </div>
      </header>

      <p className="muted-2 t-small" style={{ marginTop: 8, marginBottom: 24 }}>
        Logado como{" "}
        <span className="t-mono-num">{judgeEmail}</span>.{" "}
        {otherJudgesCount === 0
          ? "Você é o primeiro juiz desse projeto."
          : `${otherJudgesCount} outro${otherJudgesCount === 1 ? "" : "s"} juiz${otherJudgesCount === 1 ? "" : "es"} já avaliou${otherJudgesCount === 1 ? "" : "ram"}.`}
      </p>

      <div className="je-grid">
        {DIMS.map((d) => {
          const ai = aiScores[d.key];
          const v = scores[d.key];
          return (
            <div className="je-row" key={d.key}>
              <div className="je-row-head">
                <div>
                  <div className="t-eyebrow">{d.sub}</div>
                  <div className="je-row-label">{d.label}</div>
                </div>
                <div className="je-row-scores">
                  {typeof ai === "number" && (
                    <span className="je-ai" title="nota da IA">
                      IA <span className="t-mono-num">{ai.toFixed(1)}</span>
                    </span>
                  )}
                  <span className="je-mine t-mono-num">{v.toFixed(1)}</span>
                </div>
              </div>
              <input
                type="range"
                min={0}
                max={10}
                step={0.5}
                value={v}
                onChange={(e) =>
                  setScores((s) => ({
                    ...s,
                    [d.key]: parseFloat(e.target.value),
                  }))
                }
                disabled={pending}
                className="je-slider"
                aria-label={`nota ${d.label} de 0 a 10`}
              />
              <div className="je-scale">
                <span>0</span>
                <span>5</span>
                <span>10</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="je-notes">
        <label htmlFor="je-notes" className="t-eyebrow">
          comentário (opcional)
        </label>
        <textarea
          id="je-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder="o que pesou na sua nota?"
          disabled={pending}
        />
      </div>

      {error && (
        <div className="je-err" role="alert">
          {error === "submission_not_found"
            ? "projeto não encontrado."
            : error === "unauthenticated" || error === "missing_email"
              ? "sessão expirou — faça login de novo."
              : "deu pau salvando. tenta de novo."}
        </div>
      )}

      <div className="je-actions">
        <button
          type="button"
          className="ed-btn primary"
          onClick={submit}
          disabled={pending}
        >
          {pending
            ? "Salvando…"
            : savedAt
              ? "Atualizar nota"
              : "Salvar avaliação"}
          <span className="arrow">→</span>
        </button>
        {savedAt && !pending && !error && (
          <span className="je-saved muted-2 t-small">
            salvo · {savedAt.toLocaleTimeString("pt-BR")}
          </span>
        )}
      </div>
    </section>
  );
}
