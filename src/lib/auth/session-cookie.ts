import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "./constants";

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export interface AuthSessionCookie {
  accessToken: string;
  refreshToken: string;
  userId: string;
  email: string;
  name: string;
  role: string;
  organizationId: string;
}

interface StoredSession extends AuthSessionCookie {
  exp: number;
}

function encodeSession(session: StoredSession) {
  return Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
}

function decodeSession(raw: string): StoredSession | null {
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as StoredSession;
    if (!parsed.accessToken || !parsed.userId || !parsed.organizationId || !parsed.exp) return null;
    if (Date.now() > parsed.exp) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function writeAuthSession(session: AuthSessionCookie) {
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

export async function clearAuthSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function readAuthSession(): Promise<AuthSessionCookie | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!raw) return null;
  const parsed = decodeSession(raw);
  if (!parsed) return null;
  return {
    accessToken: parsed.accessToken,
    refreshToken: parsed.refreshToken,
    userId: parsed.userId,
    email: parsed.email,
    name: parsed.name,
    role: parsed.role,
    organizationId: parsed.organizationId,
  };
}

export function getSessionCookieName() {
  return SESSION_COOKIE_NAME;
}
