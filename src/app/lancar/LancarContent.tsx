"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CultoListEditor } from "@/components/CultoListEditor";
import { DIAS_LANCAR } from "@/lib/culto-dias";
import { dateInWeek, fmtBr } from "@/lib/week";
import type { CultoTipo } from "@/lib/types";

const TIPOS_VALIDOS = new Set(DIAS_LANCAR.map((d) => d.tipo));

function defaultTipo(): CultoTipo {
  const jsDay = new Date().getDay();
  const match = DIAS_LANCAR.find((d) => d.weekday === jsDay);
  return (match?.tipo as CultoTipo) || "2a";
}

export function LancarContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
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

  const diasSemana = DIAS_LANCAR.filter((d) => !d.parent);
  const momentosDomingo = DIAS_LANCAR.filter((d) => d.parent === "domingo");

  return (
    <main className="space-y-4">
      <h2 className="text-lg font-semibold px-0.5">Novo lançamento</h2>

      <div className="card space-y-3 p-4">
        <h3 className="text-base font-semibold">1. Escolha o dia</h3>
        <div className="chip-row">
          {diasSemana.map((d) => (
            <button
              key={d.tipo}
              type="button"
              className={`chip touch-target-sm${tipo === d.tipo ? " active" : ""}`}
              onClick={() => selectDia(d.tipo)}
            >
              {d.short}
            </button>
          ))}
          <button
            type="button"
            className={`chip touch-target-sm${domingoAtivo ? " active" : ""}`}
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
                  className={`chip touch-target-sm${tipo === d.tipo ? " active" : ""}`}
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
        <h3 className="text-base font-semibold">2. Monte a lista</h3>
        <CultoListEditor
          key={`${data}-${tipo}`}
          data={data}
          tipo={tipo}
          mode="create"
          onSaved={() => router.push("/historico")}
        />
      </div>
    </main>
  );
}