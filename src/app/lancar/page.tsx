"use client";

import { FormEvent, useMemo, useState } from "react";
import { CULTO_TIPO_LABEL } from "@/lib/types";

type DraftItem = {
  key: string;
  numero: string;
  titulo: string;
  stats?: {
    recente: boolean;
    ultima_data: string | null;
    dias_desde: number | null;
    total: number;
  };
};

type SearchHit = {
  id: string;
  numero: string | null;
  titulo: string;
  stats?: DraftItem["stats"];
};

const TIPOS = Object.keys(CULTO_TIPO_LABEL);

function todayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export default function LancarPage() {
  const [data, setData] = useState(todayISO());
  const [tipo, setTipo] = useState("2a");
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [items, setItems] = useState<DraftItem[]>([]);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  async function search(value: string) {
    setQ(value);
    if (!value.trim()) {
      setHits([]);
      return;
    }
    const res = await fetch(`/api/louvores/search?q=${encodeURIComponent(value)}&stats=1`);
    if (!res.ok) return;
    const json = await res.json();
    setHits(json.items || []);
  }

  function addHit(hit: SearchHit) {
    setItems((prev) => [
      ...prev,
      {
        key: `${hit.id}-${Date.now()}`,
        numero: hit.numero || "",
        titulo: hit.titulo,
        stats: hit.stats,
      },
    ]);
    setQ("");
    setHits([]);
  }

  function addManual(e: FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    const numero = /^\d+$/.test(q.trim()) ? q.trim() : "";
    const titulo = numero ? "" : q.trim();
    if (!titulo && !numero) return;
    // se só número, pede título via campo separado — simples: usa o texto todo
    setItems((prev) => [
      ...prev,
      {
        key: `m-${Date.now()}`,
        numero,
        titulo: titulo || q.trim(),
      },
    ]);
    setQ("");
    setHits([]);
  }

  const hasWarn = useMemo(() => items.some((i) => i.stats?.recente), [items]);

  async function salvar() {
    if (!items.length) {
      setMsg("Adicione ao menos um louvor.");
      return;
    }
    setSaving(true);
    setMsg("");
    const res = await fetch("/api/cultos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data,
        tipo,
        louvores: items.map((i) => ({
          numero: i.numero || null,
          titulo: i.titulo,
        })),
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setMsg(err.error || "Falha ao salvar");
      return;
    }
    setMsg("Culto salvo.");
    setItems([]);
  }

  return (
    <main className="space-y-4">
      <div className="card space-y-3 p-4">
        <h2 className="text-lg font-semibold">Lançar culto</h2>
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1 text-sm">
            <span className="text-[var(--muted)]">Data</span>
            <input className="input" type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-[var(--muted)]">Tipo</span>
            <select className="select" value={tipo} onChange={(e) => setTipo(e.target.value)}>
              {TIPOS.map((t) => (
                <option key={t} value={t}>
                  {CULTO_TIPO_LABEL[t]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="card space-y-3 p-4">
        <form onSubmit={addManual} className="space-y-2">
          <label className="space-y-1 text-sm block">
            <span className="text-[var(--muted)]">Buscar por número ou nome</span>
            <input
              className="input"
              value={q}
              onChange={(e) => search(e.target.value)}
              placeholder="Ex.: 86 ou Em teu nome"
            />
          </label>
        </form>

        {hits.length > 0 ? (
          <ul className="space-y-2">
            {hits.map((h) => (
              <li key={h.id}>
                <button
                  type="button"
                  className="card w-full p-3 text-left"
                  style={{ background: "rgba(0,0,0,0.2)" }}
                  onClick={() => addHit(h)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span>
                      <span className="text-[var(--muted)]">{h.numero || "—"}</span> {h.titulo}
                    </span>
                    {h.stats?.recente ? (
                      <span className="badge warn">há {h.stats.dias_desde}d</span>
                    ) : (
                      <span className="badge muted">{h.stats?.total ?? 0}x</span>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="card space-y-3 p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Lista do culto ({items.length})</h3>
          {hasWarn ? <span className="badge warn">há repetição recente</span> : null}
        </div>
        {items.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">Nenhum louvor ainda.</p>
        ) : (
          <ol className="space-y-2">
            {items.map((item, idx) => (
              <li key={item.key} className="flex items-start gap-2">
                <span className="mt-1 w-6 text-[var(--muted)]">{idx + 1}.</span>
                <div className="flex-1">
                  <div className="font-medium">
                    {item.numero ? `${item.numero} · ` : ""}
                    {item.titulo}
                  </div>
                  {item.stats?.recente ? (
                    <div className="text-xs text-[var(--warn)]">
                      Cantado há {item.stats.dias_desde} dia(s)
                      {item.stats.ultima_data ? ` (${item.stats.ultima_data})` : ""}
                    </div>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="btn secondary"
                  style={{ width: "auto", padding: "0.35rem 0.6rem" }}
                  onClick={() => setItems((prev) => prev.filter((x) => x.key !== item.key))}
                >
                  Remover
                </button>
              </li>
            ))}
          </ol>
        )}
        <button className="btn" disabled={saving} onClick={salvar}>
          {saving ? "Salvando…" : "Salvar culto"}
        </button>
        {msg ? <p className="text-sm text-[var(--muted)]">{msg}</p> : null}
      </div>
    </main>
  );
}
