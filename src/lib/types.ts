export type LouvorTipo = "hinario" | "cias" | "outro";

export type CultoTipo =
  | "2a"
  | "3a"
  | "4a"
  | "5a"
  | "sabado"
  | "domingo"
  | "domingo_ebd"
  | "culto_noite"
  | "outro";

export type Louvor = {
  id: string;
  numero: string | null;
  titulo: string;
  titulo_norm: string;
  tipo: LouvorTipo;
};

export type Culto = {
  id: string;
  data: string;
  tipo: CultoTipo | string;
  titulo: string | null;
};

export type CultoLouvor = {
  id: string;
  culto_id: string;
  louvor_id: string;
  ordem: number;
  louvor?: Louvor;
};

export type LouvorStats = {
  louvor_id: string;
  total: number;
  total_mes: number;
  total_ano: number;
  ultima_data: string | null;
  dias_desde: number | null;
  recente: boolean;
};

export type LouvorUso = {
  data: string;
  tipo: string;
  tipo_label: string;
  tipo_short: string;
};

export type LouvorHistorico = {
  louvor_id: string;
  usos: LouvorUso[];
};

export const CULTO_TIPO_LABEL: Record<string, string> = {
  "2a": "2ª feira",
  "3a": "3ª feira",
  "4a": "4ª feira",
  "5a": "5ª feira",
  sabado: "Sábado",
  domingo: "Domingo",
  domingo_ebd: "Domingo EBD",
  culto_noite: "Culto noite",
  outro: "Outro",
};
