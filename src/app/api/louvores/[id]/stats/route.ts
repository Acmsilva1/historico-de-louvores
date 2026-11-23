import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { louvorStats } from "@/lib/louvores";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  if (!id) return jsonError("id obrigatorio");
  const stats = await louvorStats(id);
  return NextResponse.json(stats);
}
