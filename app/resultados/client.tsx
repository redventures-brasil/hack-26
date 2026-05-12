"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Confetti } from "./confetti";

export type WinnerRow = {
  id: string;
  projectName: string;
  teamName: string;
  tagline: string;
  total: number;
  scores: {
    vibe: number | null;
    originalidade: number | null;
    execucao: number | null;
    viabilidade: number | null;
  };
  /** Composite breakdown — the final `total` is 0.25·IA + 0.50·Júri + 0.25·Popular. */
  breakdown: {
    ai: number | null;
    juri: number | null;
    popular: number | null;
    juriCount: number;
    popularCount: number;
  };
};

type RankColor = {
  fg: string;
  glow: string;
  confetti: string[];
};

const RANK_COLORS: Record<1 | 2 | 3, RankColor> = {
  1: {
    fg: "#FFC940", // sign-yellow → "gold"
    glow: "rgba(255,201,64,.55)",
    confetti: ["#FFC940", "#FFB347", "#FFFFFF", "#E9453E"],
  },
  2: {
    fg: "#FFFFFF",
    glow: "rgba(255,255,255,.45)",
    confetti: ["#FFFFFF", "#E6E2D8", "#FBE2DF", "#FFC940"],
  },
  3: {
    fg: "#FFB347", // launch-flame → "bronze"
    glow: "rgba(255,179,71,.50)",
    confetti: ["#FFB347", "#C8362F", "#E9453E", "#FFFFFF"],
  },
};

const RANK_LABEL: Record<1 | 2 | 3, string> = {
  1: "primeiro lugar",
  2: "segundo lugar",
  3: "terceiro lugar",
};

/* slide index → meaning
 * 0 = intro
 * 1 = 3rd reveal
 * 2 = 2nd reveal
 * 3 = 1st reveal
 * 4 = final podium
 */
const MAX_SLIDE = 4;

export function ResultadosClient({ winners }: { winners: WinnerRow[] }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const confettiRef = useRef<Confetti | null>(null);
  const [slide, setSlide] = useState(0);

  // Top 3 indexed by rank. May be incomplete if fewer than 3 evaluated.
  const byRank = useMemo<Record<1 | 2 | 3, WinnerRow | undefined>>(
    () => ({
      1: winners[0],
      2: winners[1],
      3: winners[2],
    }),
    [winners],
  );

  // mount confetti engine
  useEffect(() => {
    if (!canvasRef.current) return;
    const c = new Confetti(canvasRef.current);
    confettiRef.current = c;
    return () => {
      c.destroy();
      confettiRef.current = null;
    };
  }, []);

  const go = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(MAX_SLIDE, next));
      setSlide(clamped);
    },
    [],
  );

  // keyboard nav — built for a clicker / live presentation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === " " || e.key === "ArrowRight" || e.key === "Enter") {
        e.preventDefault();
        go(slide + 1);
      } else if (e.key === "ArrowLeft" || e.key === "Backspace") {
        e.preventDefault();
        go(slide - 1);
      } else if (e.key === "Escape" || e.key === "Home") {
        e.preventDefault();
        go(0);
      } else if (e.key >= "0" && e.key <= "4") {
        go(Number(e.key));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [slide, go]);

  // trigger confetti per slide
  useEffect(() => {
    const c = confettiRef.current;
    if (!c) return;
    if (slide === 1) {
      c.burst({ count: 120, power: 16, colors: RANK_COLORS[3].confetti });
    } else if (slide === 2) {
      c.burst({ count: 180, power: 20, colors: RANK_COLORS[2].confetti });
    } else if (slide === 3) {
      c.burst({ count: 260, power: 24, colors: RANK_COLORS[1].confetti });
      c.rain(7000, { colors: RANK_COLORS[1].confetti });
      // double burst — left/right cannons
      window.setTimeout(
        () =>
          c.burst({
            x: window.innerWidth * 0.18,
            y: window.innerHeight * 0.55,
            count: 120,
            power: 22,
            spread: Math.PI * 0.6,
            colors: RANK_COLORS[1].confetti,
          }),
        450,
      );
      window.setTimeout(
        () =>
          c.burst({
            x: window.innerWidth * 0.82,
            y: window.innerHeight * 0.55,
            count: 120,
            power: 22,
            spread: Math.PI * 0.6,
            colors: RANK_COLORS[1].confetti,
          }),
        650,
      );
    } else if (slide === 4) {
      c.burst({ count: 200, power: 20 });
    } else {
      c.stopRain();
    }
  }, [slide]);

  if (winners.length === 0) {
    return (
      <div className="rs-stage rs-empty">
        <canvas ref={canvasRef} className="rs-canvas" aria-hidden="true" />
        <div className="rs-empty-inner">
          <div className="t-eyebrow">HACK · 26 · resultados</div>
          <h1 className="rs-title">Ainda não temos vencedores.</h1>
          <p className="muted-2" style={{ maxWidth: 560 }}>
            Assim que os juízes terminarem as avaliações, esta tela acende
            sozinha.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rs-stage" data-slide={slide}>
      <canvas ref={canvasRef} className="rs-canvas" aria-hidden="true" />

      {/* Decorative star-burst behind reveals */}
      <span className="rs-burst" aria-hidden="true" />

      <div className="rs-frame">
        {slide === 0 && <IntroSlide />}
        {slide === 1 && byRank[3] && <RevealSlide rank={3} row={byRank[3]} />}
        {slide === 2 && byRank[2] && <RevealSlide rank={2} row={byRank[2]} />}
        {slide === 3 && byRank[1] && <RevealSlide rank={1} row={byRank[1]} />}
        {slide === 4 && <PodiumSlide byRank={byRank} />}
      </div>

      <ProgressDots slide={slide} max={MAX_SLIDE} />

      <div className="rs-controls" aria-label="Controles da apresentação">
        <button
          type="button"
          className="rs-nav"
          onClick={() => go(slide - 1)}
          disabled={slide === 0}
          aria-label="Slide anterior"
        >
          ←
        </button>
        <button
          type="button"
          className="rs-cta"
          onClick={() => go(slide + 1)}
          disabled={slide === MAX_SLIDE}
        >
          {slide === 0
            ? "Começar"
            : slide < 3
              ? "Próximo"
              : slide === 3
                ? "Pódio final"
                : "Fim"}
          <span className="arrow">→</span>
        </button>
      </div>

      <div className="rs-hint" aria-hidden="true">
        espaço · → avança    ·    ← volta    ·    esc reinicia
      </div>
    </div>
  );
}

/* ─── slides ─────────────────────────────────────────────────────── */

function IntroSlide() {
  return (
    <div className="rs-slide rs-intro">
      <div className="t-eyebrow">12 mai 2026 · ao vivo</div>
      <h1 className="rs-logo">
        <Image
          src="/hack26-logo.webp"
          alt="HACK-26"
          width={2000}
          height={599}
          priority
          unoptimized
          className="rs-logo-img"
        />
      </h1>
      <p className="rs-tagline">
        E os <em>vencedores</em> da edição vão pra…
      </p>
      <p className="rs-method">
        nota final = <strong>25%</strong> IA + <strong>50%</strong> Júri humano + <strong>25%</strong> Júri popular
      </p>
      <div className="rs-intro-cue">
        <span className="rs-key">espaço</span>
        <span>pra abrir os envelopes</span>
      </div>
    </div>
  );
}

function RevealSlide({ rank, row }: { rank: 1 | 2 | 3; row: WinnerRow }) {
  const colors = RANK_COLORS[rank];
  return (
    <div
      className={`rs-slide rs-reveal rs-rank-${rank}`}
      style={
        {
          ["--rank-fg" as string]: colors.fg,
          ["--rank-glow" as string]: colors.glow,
        } as React.CSSProperties
      }
      key={`reveal-${rank}`}
    >
      <div className="rs-reveal-eyebrow">
        <span className="t-eyebrow">{RANK_LABEL[rank]}</span>
      </div>

      <div className="rs-reveal-row">
        <div className="rs-rank-num">
          <Trophy rank={rank} />
          <span className="rs-rank-digit">{String(rank).padStart(2, "0")}</span>
        </div>
        <div className="rs-reveal-body">
          <h2 className="rs-project">{row.projectName}</h2>
          <p className="rs-team">{row.teamName}</p>
          {row.tagline && (
            <p className="rs-tagline-small">&ldquo;{row.tagline}&rdquo;</p>
          )}
          <div className="rs-score">
            <CountUp value={row.total} />
            <span className="rs-score-of">/ 10</span>
          </div>
          <BreakdownTriad row={row} />
          <DimensionBar row={row} />
        </div>
      </div>
    </div>
  );
}

function PodiumSlide({
  byRank,
}: {
  byRank: Record<1 | 2 | 3, WinnerRow | undefined>;
}) {
  return (
    <div className="rs-slide rs-podium">
      <div className="t-eyebrow">
        edição 2026 · pódio final · IA + Júri + Popular
      </div>
      <h2 className="rs-podium-title">
        Os <em>três</em> da casa.
      </h2>

      <div className="rs-podium-stage" role="list">
        <PodiumStep rank={2} row={byRank[2]} />
        <PodiumStep rank={1} row={byRank[1]} />
        <PodiumStep rank={3} row={byRank[3]} />
      </div>

      <p className="rs-podium-foot">
        obrigado a todos os times. nos vemos em <em>hack-27</em>.
      </p>
    </div>
  );
}

function PodiumStep({
  rank,
  row,
}: {
  rank: 1 | 2 | 3;
  row: WinnerRow | undefined;
}) {
  if (!row) {
    return (
      <div className={`rs-step rs-step-${rank} rs-step-empty`} role="listitem">
        <div className="rs-step-rank">{String(rank).padStart(2, "0")}</div>
        <div className="rs-step-block" />
      </div>
    );
  }
  const colors = RANK_COLORS[rank];
  return (
    <div
      className={`rs-step rs-step-${rank}`}
      role="listitem"
      style={
        {
          ["--rank-fg" as string]: colors.fg,
          ["--rank-glow" as string]: colors.glow,
        } as React.CSSProperties
      }
    >
      <div className="rs-step-rank">{String(rank).padStart(2, "0")}</div>
      <div className="rs-step-info">
        <div className="rs-step-project">{row.projectName}</div>
        <div className="rs-step-team">{row.teamName}</div>
        <div className="rs-step-score t-mono-num">{row.total.toFixed(2)}</div>
      </div>
      <div className="rs-step-block" />
    </div>
  );
}

/* ─── primitives ─────────────────────────────────────────────────── */

function CountUp({ value }: { value: number }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const dur = 1200;
    const from = 0;
    const to = value;
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);
    const step = (ts: number) => {
      const t = Math.min(1, (ts - start) / dur);
      setShown(from + (to - from) * ease(t));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span className="t-mono-num rs-score-val">{shown.toFixed(2)}</span>;
}

/**
 * The three signals that compose the final score, with their weights.
 * Shows the partial values so the audience understands *how* the rank
 * was decided — not just the magical 8.7 / 10.
 */
function BreakdownTriad({ row }: { row: WinnerRow }) {
  const { ai, juri, popular, juriCount, popularCount } = row.breakdown;
  const items: Array<{
    key: string;
    label: string;
    value: number | null;
    weight: string;
    meta: string;
  }> = [
    {
      key: "ai",
      label: "IA",
      value: ai,
      weight: "25%",
      meta: "média 4 dimensões",
    },
    {
      key: "juri",
      label: "Júri",
      value: juri,
      weight: "50%",
      meta:
        juriCount === 0
          ? "sem voto"
          : `${juriCount} juiz${juriCount === 1 ? "" : "es"}`,
    },
    {
      key: "popular",
      label: "Popular",
      value: popular,
      weight: "25%",
      meta:
        popularCount === 0
          ? "sem voto"
          : `${popularCount} voto${popularCount === 1 ? "" : "s"}`,
    },
  ];
  return (
    <div className="rs-triad" aria-label="Composição da nota final">
      {items.map((it) => (
        <div className="rs-triad-item" key={it.key}>
          <div className="rs-triad-head">
            <span className="rs-triad-label">{it.label}</span>
            <span className="rs-triad-weight">{it.weight}</span>
          </div>
          <div className="rs-triad-value t-mono-num">
            {it.value == null ? "—" : it.value.toFixed(1)}
          </div>
          <div className="rs-triad-meta">{it.meta}</div>
        </div>
      ))}
    </div>
  );
}

function DimensionBar({ row }: { row: WinnerRow }) {
  const dims: Array<[string, number | null]> = [
    ["vibe", row.scores.vibe],
    ["orig.", row.scores.originalidade],
    ["téc.", row.scores.execucao],
    ["viab.", row.scores.viabilidade],
  ];
  return (
    <div className="rs-dims" aria-label="Notas por dimensão">
      {dims.map(([k, v]) => (
        <div className="rs-dim" key={k}>
          <span className="rs-dim-label t-eyebrow">{k}</span>
          <span className="rs-dim-val t-mono-num">
            {v == null ? "—" : v.toFixed(1)}
          </span>
        </div>
      ))}
    </div>
  );
}

function ProgressDots({ slide, max }: { slide: number; max: number }) {
  return (
    <div className="rs-dots" aria-label="Progresso da apresentação">
      {Array.from({ length: max + 1 }, (_, i) => (
        <span
          key={i}
          className={`rs-dot-i ${i === slide ? "on" : ""} ${i < slide ? "past" : ""}`}
          aria-current={i === slide ? "step" : undefined}
        />
      ))}
    </div>
  );
}

/* ─── trophy SVG (rank-tinted) ───────────────────────────────────── */

function Trophy({ rank }: { rank: 1 | 2 | 3 }) {
  return (
    <svg
      viewBox="0 0 120 140"
      width="100%"
      height="100%"
      className={`rs-trophy rs-trophy-${rank}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`tg-${rank}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity=".95" />
          <stop offset="100%" stopColor="currentColor" stopOpacity=".60" />
        </linearGradient>
      </defs>
      {/* handles */}
      <path
        d="M22 28 Q4 28 4 50 Q4 72 28 78"
        stroke="currentColor"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
        opacity=".85"
      />
      <path
        d="M98 28 Q116 28 116 50 Q116 72 92 78"
        stroke="currentColor"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
        opacity=".85"
      />
      {/* cup */}
      <path
        d="M22 14 H98 V52 Q98 86 60 92 Q22 86 22 52 Z"
        fill={`url(#tg-${rank})`}
      />
      {/* stem */}
      <rect x="52" y="90" width="16" height="14" fill="currentColor" opacity=".85" />
      {/* base */}
      <rect x="30" y="104" width="60" height="10" rx="2" fill="currentColor" />
      <rect x="22" y="116" width="76" height="14" rx="3" fill="currentColor" opacity=".85" />
      {/* rank numeral inscribed */}
      <text
        x="60"
        y="58"
        textAnchor="middle"
        fontFamily="var(--font-display)"
        fontSize="40"
        fill="#181434"
        opacity=".55"
      >
        {rank}
      </text>
    </svg>
  );
}
