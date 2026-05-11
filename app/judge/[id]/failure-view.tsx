import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { FailureRetry } from "./failure-retry";

type Props = {
  team: {
    id: string;
    team: string;
    project: string;
    github: string;
    tagline: string;
    error: string | null;
  };
};

export function PipelineFailureView({ team }: Props) {
  const shortId = team.id.length > 16 ? team.id.slice(0, 16) : team.id;
  const error =
    team.error ??
    "não consegui clonar o repositório. provavelmente está privado.";

  return (
    <div className="page">
      <SiteHeader variant="judge" />
      <div className="fail-stage page-body">
        <div className="fail-shell">
          <div className="dd-crumb">
            <Link
              href="/judge"
              className="ed-link"
              style={{ borderBottom: 0 }}
            >
              ← ranking
            </Link>
            <span className="muted t-mono-num" style={{ margin: "0 12px" }}>
              ·
            </span>
            <span className="muted t-mono-num">submissão #{shortId}</span>
          </div>

          <div style={{ marginBottom: 32 }}>
            <div
              className="t-eyebrow"
              style={{ color: "#FF6B6B", marginBottom: 12 }}
            >
              pipeline falhou · não avaliado
            </div>
            <h1
              className="t-edit-h1"
              style={{ margin: "0 0 4px", fontSize: 64 }}
            >
              {team.project}
            </h1>
            <div className="muted-2" style={{ fontSize: 16 }}>
              {team.team}
            </div>
          </div>

          <div className="fail-card">
            <div className="fail-icon">!</div>
            <div className="fail-body">
              <div className="fail-title">pipeline travou.</div>
              <p className="fail-msg">{error}</p>
              <p className="fail-msg">
                Repositório:{" "}
                <span className="t-mono-num">{team.github}</span>
              </p>
              <div className="fail-actions">
                <FailureRetry submissionId={team.id} />
                <span className="ed-link">Avisar o time outra vez ↗</span>
              </div>
            </div>
          </div>

          <details className="fail-details">
            <summary>log do pipeline</summary>
            <pre>{`[14:31:48]  job/${shortId}-eval starting...
[14:31:48]  cloning repo: ${team.github}
[14:31:49]  ${error}
[14:31:49]  job/${shortId}-eval failed`}</pre>
          </details>
        </div>
      </div>
    </div>
  );
}
