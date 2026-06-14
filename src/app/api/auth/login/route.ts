import { NextResponse } from "next/server";
import { writeDemoSession } from "@/lib/auth/demo-auth";

const DEMO_EMAIL = process.env.DEMO_LOGIN_EMAIL ?? "admin@neural-ops.ai";
const DEMO_PASSWORD = process.env.DEMO_LOGIN_PASSWORD ?? "Neural@2026";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { email?: string; password?: string } | null;
  const email = body?.email?.trim().toLowerCase() ?? "";
  const password = body?.password ?? "";

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  if (email !== DEMO_EMAIL.toLowerCase() || password !== DEMO_PASSWORD) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  await writeDemoSession({
    email,
    name: "Incident Commander",
    role: "admin",
    method: "password",
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}
