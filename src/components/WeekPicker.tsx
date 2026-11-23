"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { fmtBr, fmtSemanaDe, fmtWeekSpan, monthKey, monthLabel } from "@/lib/week";

export type WeekOption = { from: string; to: string; count: number };

type Props = {
  monday: string;
  weeks: WeekOption[];
  onPick: (from: string) => void;
  onPrev: () => void;
  onNext: () => void;
};

export function WeekPicker({ monday, weeks, onPick, onPrev, onNext }: Props) {
  const [open, setOpen] = useState(false);
  const [monthFilter, setMonthFilter] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const months = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    for (const w of weeks) {
      const mk = monthKey(w.from);
      if (!seen.has(mk)) {
        seen.add(mk);
        list.push(mk);
      }
    }
    return list;
  }, [weeks]);

  const filtered = useMemo(() => {
    if (!monthFilter) return weeks;
    return weeks.filter((w) => monthKey(w.from) === monthFilter);
  }, [weeks, monthFilter]);

  const current = weeks.find((w) => w.from === monday);

  useEffect(() => {
    if (!open) return;
    const mk = monthKey(monday);
    setMonthFilter(mk);
  }, [open, monday]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function pick(from: string) {
    onPick(from);
    setOpen(false);
  }

  return (
    <div className="week-picker" ref={rootRef}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="btn secondary icon-btn"
          aria-label="Semana anterior"
          onClick={onPrev}
        >
          ‹
        </button>

        <button
          type="button"
          className="week-picker-trigger"
          aria-expanded={open}
          aria-haspopup="listbox"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="week-picker-title">{fmtSemanaDe(monday)}</span>
          <span className="week-picker-sub">
            {current ? fmtWeekSpan(current.from, current.to) : fmtBr(monday)}
            {current?.count ? ` · ${current.count} culto${current.count > 1 ? "s" : ""}` : ""}
          </span>
        </button>

        <button
          type="button"
          className="btn secondary icon-btn"
          aria-label="Próxima semana"
          onClick={onNext}
        >
          ›
        </button>
      </div>

      {open ? (
        <div className="week-picker-panel card" role="listbox">
          <p className="text-sm text-[var(--muted)]">Ir para outra semana</p>
          {months.length > 1 ? (
            <div className="chip-row">
              <button
                type="button"
                className={`chip${!monthFilter ? " active" : ""}`}
                onClick={() => setMonthFilter(null)}
              >
                Todas
              </button>
              {months.map((mk) => (
                <button
                  key={mk}
                  type="button"
                  className={`chip${monthFilter === mk ? " active" : ""}`}
                  onClick={() => setMonthFilter(mk)}
                >
                  {monthLabel(mk)}
                </button>
              ))}
            </div>
          ) : null}

          <ul className="week-picker-list">
            {filtered.length === 0 ? (
              <li className="text-sm text-[var(--muted)] p-2">Nenhuma semana neste mês.</li>
            ) : (
              filtered.map((w) => (
                <li key={w.from}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={w.from === monday}
                    className={`week-picker-item${w.from === monday ? " active" : ""}`}
                    onClick={() => pick(w.from)}
                  >
                    <span>{fmtWeekSpan(w.from, w.to)}</span>
                    {w.count ? <span className="badge muted">{w.count}</span> : null}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}