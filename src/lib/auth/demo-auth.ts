import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "./constants";

const SESSION_TTL_SECONDS = 60 * 60 * 12;

export type DemoAuthMethod = "password" | "otp";

export interface DemoSession {
  email: string;
  name: string;
  role: string;
  method: DemoAuthMethod;
  createdAt: string;
}

interface CookieSession extends DemoSession {
  exp: number;
}

function encodeSession(session: CookieSession) {
  return Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
}

function decodeSession(raw: string): CookieSession | null {
  try {
    const json = Buffer.from(raw, "base64url").toString("utf8");
    const parsed = JSON.parse(json) as CookieSession;
    if (!parsed.email || !parsed.name || !parsed.role || !parsed.exp) return null;
    if (Date.now() > parsed.exp) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function writeDemoSession(session: DemoSession) {
  const exp = Date.now() + SESSION_TTL_SECONDS * 1000;
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, encodeSession({ ...session, exp }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearDemoSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function readDemoSession(): Promise<DemoSession | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!raw) return null;
  const parsed = decodeSession(raw);
  if (!parsed) return null;
  return {
    email: parsed.email,
    name: parsed.name,
    role: parsed.role,
    method: parsed.method,
    createdAt: parsed.createdAt,
  };
}

export function getSessionCookieName() {
  return SESSION_COOKIE_NAME;
}
