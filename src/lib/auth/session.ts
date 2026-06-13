import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export async function getAuthUser(request: Request): Promise<AuthUser | null> {
  const devMode = process.env.AUTH_DEV_MODE === "true";

  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const user = await resolveSupabaseUser(token);
    if (user) return user;
  }

  if (devMode) {
    const userId = request.headers.get("x-user-id") ?? process.env.DEV_USER_ID;
    const role = (request.headers.get("x-user-role") ?? process.env.DEV_USER_ROLE ?? "analyst") as UserRole;

    if (userId) {
      const dbUser = await prisma.user.findUnique({ where: { id: userId } });
      if (dbUser) {
        return { id: dbUser.id, email: dbUser.email, name: dbUser.name, role: dbUser.role };
      }
    }

    const email = "dev@neural-ops.local";
    let dbUser = await prisma.user.findUnique({ where: { email } });
    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: { name: "Dev Analyst", email, role: role ?? "analyst" },
      });
    }
    return { id: dbUser.id, email: dbUser.email, name: dbUser.name, role: dbUser.role };
  }

  return null;
}

async function resolveSupabaseUser(token: string): Promise<AuthUser | null> {
  const { createSupabaseAdmin } = await import("@/lib/supabase/client");
  const supabase = createSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;

  const dbUser = await prisma.user.findFirst({
    where: { authId: data.user.id },
  });

  if (!dbUser) return null;
  return { id: dbUser.id, email: dbUser.email, name: dbUser.name, role: dbUser.role };
}
