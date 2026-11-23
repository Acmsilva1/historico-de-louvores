import { supabaseAdmin } from "@/lib/supabase/admin";
import type { LouvorStats } from "@/lib/types";
import { normalizeTitulo, detectTipo } from "@/lib/normalize";

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

export async function weekCultos(anchor = new Date()) {
  const db = supabaseAdmin();
  const day = anchor.getDay(); // 0=dom
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(anchor);
  monday.setDate(anchor.getDate() + mondayOffset);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const from = monday.toISOString().slice(0, 10);
  const to = sunday.toISOString().slice(0, 10);

  const { data: cultos } = await db
    .from("culto")
    .select("*, culto_louvor(id, ordem, louvor:louvor_id(*))")
    .gte("data", from)
    .lte("data", to)
    .order("data", { ascending: true });

  return { from, to, cultos: cultos ?? [] };
}
