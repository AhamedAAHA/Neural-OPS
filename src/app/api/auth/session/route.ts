import { NextResponse } from "next/server";
import { readAuthSession } from "@/lib/auth/session-cookie";
import { cookies } from "next/headers";
import { ORGANIZATION_COOKIE_NAME } from "@/lib/auth/constants";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await readAuthSession();
  if (!session) {
    return NextResponse.json({ ok: false, authenticated: false, error: "Not authenticated", route: "/api/auth/session" }, { status: 401 });
  }

  const cookieStore = await cookies();
  const activeOrganizationId = cookieStore.get(ORGANIZATION_COOKIE_NAME)?.value ?? session.organizationId ?? null;
  let organization: { id: string; name: string; slug: string } | null = null;
  if (activeOrganizationId) {
    const dbOrg = await prisma.organization.findUnique({ where: { id: activeOrganizationId } });
    organization = dbOrg ? { id: dbOrg.id, name: dbOrg.name, slug: dbOrg.slug } : null;
  }

  return NextResponse.json({
    ok: true,
    authenticated: true,
    user: {
      id: session.userId,
      email: session.email,
      name: session.name,
      role: session.role,
      organizationId: activeOrganizationId,
    },
    activeOrganizationId,
    organization,
  });
}
