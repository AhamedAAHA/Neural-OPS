import { NextResponse } from "next/server";
import { clearAuthSession } from "@/lib/auth/session-cookie";
import { cookies } from "next/headers";
import { ORGANIZATION_COOKIE_NAME } from "@/lib/auth/constants";

export async function POST() {
  await clearAuthSession();
  const cookieStore = await cookies();
  cookieStore.delete(ORGANIZATION_COOKIE_NAME);
  return NextResponse.json({ ok: true });
}
