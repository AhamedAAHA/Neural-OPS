import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { ok: false, error: "One-time login codes are disabled. Use email and password.", route: "/api/auth/verify-code" },
    { status: 410 }
  );
}
