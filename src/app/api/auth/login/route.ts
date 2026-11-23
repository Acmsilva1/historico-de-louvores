import { NextResponse } from "next/server";
import { checkPin, sessionCookieName, signSession } from "@/lib/auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const pin = String(body.pin || "");
  if (!checkPin(pin)) {
    return NextResponse.json({ error: "PIN invalido" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(sessionCookieName(), signSession(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.COOKIE_SECURE === "true" || process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
