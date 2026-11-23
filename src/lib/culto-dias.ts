import type { CultoTipo } from "@/lib/types";

export type DiaLancar = {
  tipo: CultoTipo;
  label: string;
  short: string;
  weekday: number;
  parent?: "domingo";
};

/** Ordem visual da semana (planilha / histórico). */
export const SLOTS_SEMANA: Array<{
  tipo: CultoTipo | "domingo";
  label: string;
  short: string;
}> = [
  { tipo: "2a", label: "2ª feira", short: "2ª" },
  { tipo: "3a", label: "3ª feira", short: "3ª" },
  { tipo: "4a", label: "4ª feira", short: "4ª" },
  { tipo: "5a", label: "5ª feira", short: "5ª" },
  { tipo: "sabado", label: "Sábado", short: "Sáb" },
  { tipo: "domingo_ebd", label: "Domingo · EBD", short: "Dom EBD" },
  { tipo: "culto_noite", label: "Domingo · Noite", short: "Dom Noite" },
];

export const DIAS_LANCAR: DiaLancar[] = [
  { tipo: "2a", label: "2ª feira", short: "2ª", weekday: 1 },
  { tipo: "3a", label: "3ª feira", short: "3ª", weekday: 2 },
  { tipo: "4a", label: "4ª feira", short: "4ª", weekday: 3 },
  { tipo: "5a", label: "5ª feira", short: "5ª", weekday: 4 },
  { tipo: "sabado", label: "Sábado", short: "Sáb", weekday: 6 },
  { tipo: "domingo_ebd", label: "EBD", short: "EBD", weekday: 0, parent: "domingo" },
  { tipo: "culto_noite", label: "Noite", short: "Noite", weekday: 0, parent: "domingo" },
];

export function labelTipo(tipo: string): string {
  const slot = SLOTS_SEMANA.find((s) => s.tipo === tipo);
  if (slot) return slot.label;
  if (tipo === "domingo") return "Domingo";
  return tipo;
}