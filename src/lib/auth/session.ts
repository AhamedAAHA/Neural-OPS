import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ORGANIZATION_COOKIE_NAME } from "./constants";
import { readAuthSession } from "./session-cookie";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organizationId: string;
}

export async function getAuthUser(request: Request): Promise<AuthUser | null> {
  const requestOrgId = request.headers.get("x-organization-id") ?? undefined;

  const authSession = await readAuthSession();
  if (authSession) {
    const role = authSession.role as UserRole;
    return {
      id: authSession.userId,
      email: authSession.email,
      name: authSession.name,
      role,
      organizationId: requestOrgId ?? authSession.organizationId,
    };
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const user = await resolveSupabaseUser(token, requestOrgId);
    if (user) return user;
  }

  return null;
}

async function resolveSupabaseUser(token: string, requestOrgId?: string): Promise<AuthUser | null> {
  const { createSupabaseAdmin } = await import("@/lib/supabase/client");
  const supabase = createSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;

  const dbUser = await prisma.user.findFirst({
    where: { authId: data.user.id },
  });

  if (!dbUser || !dbUser.organizationId) return null;
  if (requestOrgId && requestOrgId !== dbUser.organizationId && dbUser.role !== "admin") return null;
  return {
    id: dbUser.id,
    email: dbUser.email,
    name: dbUser.name,
    role: dbUser.role,
    organizationId: requestOrgId ?? dbUser.organizationId,
  };
}

export function getOrganizationFromRequest(request: Request): string | null {
  const headerOrg = request.headers.get("x-organization-id");
  if (headerOrg) return headerOrg;

  const cookieHeader = request.headers.get("cookie") ?? "";
  const parts = cookieHeader.split(";").map((part) => part.trim());
  const found = parts.find((part) => part.startsWith(`${ORGANIZATION_COOKIE_NAME}=`));
  if (!found) return null;
  return decodeURIComponent(found.split("=")[1] ?? "");
}
