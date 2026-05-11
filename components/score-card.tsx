"use client";

import { useState } from "react";
import type { DimensionEval } from "@/lib/data";
import { toneFor } from "@/lib/data";
import { ScoreNumber } from "./score";
import { StatusBadge } from "./status-badge";
import { EvidenceChip, detectKind } from "./evidence-chip";

type Props = {
  dim: "vibe" | "originalidade" | "execucao" | "viabilidade";
  label: string;
  sub: string;
  data: DimensionEval;
  defaultExpanded?: boolean;
  evaluating?: boolean;
};

export function ScoreCard({
  label,
  sub,
  data,
  defaultExpanded = false,
  evaluating = false,
}: Props) {
  const [reasonOpen, setReasonOpen] = useState(defaultExpanded);

  if (evaluating) {
    return (
      <div className="sc evaluating">
        <header className="sc-head">
          <div>
            <div className="t-eyebrow">{sub}</div>
            <h3 className="sc-label">{label}</h3>
          </div>
          <div className="sc-score">
            <StatusBadge status="evaluating" />
          </div>
        </header>
        <div className="sc-body">
          <div className="sk" style={{ width: "80%", height: 18, marginBottom: 16 }} />
          <div className="sk" style={{ width: "60%", height: 14, marginBottom: 24 }} />
          <div className="sk" style={{ width: "100%", height: 120 }} />
        </div>
      </div>
    );
  }

  const tone = toneFor(data.score);

  return (
    <div className={`sc ${tone}`}>
      <header className="sc-head">
        <div>
          <div className="t-eyebrow">{sub}</div>
          <h3 className="sc-label">{label}</h3>
        </div>
        <div className="sc-score">
          <ScoreNumber value={data.score} size="big" />
        </div>
      </header>

      <p className="sc-oneliner t-edit-quote">{data.one_liner}</p>

      <div className="sc-grid">
        <div className="sc-col">
          <div className="t-eyebrow">forças</div>
          <ul className="sc-list strengths">
            {data.strengths.map((s, i) => (
              <li key={i}>
                <span className="bul">+</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="sc-col">
          <div className="t-eyebrow">o que tá raso</div>
          <ul className="sc-list weaknesses">
            {data.weaknesses.map((s, i) => (
              <li key={i}>
                <span className="bul">−</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="sc-evidence">
        <div className="t-eyebrow" style={{ marginBottom: 10 }}>
          evidência consultada
        </div>
        <div className="ev-chips">
          {data.evidence_used.map((ev, i) => (
            <EvidenceChip key={i} kind={detectKind(ev)} label={ev} />
          ))}
        </div>
      </div>

      <button
        type="button"
        className="sc-toggle"
        onClick={() => setReasonOpen((o) => !o)}
        aria-expanded={reasonOpen}
      >
        <span>{reasonOpen ? "fechar reasoning" : "ver reasoning"}</span>
        <span className="caret">{reasonOpen ? "−" : "+"}</span>
      </button>
      {reasonOpen && (
        <div className="sc-reason">
          <p>{data.reasoning}</p>
        </div>
      )}
    </div>
  );
}
