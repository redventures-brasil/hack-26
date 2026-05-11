"use client";

import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import {
  getDeviceId,
  getEmail,
  getVotes,
  setEmail,
  setVote,
  type VoteMap,
} from "@/lib/audience-votes";
import { StarRating } from "@/components/star-rating";

export type VotableTeam = {
  id: string;
  team: string;
  project: string;
  tagline: string;
  description: string;
  githubUrl: string;
  demoUrl: string | null;
  videoUrl: string | null;
  screenshots: string[];
};

/**
 * Hydration flag — the canonical React pattern for "this is the client, OK
 * to read localStorage". The set-state-in-effect rule fires on this even
 * though the React docs use this exact pattern; we silence it intentionally.
 */
function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true);
  }, []);
  return hydrated;
}

export function JuriPopularClient({
  votableTeams,
}: {
  votableTeams: VotableTeam[];
}) {
  const hydrated = useHydrated();

  // Local-only state — only set in event handlers
  const [emailInput, setEmailInput] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailConfirmed, setEmailConfirmed] = useState(false);
  const [voteTick, bumpVotes] = useReducer((x: number) => x + 1, 0);
  const [toast, setToast] = useState<string | null>(null);

  // Auto-clear the toast after 2.2s
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(id);
  }, [toast]);

  // Derived state read each render (post-hydration).
  // `emailConfirmed` is read so React picks up the gate transition immediately
  // after the user submits — storedEmail would lag a render otherwise.
  const storedEmail: string | null = hydrated ? getEmail() : null;
  const hasEmail = emailConfirmed || !!storedEmail;

  const votes: VoteMap = useMemo(() => {
    if (!hydrated) return {};
    return getVotes();
    // voteTick invalidates this when handleVote bumps it
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, voteTick]);

  const votedCount = useMemo(
    () =>
      votableTeams.filter((t) => typeof votes[t.id] === "number").length,
    [votes, votableTeams],
  );

  // not hydrated yet → render an empty stage to avoid flashing the gate
  if (!hydrated) {
    return <div className="jpv-stage" />;
  }

  // ─── gate (email-only) ─────────────────────────────────
  if (!hasEmail) {
    return (
      <div className="jp-gate-stage">
        <form
          className="jp-gate"
          onSubmit={(e) => {
            e.preventDefault();
            const nextEmail = emailInput.trim().toLowerCase();
            const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail);
            if (!emailOk) {
              setEmailError("coloca um email válido — pra confirmar seu voto.");
              return;
            }
            setEmail(nextEmail);
            setEmailConfirmed(true);
          }}
        >
          <div className="t-eyebrow">acesso · júri popular</div>
          <h2 className="t-edit-h2" style={{ margin: "8px 0 8px" }}>
            Seu email.
          </h2>
          <p
            className="muted-2 t-small"
            style={{ margin: "0 0 8px", lineHeight: 1.5 }}
          >
            Pra confirmar quem votou. Não compartilhamos, é só pra contar 1
            voto por pessoa.
          </p>

          <span className="jp-gate-perf perf" aria-hidden="true" />

          <div className="ed-field">
            <label htmlFor="voter-email">email</label>
            <input
              id="voter-email"
              type="email"
              value={emailInput}
              onChange={(e) => {
                setEmailInput(e.target.value);
                if (emailError) setEmailError(null);
              }}
              placeholder="voce@exemplo.com"
              autoFocus
              autoComplete="email"
              inputMode="email"
              spellCheck={false}
              maxLength={120}
              style={
                emailError ? { borderBottomColor: "#FF6B6B" } : undefined
              }
            />
            {emailError && (
              <div className="err" style={{ color: "#FF6B6B" }}>
                {emailError}
              </div>
            )}
            <div className="hint">usado só pra registrar o voto.</div>
          </div>

          <div style={{ marginTop: 28 }}>
            <button
              type="submit"
              className="ed-btn primary"
              style={{ width: "100%", justifyContent: "center" }}
            >
              Entrar
              <span className="arrow">→</span>
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ─── voting slideshow ─────────────────────────────────────
  function handleVote(teamId: string, stars: number) {
    setVote(teamId, stars);
    bumpVotes();
    setToast(`voto registrado · ${stars}/5`);
    void fetch("/api/votes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        submissionId: teamId,
        deviceId: getDeviceId(),
        stars,
        email: getEmail(),
      }),
    }).catch(() => {
      /* offline-friendly: vote stays in localStorage */
    });
  }

  return (
    <VoteSlideshow
      teams={votableTeams}
      votes={votes}
      votedCount={votedCount}
      onVote={handleVote}
      toast={toast}
      voterEmail={storedEmail ?? ""}
    />
  );
}

/* ─── slideshow ──────────────────────────────────────────────────── */

function VoteSlideshow({
  teams,
  votes,
  votedCount,
  onVote,
  toast,
  voterEmail,
}: {
  teams: VotableTeam[];
  votes: VoteMap;
  votedCount: number;
  onVote: (teamId: string, stars: number) => void;
  toast: string | null;
  voterEmail: string;
}) {
  // index in [0..teams.length-1] is a project slide, teams.length = summary
  const SUMMARY = teams.length;
  const MAX = SUMMARY;
  const [idx, setIdx] = useState(0);

  const go = useCallback(
    (next: number) => {
      setIdx(Math.max(0, Math.min(MAX, next)));
    },
    [MAX],
  );

  // keyboard nav. Number keys 1-5 cast a vote on the current slide. 0 advances.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const inField =
        !!target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if (inField) return;

      if (e.key === " " || e.key === "ArrowRight") {
        e.preventDefault();
        go(idx + 1);
        return;
      }
      if (e.key === "ArrowLeft" || e.key === "Backspace") {
        e.preventDefault();
        go(idx - 1);
        return;
      }
      const current = teams[idx];
      if (current && /^[1-5]$/.test(e.key)) {
        e.preventDefault();
        onVote(current.id, Number(e.key));
        return;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [idx, go, teams, onVote]);

  if (teams.length === 0) {
    return (
      <div className="jpv-stage jpv-empty">
        <div className="jpv-empty-inner">
          <div className="t-eyebrow">júri popular · {voterEmail}</div>
          <h1 className="jpv-empty-title">Ainda não tem projetos pra votar.</h1>
          <p className="muted-2">
            Volta aqui quando as apresentações começarem.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="jpv-stage" data-slide={idx === SUMMARY ? "end" : idx}>
      <span className="jpv-burst" aria-hidden="true" />

      <header className="jpv-topbar">
        <div className="t-eyebrow jpv-voter">
          júri popular · <span className="jpv-voter-email">{voterEmail}</span>
        </div>
        <div className="jpv-counter t-mono-num" aria-live="polite">
          <span>{String(Math.min(idx + 1, SUMMARY)).padStart(2, "0")}</span>
          <span className="jpv-counter-of">/ {String(SUMMARY).padStart(2, "0")}</span>
        </div>
      </header>

      <div className="jpv-frame">
        {idx < SUMMARY ? (
          <ProjectSlide
            key={teams[idx].id}
            team={teams[idx]}
            index={idx}
            total={SUMMARY}
            currentVote={votes[teams[idx].id] ?? null}
            onVote={(stars) => onVote(teams[idx].id, stars)}
          />
        ) : (
          <SummarySlide
            teams={teams}
            votes={votes}
            votedCount={votedCount}
            onJumpTo={(id) => {
              const i = teams.findIndex((t) => t.id === id);
              if (i >= 0) go(i);
            }}
            onRestart={() => go(0)}
          />
        )}
      </div>

      <ProgressDots idx={idx} max={MAX} votes={votes} teams={teams} />

      <div className="jpv-controls" aria-label="Navegação">
        <button
          type="button"
          className="jpv-nav"
          onClick={() => go(idx - 1)}
          disabled={idx === 0}
          aria-label="Projeto anterior"
        >
          ←
        </button>
        <button
          type="button"
          className="jpv-cta"
          onClick={() => go(idx + 1)}
          disabled={idx === MAX}
        >
          {idx < SUMMARY - 1
            ? "Próximo"
            : idx === SUMMARY - 1
              ? "Ver resumo"
              : "Fim"}
          <span className="arrow">→</span>
        </button>
      </div>

      <div className="jpv-hint" aria-hidden="true">
        ← / → navega    ·    1–5 vota    ·    espaço avança
      </div>

      {toast && <div className="jp-toast">{toast}</div>}
    </div>
  );
}

/* ─── slides ─────────────────────────────────────────────────────── */

function ProjectSlide({
  team,
  index,
  total,
  currentVote,
  onVote,
}: {
  team: VotableTeam;
  index: number;
  total: number;
  currentVote: number | null;
  onVote: (stars: number) => void;
}) {
  const [shotIdx, setShotIdx] = useState(0);
  // Reset gallery when slide changes (component remounts via key, but be safe)
  useEffect(() => {
    setShotIdx(0);
  }, [team.id]);

  const hasShots = team.screenshots.length > 0;
  const hasVideo = !!team.videoUrl;
  const hasDemo = !!team.demoUrl;

  return (
    <article className="jpv-slide">
      <header className="jpv-head">
        <div className="jpv-head-meta">
          <span className="t-eyebrow">
            projeto {String(index + 1).padStart(2, "0")} de{" "}
            {String(total).padStart(2, "0")}
          </span>
          <span className="jpv-head-sep">·</span>
          <span className="jpv-head-team">{team.team}</span>
        </div>
        <h1 className="jpv-project">{team.project}</h1>
        {team.tagline && (
          <p className="jpv-tagline">&ldquo;{team.tagline}&rdquo;</p>
        )}
      </header>

      <div className="jpv-body">
        <div className="jpv-media">
          {hasShots ? (
            <>
              <div className="jpv-shot-hero">
                <img
                  src={team.screenshots[shotIdx]}
                  alt={`Screenshot ${shotIdx + 1} de ${team.project}`}
                />
              </div>
              {team.screenshots.length > 1 && (
                <div
                  className="jpv-shot-thumbs"
                  role="tablist"
                  aria-label="Screenshots"
                >
                  {team.screenshots.map((s, i) => (
                    <button
                      key={s + i}
                      type="button"
                      role="tab"
                      aria-selected={i === shotIdx}
                      className={`jpv-thumb ${i === shotIdx ? "on" : ""}`}
                      onClick={() => setShotIdx(i)}
                    >
                      <img
                        src={s}
                        alt=""
                        aria-hidden="true"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : hasVideo ? (
            <div className="jpv-shot-hero jpv-video-wrap">
              <video controls src={team.videoUrl ?? undefined} preload="metadata" />
            </div>
          ) : (
            <div className="jpv-shot-hero jpv-shot-empty">
              <div className="muted-2 t-small">
                sem screenshots · julgue pela demo e pelo pitch
              </div>
            </div>
          )}

          <div className="jpv-links" aria-label="Links do projeto">
            {hasDemo && (
              <a
                className="jpv-link primary"
                href={team.demoUrl!}
                target="_blank"
                rel="noreferrer"
              >
                Abrir demo<span className="arrow">↗</span>
              </a>
            )}
            <a
              className="jpv-link"
              href={team.githubUrl}
              target="_blank"
              rel="noreferrer"
            >
              GitHub<span className="arrow">↗</span>
            </a>
            {hasVideo && hasShots && (
              <a
                className="jpv-link"
                href={team.videoUrl!}
                target="_blank"
                rel="noreferrer"
              >
                Vídeo<span className="arrow">↗</span>
              </a>
            )}
          </div>
        </div>

        <div className="jpv-text">
          <h2 className="t-eyebrow jpv-text-eyebrow">o que é</h2>
          <p className="jpv-description">{team.description}</p>
        </div>
      </div>

      <footer className="jpv-vote">
        <div className="jpv-vote-prompt">
          <span className="t-eyebrow">o quanto curti?</span>
          <span className="jpv-vote-status muted">
            {currentVote != null
              ? `seu voto · ${currentVote}/5`
              : "use 1–5 no teclado ou toque nas estrelas"}
          </span>
        </div>
        <StarRating
          value={currentVote}
          onChange={onVote}
          size="lg"
          label={`Voto popular para ${team.project}`}
        />
      </footer>
    </article>
  );
}

function SummarySlide({
  teams,
  votes,
  votedCount,
  onJumpTo,
  onRestart,
}: {
  teams: VotableTeam[];
  votes: VoteMap;
  votedCount: number;
  onJumpTo: (id: string) => void;
  onRestart: () => void;
}) {
  const allVoted = votedCount === teams.length;
  const missing = teams.filter((t) => typeof votes[t.id] !== "number");
  return (
    <article className="jpv-slide jpv-summary">
      <header className="jpv-head">
        <div className="t-eyebrow">resumo · seus votos</div>
        <h1 className="jpv-project">
          {allVoted ? "Votou em todos." : "Quase lá."}
        </h1>
        <p className="jpv-tagline">
          {allVoted
            ? "Você pode mudar qualquer voto até o fim das apresentações."
            : `Faltam ${missing.length} projeto${missing.length === 1 ? "" : "s"}. Os votos ficam neste aparelho.`}
        </p>
      </header>

      <ul className="jpv-summary-list">
        {teams.map((t, i) => {
          const v = votes[t.id];
          const voted = typeof v === "number";
          return (
            <li key={t.id}>
              <button
                type="button"
                className={`jpv-summary-row ${voted ? "voted" : "missing"}`}
                onClick={() => onJumpTo(t.id)}
              >
                <span className="jpv-summary-rank t-mono-num">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="jpv-summary-name">
                  <span className="jpv-summary-project">{t.project}</span>
                  <span className="jpv-summary-team muted">{t.team}</span>
                </span>
                <span className="jpv-summary-vote t-mono-num">
                  {voted ? `${v}/5` : "—"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {!allVoted && (
        <div className="jpv-summary-cta">
          <button
            type="button"
            className="ed-btn primary"
            onClick={() => {
              const first = missing[0];
              if (first) onJumpTo(first.id);
            }}
          >
            Ir pro próximo faltante
            <span className="arrow">→</span>
          </button>
          <button type="button" className="ed-link" onClick={onRestart}>
            voltar ao início
          </button>
        </div>
      )}
    </article>
  );
}

/* ─── progress dots ──────────────────────────────────────────────── */

function ProgressDots({
  idx,
  max,
  votes,
  teams,
}: {
  idx: number;
  max: number;
  votes: VoteMap;
  teams: VotableTeam[];
}) {
  return (
    <div className="jpv-dots" aria-label="Progresso da votação">
      {Array.from({ length: max + 1 }, (_, i) => {
        const isSummary = i === teams.length;
        const voted = !isSummary && typeof votes[teams[i].id] === "number";
        return (
          <span
            key={i}
            className={`jpv-dot-i ${i === idx ? "on" : ""} ${voted ? "voted" : ""} ${isSummary ? "summary" : ""}`}
            aria-current={i === idx ? "step" : undefined}
            title={
              isSummary
                ? "resumo"
                : `${teams[i].project}${voted ? ` · ${votes[teams[i].id]}/5` : ""}`
            }
          />
        );
      })}
    </div>
  );
}
