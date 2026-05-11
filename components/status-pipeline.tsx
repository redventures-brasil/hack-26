const STAGES = [
  { key: "recebido", label: "recebido" },
  { key: "fila", label: "na fila" },
  { key: "avaliando", label: "avaliando" },
  { key: "publicado", label: "publicado" },
] as const;

type Props = {
  activeIndex?: number;
  failed?: boolean;
};

export function StatusPipeline({ activeIndex = 1, failed = false }: Props) {
  return (
    <div className="status-pipeline">
      {STAGES.map((s, i) => {
        let state: "past" | "current" | "failed" | "future" = "future";
        if (i < activeIndex) state = "past";
        else if (i === activeIndex) state = failed ? "failed" : "current";

        return (
          <div key={s.key} className="pipe-stage">
            <div className={`pipe-node ${state}`}>
              <div className="pipe-dot">
                {state === "past" && <span>✓</span>}
                {state === "failed" && <span>!</span>}
                {state === "current" && !failed && <span className="pipe-pulse" />}
              </div>
              <span className="pipe-label">{s.label}</span>
            </div>
            {i < STAGES.length - 1 && (
              <div className={`pipe-line ${i < activeIndex ? "past" : ""}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
