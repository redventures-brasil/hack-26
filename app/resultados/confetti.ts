/**
 * Confetti — canvas particle system colored with the HACK-26 palette.
 * Self-contained, no dependencies. Two modes:
 *   - burst(opts): one-shot launch at a point
 *   - rain(durationMs): sustained downpour for big moments
 */

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  w: number;
  h: number;
  color: string;
  life: number;
};

const PALETTE = [
  "#E9453E", // rocket red
  "#FFC940", // sign yellow
  "#FFB347", // launch flame
  "#FFFFFF", // paper
  "#FBE2DF", // rocket red soft
  "#C8362F", // rocket red deep
];

export class Confetti {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private rafId: number | null = null;
  private rainUntil = 0;
  private rainColors: string[] = PALETTE;
  private lastTs = 0;
  private dpr = 1;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2d context unavailable");
    this.ctx = ctx;
    this.resize();
    window.addEventListener("resize", this.resize);
  }

  resize = () => {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.canvas.width = Math.floor(w * this.dpr);
    this.canvas.height = Math.floor(h * this.dpr);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.ctx.scale(this.dpr, this.dpr);
  };

  destroy() {
    window.removeEventListener("resize", this.resize);
    if (this.rafId != null) cancelAnimationFrame(this.rafId);
  }

  burst(opts: {
    x?: number;
    y?: number;
    count?: number;
    spread?: number;
    power?: number;
    colors?: string[];
  } = {}) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const x = opts.x ?? w / 2;
    const y = opts.y ?? h * 0.35;
    const count = opts.count ?? 140;
    const spread = opts.spread ?? Math.PI; // radians, default = a half-circle
    const power = opts.power ?? 18;
    const colors = opts.colors ?? PALETTE;

    for (let i = 0; i < count; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * spread;
      const speed = power * (0.6 + Math.random() * 0.8);
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.3,
        w: 6 + Math.random() * 6,
        h: 10 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1,
      });
    }
    this.ensureLoop();
  }

  rain(durationMs: number, opts: { colors?: string[] } = {}) {
    this.rainUntil = performance.now() + durationMs;
    this.rainColors = opts.colors ?? PALETTE;
    this.ensureLoop();
  }

  stopRain() {
    this.rainUntil = 0;
  }

  private ensureLoop() {
    if (this.rafId != null) return;
    this.lastTs = performance.now();
    this.rafId = requestAnimationFrame(this.tick);
  }

  private tick = (ts: number) => {
    const dt = Math.min(0.04, (ts - this.lastTs) / 1000);
    this.lastTs = ts;

    // Spawn new rain particles continuously while raining
    if (ts < this.rainUntil) {
      const w = window.innerWidth;
      for (let i = 0; i < 4; i++) {
        this.particles.push({
          x: Math.random() * w,
          y: -20,
          vx: (Math.random() - 0.5) * 60,
          vy: 80 + Math.random() * 120,
          rot: Math.random() * Math.PI * 2,
          vr: (Math.random() - 0.5) * 4,
          w: 6 + Math.random() * 6,
          h: 10 + Math.random() * 8,
          color:
            this.rainColors[
              Math.floor(Math.random() * this.rainColors.length)
            ],
          life: 1,
        });
      }
    }

    const w = window.innerWidth;
    const h = window.innerHeight;
    this.ctx.clearRect(0, 0, w, h);

    const gravity = 520; // px/s^2
    const drag = 0.995;
    const alive: Particle[] = [];
    for (const p of this.particles) {
      // Burst particles use velocity in "px per step" — scale by dt*60 for
      // frame-rate independence. Rain particles use px/s already.
      p.vy += gravity * dt;
      p.x += p.vx * dt * 6;
      p.y += p.vy * dt;
      p.vx *= drag;
      p.rot += p.vr * dt * 60;

      if (p.y > h + 30) continue; // off-screen
      alive.push(p);

      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate(p.rot);
      this.ctx.fillStyle = p.color;
      this.ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      this.ctx.restore();
    }
    this.particles = alive;

    if (this.particles.length === 0 && ts >= this.rainUntil) {
      this.rafId = null;
      return;
    }
    this.rafId = requestAnimationFrame(this.tick);
  };
}
