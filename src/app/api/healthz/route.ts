import { NextResponse } from "next/server";
import { appBuildId } from "@/lib/build-id";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "historico-de-louvores",
    build: appBuildId(),
    ts: new Date().toISOString(),
  });
}
