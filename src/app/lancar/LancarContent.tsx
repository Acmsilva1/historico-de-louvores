"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DIAS_LANCAR } from "@/lib/culto-dias";
import { parseManualLouvor } from "@/lib/parse-manual-louvor";
import { dateInWeek, fmtBr } from "@/lib/week";
import type { CultoTipo } from "@/lib/types";

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

const TIPOS_VALIDOS = new Set(DIAS_LANCAR.map((d) => d.tipo));

function defaultTipo(): CultoTipo {
  const jsDay = new Date().getDay();
  const match = DIAS_LANCAR.find((d) => d.weekday === jsDay);
  return (match?.tipo as CultoTipo) || "2a";
}

export function LancarContent() {
  const searchParams = useSearchParams();
  const paramTipo = searchParams.get("tipo");
  const paramData = searchParams.get("data");

  const [tipo, setTipo] = useState<CultoTipo>(() => {
    if (paramTipo && TIPOS_VALIDOS.has(paramTipo as CultoTipo)) {
      return paramTipo as CultoTipo;
    }
    return defaultTipo();
  });
  const [data, setData] = useState(() => {
    if (paramData) return paramData;
    const dia = DIAS_LANCAR.find((d) => d.tipo === (paramTipo || defaultTipo()));
    if (dia) return dateInWeek(new Date(), dia.weekday);
    return new Date().toISOString().slice(0, 10);
  });
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [items, setItems] = useState<DraftItem[]>([]);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (paramTipo && TIPOS_VALIDOS.has(paramTipo as CultoTipo)) {
      setTipo(paramTipo as CultoTipo);
    }
    if (paramData) setData(paramData);
  }, [paramTipo, paramData]);

  function selectDia(next: CultoTipo) {
    setTipo(next);
    const dia = DIAS_LANCAR.find((d) => d.tipo === next);
    if (dia) setData(dateInWeek(new Date(data + "T12:00:00"), dia.weekday));
  }

  const diaAtual = DIAS_LANCAR.find((d) => d.tipo === tipo);
  const domingoAtivo = diaAtual?.parent === "domingo" || tipo === "domingo_ebd" || tipo === "culto_noite";

  async function search(value: string) {
    setQ(value);
    if (!value.trim()) {
      setHits([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const res = await fetch(`/api/louvores/search?q=${encodeURIComponent(value)}&stats=1`);
    setSearching(false);
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

  function addManual(e?: FormEvent) {
    e?.preventDefault();
    const parsed = parseManualLouvor(q);
    if (!parsed) return;
    setItems((prev) => [
      ...prev,
      {
        key: `m-${Date.now()}`,
        numero: parsed.numero,
        titulo: parsed.titulo,
      },
    ]);
    setQ("");
    setHits([]);
  }

  const manualPreview = useMemo(() => parseManualLouvor(q), [q]);
  const showManualAdd = Boolean(q.trim() && !searching);

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

  const diasSemana = DIAS_LANCAR.filter((d) => !d.parent);
  const momentosDomingo = DIAS_LANCAR.filter((d) => d.parent === "domingo");

  return (
    <main className="space-y-4">
      <div className="card space-y-3 p-4">
        <h2 className="text-lg font-semibold">1. Escolha o dia</h2>
        <div className="chip-row">
          {diasSemana.map((d) => (
            <button
              key={d.tipo}
              type="button"
              className={`chip${tipo === d.tipo ? " active" : ""}`}
              onClick={() => selectDia(d.tipo)}
            >
              {d.short}
            </button>
          ))}
          <button
            type="button"
            className={`chip${domingoAtivo ? " active" : ""}`}
            onClick={() => selectDia("domingo_ebd")}
          >
            Dom
          </button>
        </div>

        {domingoAtivo ? (
          <div className="space-y-2">
            <p className="text-sm text-[var(--muted)]">Domingo — qual momento?</p>
            <div className="chip-row">
              {momentosDomingo.map((d) => (
                <button
                  key={d.tipo}
                  type="button"
                  className={`chip${tipo === d.tipo ? " active" : ""}`}
                  onClick={() => selectDia(d.tipo)}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <label className="space-y-1 text-sm block">
          <span className="text-[var(--muted)]">Data do culto</span>
          <input
            className="input"
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
          />
        </label>
        <p className="text-sm text-[var(--muted)]">
          {diaAtual ? diaAtual.label : tipo} · {fmtBr(data)}
        </p>
      </div>

      <div className="card space-y-3 p-4">
        <h2 className="text-lg font-semibold">2. Monte a lista</h2>
        <form onSubmit={addManual} className="space-y-2">
          <input
            className="input"
            value={q}
            onChange={(e) => search(e.target.value)}
            placeholder="Número, título ou ex.: 42 · Nome do louvor"
            autoComplete="off"
          />
          {showManualAdd ? (
            <button type="submit" className="btn secondary" style={{ width: "auto" }}>
              {hits.length === 0
                ? `Adicionar manualmente${manualPreview?.numero ? ` (${manualPreview.numero})` : ""}`
                : "Adicionar como novo louvor"}
            </button>
          ) : null}
        </form>

        {showManualAdd && hits.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">
            Não está no catálogo? Use o botão acima — ao salvar o culto, o louvor entra no catálogo.
          </p>
        ) : null}

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

        <div className="space-y-2 border-t border-[var(--line)] pt-3">
          <div className="flex items-center justify-between">
            <span className="font-medium">Lista ({items.length})</span>
            {hasWarn ? <span className="badge warn">repetição recente</span> : null}
          </div>
          {items.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">Toque nos resultados acima para adicionar.</p>
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
                      </div>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    className="btn secondary"
                    style={{ width: "auto", padding: "0.35rem 0.6rem" }}
                    onClick={() => setItems((prev) => prev.filter((x) => x.key !== item.key))}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      <div className="card p-4 space-y-3">
        <h2 className="text-lg font-semibold">3. Salvar</h2>
        <button className="btn" disabled={saving || items.length === 0} onClick={salvar}>
          {saving ? "Salvando…" : "Salvar culto"}
        </button>
        {msg ? <p className="text-sm text-[var(--muted)]">{msg}</p> : null}
      </div>
    </main>
  );
}