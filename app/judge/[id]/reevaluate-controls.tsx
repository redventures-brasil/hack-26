"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Dim = "vibe" | "originalidade" | "execucao" | "viabilidade";

export function ReevaluateControls({
  submissionId,
}: {
  submissionId: string;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState<"all" | Dim | null>(null);

  async function trigger(only?: Dim) {
    const target: "all" | Dim = only ?? "all";
    setSubmitting(target);
    const params = only ? `?only=${only}` : "";
    // Show the optimistic re-evaluating state in the UI
    const url = only
      ? `/judge/${submissionId}?re=${only}`
      : `/judge/${submissionId}`;
    router.push(url);
    try {
      await fetch(`/api/evaluate/${submissionId}${params}`, {
        method: "POST",
      });
      // Wait a beat then refresh server data
      window.setTimeout(() => {
        router.refresh();
        setSubmitting(null);
      }, 1500);
      // Keep polling refresh every 2s for ~30s until status changes
      let ticks = 0;
      const interval = window.setInterval(() => {
        ticks++;
        router.refresh();
        if (ticks > 15) window.clearInterval(interval);
      }, 2500);
    } catch {
      setSubmitting(null);
    }
  }

  return (
    <div className="dd-reeval">
      <button
        type="button"
        className="ed-btn"
        style={{ justifyContent: "space-between" }}
        disabled={submitting != null}
        onClick={() => trigger()}
      >
        {submitting === "all" ? "Re-avaliando…" : "Re-avaliar tudo"}
        <span className="arrow">↻</span>
      </button>
      <select
        className="dd-reeval-select"
        defaultValue=""
        disabled={submitting != null}
        onChange={(e) => {
          const v = e.target.value as Dim | "";
          if (!v) return;
          trigger(v);
          e.currentTarget.value = "";
        }}
      >
        <option value="" disabled>
          Re-avaliar uma dimensão…
        </option>
        <option value="vibe">Vibe</option>
        <option value="originalidade">Originalidade</option>
        <option value="execucao">Execução técnica</option>
        <option value="viabilidade">Viabilidade real</option>
      </select>
    </div>
  );
}
