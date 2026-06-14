import { NextResponse } from "next/server";
import { clearDemoSession } from "@/lib/auth/demo-auth";

export async function POST() {
  await clearDemoSession();
  return NextResponse.json({ ok: true });
}
