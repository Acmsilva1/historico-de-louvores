"use client";

import Link from "next/link";
import { DIAS_LANCAR, SLOTS_SEMANA } from "@/lib/culto-dias";
import { dateInWeek, fmtBr } from "@/lib/week";

type CultoLouvor = {
  id: string;
  ordem: number;
  louvor: { numero: string | null; titulo: string } | null;
};

export type CultoWeek = {
  id: string;
  data: string;
  tipo: string;
  culto_louvor: CultoLouvor[];
};

type Props = {
  cultos: CultoWeek[];
  weekMonday?: string;
};

export function WeekGrid({ cultos, weekMonday }: Props) {
  const byTipo = new Map<string, CultoWeek>();
  for (const c of cultos) {
    byTipo.set(c.tipo, c);
    if (c.tipo === "domingo" && !byTipo.has("domingo_ebd")) {
      byTipo.set("domingo_ebd", c);
    }
  }

  return (
    <div className="week-grid">
      {SLOTS_SEMANA.map((slot) => {
        const c = byTipo.get(slot.tipo);
        const items = [...(c?.culto_louvor || [])].sort((a, b) => a.ordem - b.ordem);
        const dia = DIAS_LANCAR.find((d) => d.tipo === slot.tipo);
        const fallbackDate =
          weekMonday && dia ? dateInWeek(new Date(weekMonday + "T12:00:00"), dia.weekday) : null;
        const dataParam = c?.data || fallbackDate;
        const editHref = dataParam
          ? `/lancar?data=${dataParam}&tipo=${encodeURIComponent(slot.tipo)}`
          : `/lancar?tipo=${encodeURIComponent(slot.tipo)}`;

        return (
          <section key={slot.tipo} className="week-cell card">
            <div className="week-cell-head">
              <h3>{slot.short}</h3>
              <span className="text-xs text-[var(--muted)]">{c ? fmtBr(c.data) : "—"}</span>
            </div>
            {items.length === 0 ? (
              <p className="week-cell-empty">Sem lançamento</p>
            ) : (
              <ol className="week-cell-list">
                {items.map((item, idx) => (
                  <li key={item.id}>
                    <span className="num">{item.louvor?.numero || "—"}</span>
                    <span className="title">{item.louvor?.titulo}</span>
                    <span className="ord">{idx + 1}</span>
                  </li>
                ))}
              </ol>
            )}
            <Link href={editHref} className="week-cell-link">
              {c ? "Editar" : "Lançar"}
            </Link>
          </section>
        );
      })}
    </div>
  );
}