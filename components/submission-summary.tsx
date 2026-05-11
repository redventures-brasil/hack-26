import type { Team } from "@/lib/data";

export function SubmissionSummary({ team }: { team: Team }) {
  return (
    <div className="sub-sum">
      <header className="sub-sum-head">
        <div className="t-eyebrow">o que vocês enviaram</div>
      </header>

      <div className="sum-grid">
        <div className="sum-row">
          <div className="sum-label">time</div>
          <div className="sum-val">{team.team}</div>
        </div>
        <div className="sum-row">
          <div className="sum-label">projeto</div>
          <div className="sum-val">{team.project}</div>
        </div>
        <div className="sum-row">
          <div className="sum-label">descrição</div>
          <div className="sum-val" style={{ lineHeight: 1.55 }}>
            {team.description}
          </div>
        </div>
        <div className="sum-row">
          <div className="sum-label">github</div>
          <div className="sum-val">
            <a className="ed-link t-mono-num" style={{ fontSize: 14 }}>
              {team.github} ↗
            </a>
          </div>
        </div>
        {team.demo && (
          <div className="sum-row">
            <div className="sum-label">demo</div>
            <div className="sum-val">
              <a className="ed-link t-mono-num" style={{ fontSize: 14 }}>
                {team.demo} ↗
              </a>
            </div>
          </div>
        )}
        {team.video && (
          <div className="sum-row">
            <div className="sum-label">vídeo</div>
            <div className="sum-val">
              <div className="vid-embed">
                <div className="vid-play">▶</div>
                <div className="vid-meta t-mono-num">02:48 · pitch-refila-final.mp4</div>
              </div>
            </div>
          </div>
        )}
        <div className="sum-row">
          <div className="sum-label">screenshots</div>
          <div className="sum-val">
            <div className="shot-grid">
              {[1, 2, 3, 4].map((i) => (
                <div className={`shot-thumb v${i}`} key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
