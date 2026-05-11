"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { StatusPipeline } from "@/components/status-pipeline";

type Status = "pending" | "evaluating" | "done" | "failed";

type Submission = {
  id: string;
  teamName: string;
  projectName: string;
  tagline: string;
  description: string;
  githubUrl: string;
  demoUrl: string | null;
  videoUrl: string | null;
  screenshotUrls: string[];
  status: Status;
  errorMessage: string | null;
};

function stageFor(status: Status) {
  switch (status) {
    case "pending":
      return { index: 1, failed: false };
    case "evaluating":
      return { index: 2, failed: false };
    case "done":
      return { index: 3, failed: false };
    case "failed":
      return { index: 2, failed: true };
  }
}

export function StatusView({ initial }: { initial: Submission }) {
  const [sub, setSub] = useState<Submission>(initial);

  // Poll while not in a terminal state
  useEffect(() => {
    if (sub.status === "done" || sub.status === "failed") return;
    let active = true;
    const tick = async () => {
      try {
        const res = await fetch(`/api/submissions/${sub.id}`);
        if (!res.ok || !active) return;
        const j = (await res.json()) as Submission;
        setSub(j);
      } catch {
        // swallow — next tick will retry
      }
    };
    const id = window.setInterval(tick, 2500);
    return () => {
      active = false;
      window.clearInterval(id);
    };
  }, [sub.id, sub.status]);

  const { index, failed } = stageFor(sub.status);
  const shortId = sub.id.length > 16 ? sub.id.slice(0, 16) : sub.id;

  return (
    <div className="status-stage">
      <div className="status-shell">
        <div className="t-eyebrow">submissão · #{shortId}</div>
        <h2 className="t-edit-h1" style={{ margin: "10px 0 6px" }}>
          {failed ? "Algo travou." : sub.status === "done" ? "Avaliado." : "Recebido."}
        </h2>
        <p
          className="t-edit-quote"
          style={{ color: "var(--t-fg-2)", margin: 0, fontStyle: "italic" }}
        >
          {sub.projectName} — {sub.teamName}
        </p>

        <div className="status-pipeline-wrap">
          <StatusPipeline activeIndex={index} failed={failed} />
        </div>

        <div className="status-blurb">
          {failed ? (
            <p style={{ margin: 0 }}>
              {sub.errorMessage ??
                "Não consegui processar a submissão. Edite os campos com erro e tente de novo."}
            </p>
          ) : sub.status === "done" ? (
            <p style={{ margin: 0 }}>
              Avaliação completa. Os juízes podem ver tudo agora.
              <span className="muted-2">
                {" "}
                Você recebe o feedback público em{" "}
                <span className="t-mono-num">12/05 · 17:00</span>.
              </span>
            </p>
          ) : (
            <p style={{ margin: 0 }}>
              A avaliação está rodando. Os juízes recebem o resultado quando
              tudo terminar.
              <span className="muted-2">
                {" "}
                Resultado público em{" "}
                <span className="t-mono-num">12/05 · 17:00</span>.
              </span>
            </p>
          )}
          <div className="status-actions">
            <Link href="/submit" className="ed-btn">
              Nova submissão
            </Link>
            <span className="muted t-small">
              só dá pra editar enquanto está na fila.
            </span>
          </div>
        </div>

        <SubmissionSummaryLive sub={sub} />
      </div>
    </div>
  );
}

function SubmissionSummaryLive({ sub }: { sub: Submission }) {
  return (
    <div className="sub-sum">
      <header className="sub-sum-head">
        <div className="t-eyebrow">o que vocês enviaram</div>
      </header>

      <div className="sum-grid">
        <div className="sum-row">
          <div className="sum-label">time</div>
          <div className="sum-val">{sub.teamName}</div>
        </div>
        <div className="sum-row">
          <div className="sum-label">projeto</div>
          <div className="sum-val">{sub.projectName}</div>
        </div>
        <div className="sum-row">
          <div className="sum-label">descrição</div>
          <div className="sum-val" style={{ lineHeight: 1.55 }}>
            {sub.description}
          </div>
        </div>
        <div className="sum-row">
          <div className="sum-label">github</div>
          <div className="sum-val">
            <a
              className="ed-link t-mono-num"
              style={{ fontSize: 14 }}
              href={
                sub.githubUrl.startsWith("http")
                  ? sub.githubUrl
                  : `https://${sub.githubUrl}`
              }
              target="_blank"
              rel="noreferrer"
            >
              {sub.githubUrl} ↗
            </a>
          </div>
        </div>
        {sub.demoUrl && (
          <div className="sum-row">
            <div className="sum-label">demo</div>
            <div className="sum-val">
              <a
                className="ed-link t-mono-num"
                style={{ fontSize: 14 }}
                href={
                  sub.demoUrl.startsWith("http")
                    ? sub.demoUrl
                    : `https://${sub.demoUrl}`
                }
                target="_blank"
                rel="noreferrer"
              >
                {sub.demoUrl} ↗
              </a>
            </div>
          </div>
        )}
        {sub.videoUrl && (
          <div className="sum-row">
            <div className="sum-label">vídeo</div>
            <div className="sum-val">
              <div className="vid-embed">
                <div className="vid-play">▶</div>
                <div className="vid-meta t-mono-num">{sub.videoUrl}</div>
              </div>
            </div>
          </div>
        )}
        {sub.screenshotUrls.length > 0 && (
          <div className="sum-row">
            <div className="sum-label">screenshots</div>
            <div className="sum-val">
              <div className="shot-grid">
                {sub.screenshotUrls.slice(0, 4).map((url, i) => (
                  <div
                    key={url}
                    className={`shot-thumb v${(i % 4) + 1}`}
                    style={{
                      backgroundImage: url.startsWith("/uploads")
                        ? `url(${url})`
                        : undefined,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
