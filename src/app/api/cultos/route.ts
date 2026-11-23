import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  cultoByDataTipo,
  deleteCultoByDataTipo,
  ensureLouvor,
  listWeeks,
  weekCultos,
} from "@/lib/louvores";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode") || "week";
  const date = searchParams.get("date");

  if (mode === "week") {
    const anchor = date ? new Date(date + "T12:00:00") : new Date();
    const week = await weekCultos(anchor);
    return NextResponse.json(week);
  }

  if (mode === "weeks") {
    const weeks = await listWeeks(Number(searchParams.get("limit") || 48));
    return NextResponse.json({ weeks });
  }

  if (mode === "culto" && date) {
    const tipo = searchParams.get("tipo");
    if (!tipo) return jsonError("tipo obrigatorio");
    try {
      const culto = await cultoByDataTipo(date, tipo);
      if (!culto) return jsonError("culto nao encontrado", 404);
      return NextResponse.json({ culto });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "erro";
      return jsonError(msg, 500);
    }
  }

  if (mode === "day" && date) {
    const db = supabaseAdmin();
    const { data } = await db
      .from("culto")
      .select("*, culto_louvor(id, ordem, louvor:louvor_id(*))")
      .eq("data", date)
      .order("tipo");
    return NextResponse.json({ cultos: data ?? [] });
  }

  if (mode === "ranking") {
    const db = supabaseAdmin();
    const dias = Number(searchParams.get("dias") || 90);
    const from = new Date();
    from.setDate(from.getDate() - dias);
    const fromStr = from.toISOString().slice(0, 10);

    const { data } = await db
      .from("culto_louvor")
      .select("louvor_id, louvor:louvor_id(*), culto:culto_id!inner(data)")
      .gte("culto.data", fromStr);

    const map = new Map<string, { louvor: unknown; total: number }>();
    for (const row of data ?? []) {
      const id = row.louvor_id as string;
      const cur = map.get(id) || { louvor: row.louvor, total: 0 };
      cur.total += 1;
      map.set(id, cur);
    }
    const ranking = [...map.values()].sort((a, b) => b.total - a.total).slice(0, 40);
    return NextResponse.json({ from: fromStr, ranking });
  }

  return jsonError("mode invalido");
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body?.data || !body?.tipo || !Array.isArray(body.louvores)) {
    return jsonError("payload invalido");
  }

  const db = supabaseAdmin();
  const existing = await cultoByDataTipo(body.data, body.tipo);
  let culto;
  if (existing) {
    const { data: updated, error } = await db
      .from("culto")
      .update({
        tipo: body.tipo,
        titulo: body.titulo || null,
      })
      .eq("id", existing.id)
      .select("*")
      .single();
    if (error) return jsonError(error.message, 500);
    culto = updated;
  } else {
    const { data: created, error } = await db
      .from("culto")
      .upsert(
        {
          data: body.data,
          tipo: body.tipo,
          titulo: body.titulo || null,
        },
        { onConflict: "data,tipo" },
      )
      .select("*")
      .single();
    if (error) return jsonError(error.message, 500);
    culto = created;
  }

  await db.from("culto_louvor").delete().eq("culto_id", culto.id);

  const rows = [];
  for (let i = 0; i < body.louvores.length; i++) {
    const item = body.louvores[i];
    const louvor = await ensureLouvor({
      numero: item.numero ?? null,
      titulo: item.titulo,
    });
    rows.push({
      culto_id: culto.id,
      louvor_id: louvor.id,
      ordem: i + 1,
    });
  }

  if (rows.length) {
    const { error: linkErr } = await db.from("culto_louvor").insert(rows);
    if (linkErr) return jsonError(linkErr.message, 500);
  }

  const { data: full } = await db
    .from("culto")
    .select("*, culto_louvor(id, ordem, louvor:louvor_id(*))")
    .eq("id", culto.id)
    .single();

  return NextResponse.json({ culto: full });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const data = searchParams.get("data");
  const tipo = searchParams.get("tipo");
  if (!data || !tipo) return jsonError("data e tipo obrigatorios");

  try {
    const id = await deleteCultoByDataTipo(data, tipo);
    if (!id) return jsonError("culto nao encontrado", 404);
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "erro";
    return jsonError(msg, 500);
  }
}
