import { supabaseAdmin } from "@/lib/supabase/admin";
import { labelTipo, shortTipo } from "@/lib/culto-dias";
import type { LouvorHistorico, LouvorStats, LouvorUso } from "@/lib/types";
import { normalizeTitulo, detectTipo } from "@/lib/normalize";
import { mondayOf, weekRange } from "@/lib/week";

const REPETICAO_DIAS = () => Number(process.env.REPETICAO_DIAS || 14);

export async function ensureLouvor(input: {
  numero?: string | null;
  titulo: string;
}) {
  const db = supabaseAdmin();
  const titulo = input.titulo.trim();
  const titulo_norm = normalizeTitulo(titulo);
  const numero =
    input.numero && String(input.numero).toUpperCase() !== "CIAS"
      ? String(input.numero).trim()
      : input.numero && String(input.numero).toUpperCase() === "CIAS"
        ? null
        : input.numero
          ? String(input.numero).trim()
          : null;
  const tipo = detectTipo(numero, titulo);

  const { data: existing } = await db
    .from("louvor")
    .select("*")
    .eq("titulo_norm", titulo_norm)
    .maybeSingle();

  if (existing) {
    if ((!existing.numero && numero) || existing.tipo !== tipo) {
      const { data } = await db
        .from("louvor")
        .update({
          numero: existing.numero || numero,
          tipo,
          titulo,
        })
        .eq("id", existing.id)
        .select("*")
        .single();
      return data ?? existing;
    }
    return existing;
  }

  const { data, error } = await db
    .from("louvor")
    .insert({ numero, titulo, titulo_norm, tipo })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function searchLouvores(q: string, limit = 20) {
  const db = supabaseAdmin();
  const query = q.trim();
  if (!query) {
    const { data } = await db.from("louvor").select("*").order("titulo").limit(limit);
    return data ?? [];
  }

  if (/^\d+$/.test(query)) {
    const { data } = await db
      .from("louvor")
      .select("*")
      .eq("numero", query)
      .order("titulo")
      .limit(limit);
    return data ?? [];
  }

  const norm = normalizeTitulo(query);
  const { data } = await db
    .from("louvor")
    .select("*")
    .or(`titulo_norm.ilike.%${norm}%,titulo.ilike.%${query}%`)
    .order("titulo")
    .limit(limit);
  return data ?? [];
}

export async function louvorStats(louvorId: string): Promise<LouvorStats> {
  const db = supabaseAdmin();
  const now = new Date();
  const mesInicio = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const anoInicio = `${now.getFullYear()}-01-01`;
  const janela = REPETICAO_DIAS();

  const { data: rows } = await db
    .from("culto_louvor")
    .select("culto:culto_id(data)")
    .eq("louvor_id", louvorId);

  const datas = (rows ?? [])
    .map((r) => {
      const culto = r.culto as unknown as { data?: string } | { data?: string }[] | null;
      if (!culto) return null;
      if (Array.isArray(culto)) return culto[0]?.data ?? null;
      return culto.data ?? null;
    })
    .filter((d): d is string => Boolean(d))
    .sort();

  const ultima = datas.length ? datas[datas.length - 1] : null;
  let dias_desde: number | null = null;
  if (ultima) {
    const diff = now.getTime() - new Date(ultima + "T12:00:00").getTime();
    dias_desde = Math.floor(diff / 86400000);
  }

  return {
    louvor_id: louvorId,
    total: datas.length,
    total_mes: datas.filter((d) => d >= mesInicio).length,
    total_ano: datas.filter((d) => d >= anoInicio).length,
    ultima_data: ultima,
    dias_desde,
    recente: dias_desde !== null && dias_desde <= janela,
  };
}

export async function louvorHistorico(
  louvorId: string,
  opts?: { desde?: string },
): Promise<LouvorHistorico> {
  const db = supabaseAdmin();
  const { data: rows, error } = await db
    .from("culto_louvor")
    .select("culto:culto_id(data, tipo)")
    .eq("louvor_id", louvorId);
  if (error) throw error;

  const usos: LouvorUso[] = [];
  for (const row of rows ?? []) {
    const culto = row.culto as unknown as
      | { data?: string; tipo?: string }
      | { data?: string; tipo?: string }[]
      | null;
    const c = Array.isArray(culto) ? culto[0] : culto;
    if (!c?.data) continue;
    if (opts?.desde && c.data < opts.desde) continue;
    const tipo = String(c.tipo ?? "outro");
    usos.push({
      data: c.data,
      tipo,
      tipo_label: labelTipo(tipo),
      tipo_short: shortTipo(tipo),
    });
  }

  usos.sort((a, b) => b.data.localeCompare(a.data) || a.tipo.localeCompare(b.tipo));
  return { louvor_id: louvorId, usos };
}

const TIPO_EQUIVALENTES: Partial<Record<string, string[]>> = {
  domingo_ebd: ["domingo_ebd", "domingo"],
};

export async function cultoByDataTipo(data: string, tipo: string) {
  const db = supabaseAdmin();
  const tipos = TIPO_EQUIVALENTES[tipo] ?? [tipo];
  const { data: rows, error } = await db
    .from("culto")
    .select("*, culto_louvor(id, ordem, louvor:louvor_id(*))")
    .eq("data", data)
    .in("tipo", tipos)
    .order("tipo", { ascending: true })
    .limit(1);
  if (error) throw error;
  return rows?.[0] ?? null;
}

export async function deleteCultoByDataTipo(data: string, tipo: string) {
  const culto = await cultoByDataTipo(data, tipo);
  if (!culto) return null;
  const db = supabaseAdmin();
  await db.from("culto_louvor").delete().eq("culto_id", culto.id);
  const { error } = await db.from("culto").delete().eq("id", culto.id);
  if (error) throw error;
  return culto.id as string;
}

export async function weekCultos(anchor = new Date()) {
  const db = supabaseAdmin();
  const { from, to } = weekRange(anchor);

  const { data: cultos } = await db
    .from("culto")
    .select("*, culto_louvor(id, ordem, louvor:louvor_id(*))")
    .gte("data", from)
    .lte("data", to)
    .order("data", { ascending: true });

  return { from, to, cultos: cultos ?? [] };
}

export async function listWeeks(limit = 48) {
  const db = supabaseAdmin();
  const { data } = await db.from("culto").select("data").order("data", { ascending: false });

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const mon = mondayOf(new Date(String(row.data) + "T12:00:00")).toISOString().slice(0, 10);
    counts.set(mon, (counts.get(mon) || 0) + 1);
  }

  const currentMon = mondayOf(new Date()).toISOString().slice(0, 10);
  if (!counts.has(currentMon)) counts.set(currentMon, 0);

  return [...counts.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, limit)
    .map(([from, count]) => {
      const { to } = weekRange(new Date(from + "T12:00:00"));
      return { from, to, count };
    });
}
