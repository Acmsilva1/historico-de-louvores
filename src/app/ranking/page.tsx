"use client";

import { useCallback, useEffect, useState } from "react";

type Row = {
  total: number;
  louvor: { id: string; numero: string | null; titulo: string } | null;
};

type Uso = {
  data: string;
  tipo: string;
  tipo_label: string;
  tipo_short: string;
};

function formatDataBr(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export default function RankingPage() {
  const [dias, setDias] = useState(90);
  const [rows, setRows] = useState<Row[]>([]);
  const [from, setFrom] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [usos, setUsos] = useState<Uso[]>([]);
  const [loadingHistorico, setLoadingHistorico] = useState(false);
  const [historicoErro, setHistoricoErro] = useState("");

  useEffect(() => {
    fetch(`/api/cultos?mode=ranking&dias=${dias}`)
      .then((r) => r.json())
      .then((json) => {
        setRows(json.ranking || []);
        setFrom(json.from || "");
      })
      .catch(() => setRows([]));
  }, [dias]);

  useEffect(() => {
    setExpandedId(null);
    setUsos([]);
    setHistoricoErro("");
  }, [dias]);

  const toggleLouvor = useCallback(
  (id: string | undefined) => {
    if (!id) return;
    if (expandedId === id) {
      setExpandedId(null);
      setUsos([]);
      setHistoricoErro("");
      return;
    }
    setExpandedId(id);
    setUsos([]);
    setHistoricoErro("");
    setLoadingHistorico(true);
    fetch(`/api/louvores/${id}/historico?dias=${dias}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.error) {
          setHistoricoErro(json.error);
          setUsos([]);
          return;
        }
        setUsos(json.usos || []);
      })
      .catch(() => {
        setHistoricoErro("Não foi possível carregar o histórico.");
        setUsos([]);
      })
      .finally(() => setLoadingHistorico(false));
  },
  [dias, expandedId],
);

  return (
    <main className="space-y-4">
      <div className="card flex items-center justify-between gap-3 p-4">
        <div>
          <h2 className="text-lg font-semibold">Mais cantados</h2>
          <p className="text-sm text-[var(--muted)]">
            Desde {from || "…"} · últimos {dias} dias · toque no louvor para ver datas
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
        {rows.map((row, idx) => {
          const id = row.louvor?.id;
          const aberto = Boolean(id && expandedId === id);
          return (
            <li key={row.louvor?.id || idx} className="card overflow-hidden">
              <button
                type="button"
                className="ranking-row flex w-full items-center gap-3 p-3 text-left"
                onClick={() => toggleLouvor(id)}
                aria-expanded={aberto}
                disabled={!id}
              >
                <span className="w-8 text-center text-[var(--muted)]">{idx + 1}</span>
                <div className="flex-1">
                  <div className="font-medium">{row.louvor?.titulo}</div>
                  <div className="text-sm text-[var(--muted)]">{row.louvor?.numero || "s/n"}</div>
                </div>
                <span className="badge muted">{row.total}x</span>
              </button>

              {aberto ? (
                <div className="ranking-panel border-t border-[var(--line)] px-3 pb-3 pt-2">
                  {loadingHistorico ? (
                    <p className="text-sm text-[var(--muted)]">Carregando usos…</p>
                  ) : historicoErro ? (
                    <p className="text-sm text-[var(--danger)]">{historicoErro}</p>
                  ) : usos.length === 0 ? (
                    <p className="text-sm text-[var(--muted)]">Nenhum uso no período.</p>
                  ) : (
                    <ul className="ranking-usos">
                      {usos.map((uso) => (
                        <li key={`${uso.data}-${uso.tipo}`}>
                          <span className="ranking-uso-data">{formatDataBr(uso.data)}</span>
                          <span className="badge muted" title={uso.tipo_label}>
                            {uso.tipo_short}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>
    </main>
  );
}