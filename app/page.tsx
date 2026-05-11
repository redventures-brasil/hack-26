import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export default function LandingPage() {
  return (
    <div className="page">
      <SiteHeader variant="public" />

      <div className="land-stage page-body">
        <div className="land-grid">
          <div className="land-left">
            <div className="t-eyebrow" style={{ marginBottom: 32 }}>
              R2 Ventures · 12 mai 2026 · 13:30–17:00
            </div>
            <h1 className="land-title">
              HACK<span className="line-2">·26</span>
            </h1>
            <p className="land-tagline">
              Vibethon. 3h30. IA julga, humanos decidem.
            </p>
            <p className="land-sub">
              Trinta times. Quatro dimensões — vibe, originalidade, execução,
              viabilidade. Avaliação assistida por modelo. Júri humano dá o
              ranking final.
            </p>
            <div className="land-actions">
              <Link href="/submit" className="ed-btn primary">
                Submeter projeto
                <span className="arrow">→</span>
              </Link>
              <Link href="/judge/login" className="ed-link">
                Sou juiz
              </Link>
            </div>
          </div>

          <div className="land-right">
            <div className="metric">
              <div className="metric-label">submissões abertas até</div>
              <div className="metric-value t-mono-num">12/05 · 17:00</div>
            </div>
            <div className="metric">
              <div className="metric-label">resultado público em</div>
              <div className="metric-value t-mono-num">12/05 · 17:00</div>
            </div>
          </div>
        </div>

        <div className="land-foot">
          <div className="muted t-small">
            R2 Ventures · São Paulo · ola@hack26.r2.ventures
          </div>
        </div>
      </div>
    </div>
  );
}
