"use client";

import { useEffect, useState } from "react";

type Row = {
  total: number;
  louvor: { id: string; numero: string | null; titulo: string } | null;
};

export default function RankingPage() {
  const [dias, setDias] = useState(90);
  const [rows, setRows] = useState<Row[]>([]);
  const [from, setFrom] = useState("");

  useEffect(() => {
    fetch(`/api/cultos?mode=ranking&dias=${dias}`)
      .then((r) => r.json())
      .then((json) => {
        setRows(json.ranking || []);
        setFrom(json.from || "");
      })
      .catch(() => setRows([]));
  }, [dias]);

  return (
    <main className="space-y-4">
      <div className="card flex items-center justify-between gap-3 p-4">
        <div>
          <h2 className="text-lg font-semibold">Mais cantados</h2>
          <p className="text-sm text-[var(--muted)]">
            Desde {from || "…"} · últimos {dias} dias
          </p>
        </div>
        <select
          className="select"
          style={{ width: "auto" }}
          value={dias}
          onChange={(e) => setDias(Number(e.target.value))}
        >
          <option value={30}>30 dias</option>
          <option value={90}>90 dias</option>
          <option value={180}>180 dias</option>
          <option value={365}>1 ano</option>
        </select>
      </div>

      <ol className="space-y-2">
        {rows.map((row, idx) => (
          <li key={row.louvor?.id || idx} className="card flex items-center gap-3 p-3">
            <span className="w-8 text-center text-[var(--muted)]">{idx + 1}</span>
            <div className="flex-1">
              <div className="font-medium">{row.louvor?.titulo}</div>
              <div className="text-sm text-[var(--muted)]">{row.louvor?.numero || "s/n"}</div>
            </div>
            <span className="badge muted">{row.total}x</span>
          </li>
        ))}
      </ol>
    </main>
  );
}
