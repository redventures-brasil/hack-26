"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  getDeviceId,
  getEmail,
  getEventCode,
  getVotes,
  setEmail,
  setEventCode,
  setVote,
  type VoteMap,
} from "@/lib/audience-votes";
import { StarRating } from "@/components/star-rating";

type VotableTeam = {
  id: string;
  team: string;
  project: string;
  tagline: string;
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
  const params = useSearchParams();
  const evtFromUrl = params.get("evt");

  const hydrated = useHydrated();

  // Local-only state — only set in event handlers
  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [gateConfirmed, setGateConfirmed] = useState<string | null>(null);
  const [voteTick, bumpVotes] = useReducer((x: number) => x + 1, 0);
  const [toast, setToast] = useState<string | null>(null);

  // Sync URL `?evt=` to localStorage exactly once (side effect, no React state)
  const urlSynced = useRef(false);
  useEffect(() => {
    if (urlSynced.current) return;
    urlSynced.current = true;
    const fromUrl = evtFromUrl?.trim().toUpperCase();
    if (fromUrl && fromUrl !== getEventCode()) setEventCode(fromUrl);
  }, [evtFromUrl]);

  // Auto-clear the toast after 2.2s
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(id);
  }, [toast]);

  // Derived state read each render (post-hydration)
  const code: string | null = !hydrated
    ? null
    : (gateConfirmed ??
       evtFromUrl?.trim().toUpperCase() ??
       getEventCode() ??
       "");

  const storedEmail: string | null = hydrated ? getEmail() : null;
  const hasEmail = !!storedEmail;

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
  if (code === null) {
    return <div className="jp-stage" />;
  }

  // ─── gate ───────────────────────────────────────────────
  if (!code || !hasEmail) {
    return (
      <div className="jp-gate-stage">
        <form
          className="jp-gate"
          onSubmit={(e) => {
            e.preventDefault();
            const nextCode = codeInput.trim().toUpperCase() || code || "";
            const nextEmail = emailInput.trim().toLowerCase();
            const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail);
            let blocked = false;
            if (!code && !nextCode) {
              setCodeError(true);
              blocked = true;
            }
            if (!emailOk) {
              setEmailError("coloca um email válido — pra confirmar seu voto.");
              blocked = true;
            }
            if (blocked) return;
            if (!code) setEventCode(nextCode);
            setEmail(nextEmail);
            setGateConfirmed(nextCode);
          }}
        >
          <div className="t-eyebrow">acesso · júri popular</div>
          <h2 className="t-edit-h2" style={{ margin: "8px 0 8px" }}>
            {code ? "Seu email." : "Código do evento."}
          </h2>
          <p
            className="muted-2 t-small"
            style={{ margin: "0 0 8px", lineHeight: 1.5 }}
          >
            {code
              ? "Pra confirmar quem votou — não compartilhamos."
              : "Está no telão. Também dá pra escanear o QR no fundo da sala — ele cai aqui já preenchido."}
          </p>

          <span className="jp-gate-perf perf" aria-hidden="true" />

          {!code && (
            <div className="ed-field">
              <label htmlFor="evt">código</label>
              <input
                id="evt"
                className="jp-gate-code"
                type="text"
                value={codeInput}
                onChange={(e) => {
                  setCodeInput(e.target.value);
                  if (codeError) setCodeError(false);
                }}
                placeholder="HACK26"
                autoFocus
                autoComplete="off"
                spellCheck={false}
                maxLength={16}
                style={
                  codeError ? { borderBottomColor: "#FF6B6B" } : undefined
                }
              />
              {codeError && (
                <div className="err" style={{ color: "#FF6B6B" }}>
                  cola o código que tá no telão.
                </div>
              )}
              <div className="hint">qualquer texto vale pro demo.</div>
            </div>
          )}

          <div className="ed-field" style={{ marginTop: !code ? 20 : 0 }}>
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
              autoFocus={!!code}
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

  // ─── voting list ───────────────────────────────────────
  function handleVote(teamId: string, stars: number) {
    setVote(teamId, stars);
    bumpVotes();
    setToast("voto registrado");
    // Best-effort backend sync (localStorage is the source of truth on-device)
    void fetch("/api/votes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        submissionId: teamId,
        deviceId: getDeviceId(),
        stars,
        eventCode: code,
        email: getEmail(),
      }),
    }).catch(() => {
      /* offline-friendly: vote stays in localStorage */
    });
  }

  return (
    <>
      <div className="jp-stage">
        <header className="jp-head">
          <div className="t-eyebrow">júri popular · código {code}</div>
          <h1 className="t-edit-h1">O quanto curti.</h1>
          <p>
            Vota nos projetos que você viu apresentar. 1 estrela = mal, 5 =
            quero usar amanhã. Cada toque já registra — não tem botão de
            confirmar. Você pode mudar o voto até o fim das apresentações.
          </p>
        </header>

        <div className="jp-progress">
          <div>
            <div className="jp-progress-count count">
              <span>{String(votedCount).padStart(2, "0")}</span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 18,
                  fontWeight: 500,
                  color: "var(--t-fg-3)",
                  marginLeft: 6,
                  letterSpacing: ".04em",
                }}
              >
                / {String(votableTeams.length).padStart(2, "0")}
              </span>
            </div>
          </div>
          <div className="of">
            {votedCount === votableTeams.length
              ? "votou em todos os projetos."
              : `faltam ${votableTeams.length - votedCount}`}
          </div>
        </div>

        <ul
          className="jp-list"
          style={{ listStyle: "none", padding: 0, margin: 0 }}
        >
          {votableTeams.map((t, i) => {
            const current = votes[t.id] ?? null;
            return (
              <li className="jp-card" key={t.id}>
                <div className="jp-card-info">
                  <div className="jp-card-eyebrow">
                    <span className="t-eyebrow">
                      #{String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="jp-card-team">{t.team}</span>
                  </div>
                  <h3 className="jp-card-name">{t.project}</h3>
                  <p className="jp-card-tagline">&ldquo;{t.tagline}&rdquo;</p>
                </div>
                <div className="jp-card-vote">
                  <StarRating
                    value={current}
                    onChange={(n) => handleVote(t.id, n)}
                    size="lg"
                    label={`Voto popular para ${t.project}`}
                  />
                  <div
                    className={`jp-vote-status ${
                      current != null ? "voted" : ""
                    }`}
                  >
                    {current != null
                      ? `seu voto · ${current}/5`
                      : "ainda não votou"}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <p
          className="muted t-small"
          style={{ marginTop: 40, textAlign: "center" }}
        >
          os votos ficam neste aparelho. resultado público em{" "}
          <span className="t-mono-num">12/05 · 17:00</span>.
        </p>
      </div>

      {toast && <div className="jp-toast">{toast}</div>}
    </>
  );
}
