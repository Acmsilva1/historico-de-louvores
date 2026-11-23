"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { manualLouvorFromFields } from "@/lib/parse-manual-louvor";
import type { CultoTipo } from "@/lib/types";

export type DraftItem = {
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

type Props = {
  data: string;
  tipo: CultoTipo;
  mode: "create" | "edit";
  onSaved?: () => void;
  onDeleted?: () => void;
};

export function CultoListEditor({ data, tipo, mode, onSaved, onDeleted }: Props) {
  const [numeroInput, setNumeroInput] = useState("");
  const [tituloInput, setTituloInput] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [items, setItems] = useState<DraftItem[]>([]);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [searching, setSearching] = useState(false);
  const [cultoId, setCultoId] = useState<string | null>(null);
  const [loadingCulto, setLoadingCulto] = useState(mode === "edit");
  const [deleting, setDeleting] = useState(false);
  const [existsBlocked, setExistsBlocked] = useState(false);

  useEffect(() => {
    if (mode !== "edit") {
      setCultoId(null);
      setItems([]);
      setExistsBlocked(false);
      setLoadingCulto(false);
      return;
    }

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
          setMsg("Culto não encontrado.");
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
        if (!culto) return;
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
  }, [data, tipo, mode]);

  useEffect(() => {
    if (mode !== "create") {
      setExistsBlocked(false);
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    async function checkExisting() {
      try {
        const res = await fetch(
          `/api/cultos?mode=culto&date=${encodeURIComponent(data)}&tipo=${encodeURIComponent(tipo)}`,
          { signal: controller.signal },
        );
        if (cancelled) return;
        setExistsBlocked(res.ok);
        if (res.ok) {
          setItems([]);
          setCultoId(null);
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        if (!cancelled) setExistsBlocked(false);
      }
    }

    void checkExisting();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [data, tipo, mode]);

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
        let list: SearchHit[] = json.items || [];
        if (n && t) {
          const numLower = n.toLowerCase();
          list = list.filter((h) => (h.numero || "").trim().toLowerCase() === numLower);
        }
        setHits(list);
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
  const showManualAdd = hasDraftInput && !searching && !existsBlocked;

  const hasWarn = useMemo(() => items.some((i) => i.stats?.recente), [items]);

  async function salvar() {
    if (existsBlocked) return;
    if (!items.length && mode === "create") {
      setMsg("Adicione ao menos um louvor.");
      return;
    }
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
    setMsg(mode === "edit" ? "Alterações salvas." : "Culto salvo.");
    onSaved?.();
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
    onDeleted?.();
  }

  if (loadingCulto) {
    return <p className="text-sm text-[var(--muted)] py-2">Carregando culto…</p>;
  }

  return (
    <div className="space-y-3">
      {existsBlocked ? (
        <p className="rounded-xl border border-[var(--warn)]/35 bg-[rgba(240,180,41,0.12)] px-3 py-2.5 text-sm text-[var(--text)]">
          Já existe lançamento para este dia. Edite pelo{" "}
          <strong>Histórico</strong> ou escolha outra data.
        </p>
      ) : null}

      {mode === "edit" && cultoId ? (
        <p className="text-sm text-[var(--muted)]">
          Ajuste a lista abaixo e salve. Use × para remover itens.
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
              disabled={existsBlocked}
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
              disabled={existsBlocked}
            />
          </label>
        </div>
        {showManualAdd ? (
          <button type="submit" className="btn secondary touch-target" style={{ width: "auto" }}>
            {hits.length === 0
              ? manualPreview
                ? `Adicionar: ${
                    manualPreview.numero && manualPreview.titulo !== manualPreview.numero
                      ? `${manualPreview.numero} · ${manualPreview.titulo}`
                      : manualPreview.titulo || manualPreview.numero
                  }`
                : "Adicionar manualmente"
              : "Adicionar como novo louvor"}
          </button>
        ) : null}
      </form>

      {hits.length > 0 ? (
        <ul className="space-y-2 max-h-48 overflow-y-auto">
          {hits.map((h) => (
            <li key={h.id}>
              <button
                type="button"
                className="card w-full p-3 text-left touch-target"
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
          <p className="text-sm text-[var(--muted)]">
            {existsBlocked ? "Nenhum item novo." : "Adicione louvores pelos campos acima."}
          </p>
        ) : (
          <ol className="space-y-2">
            {items.map((item, idx) => (
              <li key={item.key} className="flex items-start gap-2">
                <span className="mt-2 w-6 text-[var(--muted)]">{idx + 1}.</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium break-words">
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
                  className="btn-icon touch-target"
                  aria-label="Remover"
                  onClick={() => setItems((prev) => prev.filter((x) => x.key !== item.key))}
                >
                  ×
                </button>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="button"
          className="btn touch-target"
          disabled={saving || existsBlocked || (!items.length && !cultoId)}
          onClick={salvar}
        >
          {saving ? "Salvando…" : mode === "edit" ? "Salvar alterações" : "Salvar culto"}
        </button>
        {mode === "edit" && cultoId ? (
          <button
            type="button"
            className="btn secondary touch-target"
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
  );
}