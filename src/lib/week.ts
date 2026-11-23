/** Semana começando na segunda-feira (padrão BR). */

export function mondayOf(anchor: Date): Date {
  const day = anchor.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(anchor);
  monday.setHours(12, 0, 0, 0);
  monday.setDate(anchor.getDate() + mondayOffset);
  return monday;
}

export function weekRange(anchor: Date): { from: string; to: string } {
  const monday = mondayOf(anchor);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    from: monday.toISOString().slice(0, 10),
    to: sunday.toISOString().slice(0, 10),
  };
}

export function fmtBr(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function shiftWeek(mondayIso: string, delta: number): string {
  const d = new Date(mondayIso + "T12:00:00");
  d.setDate(d.getDate() + delta * 7);
  return d.toISOString().slice(0, 10);
}

/** weekday JS: 0=dom … 6=sáb → data na semana de `anchor`. */
export function dateInWeek(anchor: Date, weekday: number): string {
  const monday = mondayOf(anchor);
  const offset = weekday === 0 ? 6 : weekday - 1;
  const target = new Date(monday);
  target.setDate(monday.getDate() + offset);
  return target.toISOString().slice(0, 10);
}