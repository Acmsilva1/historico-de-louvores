import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

const COOKIE = "hl_session";

function secret() {
  return process.env.AUTH_SECRET || process.env.APP_PIN || "dev-secret";
}

export function signSession(): string {
  const payload = `ok:${Date.now()}`;
  const sig = createHmac("sha256", secret()).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export function verifySession(token: string | undefined | null): boolean {
  if (!token) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const expected = createHmac("sha256", secret()).update(payload).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const jar = await cookies();
  return verifySession(jar.get(COOKIE)?.value);
}

export function sessionCookieName() {
  return COOKIE;
}

export function checkPin(pin: string): boolean {
  const expected = process.env.APP_PIN || "";
  if (!expected) return false;
  const a = Buffer.from(pin);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
