import { NextResponse } from "next/server";
import { readDemoSession } from "@/lib/auth/demo-auth";

export async function GET() {
  const session = await readDemoSession();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true, user: session });
}
