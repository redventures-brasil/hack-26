import type { Status } from "@/lib/data";

const LABELS: Record<Status, string> = {
  pending: "na fila",
  evaluating: "avaliando",
  done: "avaliado",
  failed: "falhou",
};

export function StatusBadge({
  status,
  size = "md",
}: {
  status: Status;
  size?: "sm" | "md";
}) {
  const cls = [
    "st-badge",
    status,
    status === "evaluating" ? "shimmer" : "",
    size === "sm" ? "size-sm" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <span className={cls}>
      <span className="dot" />
      {LABELS[status]}
    </span>
  );
}
