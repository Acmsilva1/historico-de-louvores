import { NextResponse, type NextRequest } from "next/server";

const COOKIE = "hl_session";
const PUBLIC = ["/login", "/api/healthz", "/api/auth/login", "/manifest.webmanifest", "/sw.js", "/icons"];

async function hmacHex(secret: string, payload: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function verify(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const secret = process.env.AUTH_SECRET || process.env.APP_PIN || "dev-secret";
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const expected = await hmacHex(secret, payload);
  if (expected.length !== sig.length) return false;
  let ok = 0;
  for (let i = 0; i < expected.length; i++) ok |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  return ok === 0;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (
    PUBLIC.some((p) => pathname === p || pathname.startsWith(p + "/")) ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  if (await verify(req.cookies.get(COOKIE)?.value)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "nao autorizado" }, { status: 401 });
  }

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
