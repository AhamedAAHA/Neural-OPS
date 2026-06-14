import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ORGANIZATION_COOKIE_NAME } from "@/lib/auth/constants";
import { getAuthUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { organizationId?: string } | null;
  const organizationId = body?.organizationId;

  if (!organizationId) {
    return NextResponse.json({ error: "organizationId is required." }, { status: 400 });
  }

  let organization: { id: string; name: string } | null = null;
  const dbOrg = await prisma.organization.findUnique({ where: { id: organizationId } });
  if (dbOrg) organization = { id: dbOrg.id, name: dbOrg.name };
  if (!organization) return NextResponse.json({ error: "Organization not found." }, { status: 404 });

  if (user.role !== "admin" && organizationId !== user.organizationId) {
    return NextResponse.json({ error: "Forbidden organization switch." }, { status: 403 });
  }

  const cookieStore = await cookies();
  cookieStore.set(ORGANIZATION_COOKIE_NAME, organizationId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return NextResponse.json({ ok: true, organizationId, organizationName: organization.name });
}
