"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { WeekGrid, type CultoWeek } from "@/components/WeekGrid";
import { WeekPicker, type WeekOption } from "@/components/WeekPicker";
import { fmtBr, mondayOf, shiftWeek } from "@/lib/week";

type WeekPayload = {
  from: string;
  to: string;
  cultos: CultoWeek[];
};

export function HomeContent() {
  const searchParams = useSearchParams();
  const semanaParam = searchParams.get("semana");

  const defaultMonday = useMemo(
    () => mondayOf(new Date()).toISOString().slice(0, 10),
    [],
  );

  const [monday, setMonday] = useState(semanaParam || defaultMonday);
  const [data, setData] = useState<WeekPayload | null>(null);
  const [weeks, setWeeks] = useState<WeekOption[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadWeek = useCallback(async (anchorMonday: string) => {
    setLoading(true);
    setError("");
    try {
      const r = await fetch(`/api/cultos?mode=week&date=${anchorMonday}`);
      if (!r.ok) throw new Error("falha");
      setData(await r.json());
    } catch {
      setError("Não foi possível carregar a semana.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch("/api/cultos?mode=weeks&limit=96")
      .then((r) => r.json())
      .then((json) => setWeeks(json.weeks || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const m = semanaParam || defaultMonday;
    setMonday(m);
    loadWeek(m);
  }, [semanaParam, defaultMonday, loadWeek]);

  function pickWeek(from: string) {
    setMonday(from);
    const url = new URL(window.location.href);
    url.searchParams.set("semana", from);
    window.history.replaceState(null, "", url.pathname + url.search);
    loadWeek(from);
  }

  const label =
    data && !loading ? `${fmtBr(data.from)} — ${fmtBr(data.to)}` : "Carregando…";

  return (
    <main className="space-y-4">
      <div className="card space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-[var(--muted)]">Histórico da semana</p>
            <p className="text-lg font-medium">{label}</p>
          </div>
          <Link href="/lancar" className="btn" style={{ width: "auto", flexShrink: 0 }}>
            Lançar
          </Link>
        </div>

        <WeekPicker
          monday={monday}
          weeks={weeks}
          onPick={pickWeek}
          onPrev={() => pickWeek(shiftWeek(monday, -1))}
          onNext={() => pickWeek(shiftWeek(monday, 1))}
        />

        {!loading && monday !== defaultMonday ? (
          <button
            type="button"
            className="text-sm text-[var(--accent)]"
            onClick={() => pickWeek(defaultMonday)}
          >
            Voltar para semana atual
          </button>
        ) : null}
      </div>

      {error ? <p className="text-[var(--danger)]">{error}</p> : null}

      {loading ? (
        <div className="card p-5 text-[var(--muted)]">Carregando cultos…</div>
      ) : (
        <WeekGrid cultos={data?.cultos || []} weekMonday={data?.from} />
      )}
    </main>
  );
}