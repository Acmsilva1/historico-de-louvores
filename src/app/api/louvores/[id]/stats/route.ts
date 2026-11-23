import { NextResponse } from "next/server";
import { requireAuth, jsonError } from "@/lib/api";
import { louvorStats } from "@/lib/louvores";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const denied = await requireAuth();
  if (denied) return denied;
  const { id } = await ctx.params;
  if (!id) return jsonError("id obrigatorio");
  const stats = await louvorStats(id);
  return NextResponse.json(stats);
}
