import { NextResponse } from "next/server";
import { writeDemoSession } from "@/lib/auth/demo-auth";

const DEMO_CODE = process.env.DEMO_LOGIN_CODE ?? process.env.DEMO_ONE_TIME_CODE ?? "732915";
const DEMO_EMAIL = process.env.DEMO_LOGIN_EMAIL ?? "admin@neural-ops.ai";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { email?: string; code?: string } | null;
  const email = body?.email?.trim().toLowerCase() ?? DEMO_EMAIL.toLowerCase();
  const code = body?.code?.trim() ?? "";

  if (!code) {
    return NextResponse.json({ error: "Login code is required." }, { status: 400 });
  }

  if (code !== DEMO_CODE) {
    return NextResponse.json({ error: "Invalid login code." }, { status: 401 });
  }

  await writeDemoSession({
    email,
    name: "Incident Commander",
    role: "admin",
    method: "otp",
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}
