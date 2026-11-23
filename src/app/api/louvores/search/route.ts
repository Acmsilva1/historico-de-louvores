import { NextResponse } from "next/server";
import { searchLouvores, louvorStats } from "@/lib/louvores";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const withStats = searchParams.get("stats") === "1";
  const items = await searchLouvores(q, 30);

  if (!withStats) return NextResponse.json({ items });

  const enriched = await Promise.all(
    items.map(async (item) => ({
      ...item,
      stats: await louvorStats(item.id),
    })),
  );
  return NextResponse.json({ items: enriched });
}
