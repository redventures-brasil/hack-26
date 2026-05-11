import { splitScore, toneFor } from "@/lib/data";

type Size = "huge" | "big" | "med" | "sm" | "xs";
type Tone = "auto" | "lowtone" | "midtone" | "hightone" | "toptone";

export function ScoreNumber({
  value,
  size = "med",
  mode = "auto",
}: {
  value: number | null;
  size?: Size;
  mode?: Tone;
}) {
  if (value == null) {
    return <span className={`score-num ${size} lowtone`}>—</span>;
  }
  const [whole, dec] = splitScore(value);
  const tone = mode === "auto" ? toneFor(value) : mode;
  return (
    <span className={`score-num ${size} ${tone}`}>
      <span className="whole">{whole}</span>
      {dec != null && <span className="dec">.{dec}</span>}
    </span>
  );
}

export function ScoreMono({
  value,
  mode = "auto",
}: {
  value: number | null;
  mode?: Tone;
}) {
  if (value == null) {
    return <span className="score-mono lowtone">—</span>;
  }
  const tone = mode === "auto" ? toneFor(value) : mode;
  return <span className={`score-mono ${tone}`}>{value.toFixed(1)}</span>;
}
