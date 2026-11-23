"use client";

import { useState } from "react";

type Hit = {
  id: string;
  numero: string | null;
  titulo: string;
  tipo: string;
  stats?: {
    total: number;
    total_mes: number;
    total_ano: number;
    ultima_data: string | null;
    dias_desde: number | null;
    recente: boolean;
  };
};

export default function BuscarPage() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Hit[]>([]);

  async function onSearch(value: string) {
    setQ(value);
    if (!value.trim()) {
      setItems([]);
      return;
    }
    const res = await fetch(`/api/louvores/search?q=${encodeURIComponent(value)}&stats=1`);
    if (!res.ok) return;
    const json = await res.json();
    setItems(json.items || []);
  }

  return (
    <main className="space-y-4">
      <div className="card p-4 space-y-3">
        <h2 className="text-lg font-semibold">Buscar louvor</h2>
        <input
          className="input"
          value={q}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Número ou nome"
        />
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <article key={item.id} className="card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-[var(--muted)]">
                  {item.numero || "s/n"} · {item.tipo}
                </p>
                <h3 className="text-lg font-medium">{item.titulo}</h3>
              </div>
              {item.stats?.recente ? (
                <span className="badge warn">recente</span>
              ) : (
                <span className="badge muted">{item.stats?.total ?? 0}x</span>
              )}
            </div>
            <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
              <div>
                <dt className="text-[var(--muted)]">Total</dt>
                <dd className="font-medium">{item.stats?.total ?? 0}</dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">Mês</dt>
                <dd className="font-medium">{item.stats?.total_mes ?? 0}</dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">Ano</dt>
                <dd className="font-medium">{item.stats?.total_ano ?? 0}</dd>
              </div>
            </dl>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Última vez:{" "}
              {item.stats?.ultima_data
                ? `${item.stats.ultima_data}${
                    item.stats.dias_desde != null ? ` (há ${item.stats.dias_desde}d)` : ""
                  }`
                : "nunca registrado"}
            </p>
          </article>
        ))}
      </div>
    </main>
  );
}
