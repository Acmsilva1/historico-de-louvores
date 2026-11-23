"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DIAS_LANCAR } from "@/lib/culto-dias";
import { manualLouvorFromFields } from "@/lib/parse-manual-louvor";
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
  const [numeroInput, setNumeroInput] = useState("");
  const [tituloInput, setTituloInput] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [items, setItems] = useState<DraftItem[]>([]);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [searching, setSearching] = useState(false);
  const [cultoId, setCultoId] = useState<string | null>(null);
  const [loadingCulto, setLoadingCulto] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (paramTipo && TIPOS_VALIDOS.has(paramTipo as CultoTipo)) {
      setTipo(paramTipo as CultoTipo);
    }
    if (paramData) setData(paramData);
  }, [paramTipo, paramData]);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    async function loadCulto() {
      setLoadingCulto(true);
      setMsg("");
      try {
        const res = await fetch(
          `/api/cultos?mode=culto&date=${encodeURIComponent(data)}&tipo=${encodeURIComponent(tipo)}`,
          { signal: controller.signal },
        );
        if (cancelled) return;
        if (res.status === 404) {
          setCultoId(null);
          setItems([]);
          return;
        }
        if (!res.ok) return;
        const json = (await res.json()) as {
          culto: {
            id: string;
            culto_louvor: Array<{
              id: string;
              ordem: number;
              louvor: { numero: string | null; titulo: string } | null;
            }>;
          };
        };
        const culto = json.culto;
        if (!culto) {
          setCultoId(null);
          setItems([]);
          return;
        }
        setCultoId(culto.id);
        const sorted = [...(culto.culto_louvor || [])].sort((a, b) => a.ordem - b.ordem);
        setItems(
          sorted.map((cl, i) => ({
            key: cl.id || `loaded-${i}`,
            numero: cl.louvor?.numero || "",
            titulo: cl.louvor?.titulo || "",
          })),
        );
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
      } finally {
        if (!cancelled) setLoadingCulto(false);
      }
    }

    void loadCulto();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [data, tipo]);

  function selectDia(next: CultoTipo) {
    setTipo(next);
    const dia = DIAS_LANCAR.find((d) => d.tipo === next);
    if (dia) setData(dateInWeek(new Date(data + "T12:00:00"), dia.weekday));
  }

  const diaAtual = DIAS_LANCAR.find((d) => d.tipo === tipo);
  const domingoAtivo = diaAtual?.parent === "domingo" || tipo === "domingo_ebd" || tipo === "culto_noite";

  const hasDraftInput = Boolean(numeroInput.trim() || tituloInput.trim());

  useEffect(() => {
    const n = numeroInput.trim();
    const t = tituloInput.trim();
    if (!n && !t) {
      setHits([]);
      setSearching(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      const q = t || n;
      setSearching(true);
      try {
        const res = await fetch(
          `/api/louvores/search?q=${encodeURIComponent(q)}&stats=1`,
          { signal: controller.signal },
        );
        if (!res.ok) return;
        const json = await res.json();
        let items: SearchHit[] = json.items || [];
        if (n && t) {
          const numLower = n.toLowerCase();
          items = items.filter((h) => (h.numero || "").trim().toLowerCase() === numLower);
        }
        setHits(items);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 280);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [numeroInput, tituloInput]);

  function clearDraftFields() {
    setNumeroInput("");
    setTituloInput("");
    setHits([]);
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
    clearDraftFields();
  }

  function addManual(e?: FormEvent) {
    e?.preventDefault();
    const parsed = manualLouvorFromFields(numeroInput, tituloInput);
    if (!parsed) return;
    setItems((prev) => [
      ...prev,
      {
        key: `m-${Date.now()}`,
        numero: parsed.numero,
        titulo: parsed.titulo,
      },
    ]);
    clearDraftFields();
  }

  const manualPreview = useMemo(
    () => manualLouvorFromFields(numeroInput, tituloInput),
    [numeroInput, tituloInput],
  );
  const showManualAdd = hasDraftInput && !searching;

  const hasWarn = useMemo(() => items.some((i) => i.stats?.recente), [items]);

  async function salvar() {
    if (!items.length && !cultoId) {
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
    const json = await res.json().catch(() => null);
    if (json?.culto?.id) setCultoId(json.culto.id);
    setMsg(cultoId ? "Alterações salvas." : "Culto salvo.");
  }

  async function excluirCulto() {
    if (!cultoId) return;
    if (!window.confirm("Excluir este culto e toda a lista de louvores?")) return;
    setDeleting(true);
    setMsg("");
    const res = await fetch(
      `/api/cultos?data=${encodeURIComponent(data)}&tipo=${encodeURIComponent(tipo)}`,
      { method: "DELETE" },
    );
    setDeleting(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setMsg(err.error || "Falha ao excluir");
      return;
    }
    setCultoId(null);
    setItems([]);
    setMsg("Culto excluído.");
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
        {loadingCulto ? (
          <p className="text-sm text-[var(--muted)]">Carregando culto salvo…</p>
        ) : cultoId ? (
          <p className="text-sm text-[var(--muted)]">
            Editando culto existente — remova itens com × ou salve as alterações.
          </p>
        ) : null}
        <form onSubmit={addManual} className="space-y-2">
          <div className="grid gap-2 sm:grid-cols-[minmax(5.5rem,7rem)_1fr]">
            <label className="space-y-1 text-sm block">
              <span className="text-[var(--muted)]">Número</span>
              <input
                className="input"
                value={numeroInput}
                onChange={(e) => setNumeroInput(e.target.value)}
                placeholder="ex. 42"
                inputMode="numeric"
                autoComplete="off"
              />
            </label>
            <label className="space-y-1 text-sm block">
              <span className="text-[var(--muted)]">Nome / título</span>
              <input
                className="input"
                value={tituloInput}
                onChange={(e) => setTituloInput(e.target.value)}
                placeholder="Comece a digitar para buscar"
                autoComplete="off"
              />
            </label>
          </div>
          {showManualAdd ? (
            <button type="submit" className="btn secondary" style={{ width: "auto" }}>
              {hits.length === 0
                ? manualPreview
                  ? `Adicionar manualmente: ${
                      manualPreview.numero &&
                      manualPreview.titulo !== manualPreview.numero
                        ? `${manualPreview.numero} · ${manualPreview.titulo}`
                        : manualPreview.titulo || manualPreview.numero
                    }`
                  : "Adicionar manualmente"
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
        <div className="flex flex-wrap gap-2">
          <button
            className="btn"
            disabled={saving || loadingCulto || (!items.length && !cultoId)}
            onClick={salvar}
          >
            {saving ? "Salvando…" : cultoId ? "Salvar alterações" : "Salvar culto"}
          </button>
          {cultoId ? (
            <button
              type="button"
              className="btn secondary"
              style={{ width: "auto" }}
              disabled={deleting || saving}
              onClick={excluirCulto}
            >
              {deleting ? "Excluindo…" : "Excluir culto"}
            </button>
          ) : null}
        </div>
        {msg ? <p className="text-sm text-[var(--muted)]">{msg}</p> : null}
      </div>
    </main>
  );
}