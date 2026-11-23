import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";

export async function requireAuth() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "nao autorizado" }, { status: 401 });
  }
  return null;
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
