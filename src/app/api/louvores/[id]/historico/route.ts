import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { louvorHistorico } from "@/lib/louvores";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  if (!id) return jsonError("id obrigatorio");

  const { searchParams } = new URL(req.url);
  const diasRaw = searchParams.get("dias");
  let desde: string | undefined;
  if (diasRaw) {
    const dias = Number(diasRaw);
    if (!Number.isFinite(dias) || dias < 1) return jsonError("dias invalido");
    const from = new Date();
    from.setDate(from.getDate() - dias);
    desde = from.toISOString().slice(0, 10);
  }

  try {
    const historico = await louvorHistorico(id, { desde });
    return NextResponse.json(historico);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "erro";
    return jsonError(msg, 500);
  }
}