"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ScoreMono } from "./score";
import { StatusBadge } from "./status-badge";

type Status = "pending" | "evaluating" | "done" | "failed";

export type LeaderboardRow = {
  id: string;
  projectName: string;
  teamName: string;
  status: Status;
  scores: {
    vibe: number | null;
    originalidade: number | null;
    execucao: number | null;
    viabilidade: number | null;
  };
  total: number | null;
};

type SortKey = "total" | "vibe" | "originalidade" | "execucao" | "viabilidade";
type FilterKey = "all" | "done" | "fila";

function toneFor(n: number | null): "lowtone" | "midtone" | "hightone" | "toptone" {
  if (n == null) return "lowtone";
  if (n >= 9) return "toptone";
  if (n >= 7) return "hightone";
  if (n >= 5) return "midtone";
  return "lowtone";
}

function Pillbar<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (k: T) => void;
  options: [T, string][];
}) {
  return (
    <div className="pillbar">
      {options.map(([k, label]) => (
        <button
          key={k}
          type="button"
          className={`pill ${value === k ? "on" : ""}`}
          onClick={() => onChange(k)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function Row({
  row,
  index,
  isSpotlight,
}: {
  row: LeaderboardRow;
  index: number;
  isSpotlight: boolean;
}) {
  const router = useRouter();
  const isDone = row.status === "done";
  const totalTone = toneFor(row.total);
  return (
    <tr
      className={isSpotlight ? "top-1 spotlight" : ""}
      onClick={() => router.push(`/judge/${row.id}`)}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") router.push(`/judge/${row.id}`);
      }}
    >
      <td className="col-rank-cell">
        {isDone ? String(index + 1).padStart(2, "0") : "—"}
      </td>
      <td>
        <div className="project-name">{row.projectName}</div>
        <div className="project-team">{row.teamName}</div>
      </td>
      <td className="col-num">
        <ScoreMono value={row.scores.vibe} />
      </td>
      <td className="col-num">
        <ScoreMono value={row.scores.originalidade} />
      </td>
      <td className="col-num">
        <ScoreMono value={row.scores.execucao} />
      </td>
      <td className="col-num">
        <ScoreMono value={row.scores.viabilidade} />
      </td>
      <td className="col-total">
        {row.total != null ? (
          <span
            className={`total-cell ${totalTone}`}
            style={{
              color:
                totalTone === "toptone"
                  ? "var(--t-high)"
                  : totalTone === "hightone"
                    ? "var(--t-accent)"
                    : "var(--t-fg)",
            }}
          >
            {Math.floor(row.total)}
            <span className="dec">.{row.total.toFixed(1).split(".")[1]}</span>
          </span>
        ) : (
          <span className="muted t-mono-num">—</span>
        )}
      </td>
      <td className="col-status col-status-cell">
        {!isDone && <StatusBadge status={row.status} size="sm" />}
      </td>
    </tr>
  );
}

export function LeaderboardDashboard({ rows }: { rows: LeaderboardRow[] }) {
  const [sortBy, setSortBy] = useState<SortKey>("total");
  const [statusFilter, setStatusFilter] = useState<FilterKey>("all");
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const filtered = rows.filter((r) => {
      if (statusFilter === "done" && r.status !== "done") return false;
      if (
        statusFilter === "fila" &&
        r.status !== "pending" &&
        r.status !== "evaluating"
      )
        return false;
      if (query) {
        const q = query.toLowerCase();
        return (
          r.projectName.toLowerCase().includes(q) ||
          r.teamName.toLowerCase().includes(q)
        );
      }
      return true;
    });
    return filtered.sort((a, b) => {
      if (a.total == null && b.total == null) return 0;
      if (a.total == null) return 1;
      if (b.total == null) return -1;
      if (sortBy === "total") return b.total - a.total;
      const av = a.scores[sortBy] ?? 0;
      const bv = b.scores[sortBy] ?? 0;
      return bv - av;
    });
  }, [rows, sortBy, statusFilter, query]);

  const counts = useMemo(() => {
    const c = { total: rows.length, done: 0, pending: 0, failed: 0 };
    for (const r of rows) {
      if (r.status === "done") c.done++;
      else if (r.status === "pending" || r.status === "evaluating") c.pending++;
      else if (r.status === "failed") c.failed++;
    }
    return c;
  }, [rows]);

  return (
    <div className="jd-stage">
      <div className="jd-head">
        <div>
          <div className="t-eyebrow">12 mai 2026 · ranking ao vivo</div>
          <h2 className="t-edit-h1" style={{ margin: "8px 0 4px" }}>
            <span
              className="t-mono-num"
              style={{ fontFamily: "var(--font-display)", fontSize: 60 }}
            >
              {counts.total}
            </span>{" "}
            projetos.
            <span style={{ color: "var(--t-fg-3)" }}>
              {" "}
              {counts.done} avaliados, {counts.pending} na fila
              {counts.failed > 0 ? `, ${counts.failed} com erro.` : "."}
            </span>
          </h2>
        </div>
        <div className="jd-toolbar">
          <div className="tb-group">
            <span className="t-eyebrow">ordenar</span>
            <Pillbar
              value={sortBy}
              onChange={setSortBy}
              options={[
                ["total", "Total"],
                ["vibe", "Vibe"],
                ["originalidade", "Orig."],
                ["execucao", "Téc."],
                ["viabilidade", "Viab."],
              ]}
            />
          </div>
          <div className="tb-group">
            <span className="t-eyebrow">status</span>
            <Pillbar
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                ["all", "Todos"],
                ["done", "Avaliados"],
                ["fila", "Na fila"],
              ]}
            />
          </div>
          <div className="tb-search">
            <span className="search-icon">/</span>
            <input
              placeholder="buscar projeto ou time"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="lb-wrap">
        <table className="lb">
          <thead>
            <tr>
              <th className="col-rank">#</th>
              <th className="col-project">Projeto / Time</th>
              <th
                className={`col-num ${sortBy === "vibe" ? "active" : ""}`}
                aria-sort={sortBy === "vibe" ? "descending" : "none"}
              >
                Vibe
              </th>
              <th
                className={`col-num ${sortBy === "originalidade" ? "active" : ""}`}
                aria-sort={sortBy === "originalidade" ? "descending" : "none"}
              >
                Orig.
              </th>
              <th
                className={`col-num ${sortBy === "execucao" ? "active" : ""}`}
                aria-sort={sortBy === "execucao" ? "descending" : "none"}
              >
                Téc.
              </th>
              <th
                className={`col-num ${sortBy === "viabilidade" ? "active" : ""}`}
                aria-sort={sortBy === "viabilidade" ? "descending" : "none"}
              >
                Viab.
              </th>
              <th
                className={`col-total ${sortBy === "total" ? "active" : ""}`}
                aria-sort={sortBy === "total" ? "descending" : "none"}
              >
                Total
              </th>
              <th className="col-status">Status</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r, i) => (
              <Row
                key={r.id}
                row={r}
                index={i}
                isSpotlight={i === 0 && r.status === "done"}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
