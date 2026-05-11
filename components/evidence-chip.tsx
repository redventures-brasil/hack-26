const ICONS: Record<string, string> = {
  readme: "doc",
  screenshot: "img",
  pitch: "▶",
  demo: "↗",
  repo: "{ }",
  desc: "¶",
  profile: "@",
};

export function EvidenceChip({ kind, label }: { kind: string; label: string }) {
  return (
    <span className="ev-chip">
      <span className="ev-icon">{ICONS[kind] ?? "•"}</span>
      <span className="ev-label">{label}</span>
    </span>
  );
}

export function detectKind(ev: string): string {
  if (ev.startsWith("screenshot")) return "screenshot";
  if (ev.startsWith("pitch")) return "pitch";
  if (ev.startsWith("README")) return "readme";
  if (ev.includes("repo")) return "repo";
  if (ev.includes("demo")) return "demo";
  if (ev.includes("descrição")) return "desc";
  if (ev.includes("perfil")) return "profile";
  return "doc";
}
