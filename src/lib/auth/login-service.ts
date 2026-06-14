import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { createSupabaseAdmin } from "@/lib/supabase/client";
import { writeAuthSession, type AuthSessionCookie } from "./session-cookie";

export interface LoginResult {
  session: AuthSessionCookie;
  organization: { id: string; name: string; slug: string };
}

export async function authenticateWithEmailPassword(email: string, password: string): Promise<LoginResult> {
  const normalizedEmail = email.trim().toLowerCase();

  const dbUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: { organization: true },
  });
  if (!dbUser || !dbUser.organizationId) {
    throw new Error("Invalid email or password.");
  }

  const supabase = createSupabaseAdmin();
  if (!supabase) {
    throw new Error("Authentication service is not configured.");
  }

  let authResult = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
  if (authResult.error) {
    const createResult = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: { name: dbUser.name, role: dbUser.role },
    });
    if (createResult.error && !createResult.error.message.toLowerCase().includes("already")) {
      throw new Error("Invalid email or password.");
    }
    if (createResult.error && createResult.error.message.toLowerCase().includes("already")) {
      await reconcileExistingSupabaseUserPassword({
        email: normalizedEmail,
        password,
        name: dbUser.name,
        role: dbUser.role,
      });
    }
    authResult = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
    if (authResult.error || !authResult.data.session) {
      throw new Error("Invalid email or password.");
    }
  }

  const session = authResult.data.session;
  if (!session) throw new Error("Invalid email or password.");

  if (!dbUser.authId) {
    await prisma.user.update({
      where: { id: dbUser.id },
      data: { authId: session.user.id },
    });
  }

  const organization = dbUser.organization ?? (await prisma.organization.findUnique({ where: { id: dbUser.organizationId } }));
  if (!organization) throw new Error("Organization is not configured for this user.");

  const authSession: AuthSessionCookie = {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    userId: dbUser.id,
    email: dbUser.email,
    name: dbUser.name,
    role: dbUser.role,
    organizationId: organization.id,
  };

  await writeAuthSession(authSession);
  return {
    session: authSession,
    organization: { id: organization.id, name: organization.name, slug: organization.slug },
  };
}

export function isAllowedRole(role: string): role is UserRole {
  return ["admin", "analyst", "compliance_manager", "legal_counsel", "risk_officer", "executive"].includes(role);
}

interface ReconcileInput {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

async function reconcileExistingSupabaseUserPassword(input: ReconcileInput) {
  if (process.env.NODE_ENV === "production" && process.env.AUTH_DEV_MODE !== "true") {
    return;
  }

  const supabase = createSupabaseAdmin();
  if (!supabase) return;

  const existing = await findSupabaseUserByEmail(supabase, input.email);
  if (!existing?.id) return;

  await supabase.auth.admin.updateUserById(existing.id, {
    password: input.password,
    email_confirm: true,
    user_metadata: { name: input.name, role: input.role },
  });
}

async function findSupabaseUserByEmail(
  supabase: NonNullable<ReturnType<typeof createSupabaseAdmin>>,
  email: string
) {
  let page = 1;
  const perPage = 200;
  while (page <= 10) {
    const result = await supabase.auth.admin.listUsers({ page, perPage });
    if (result.error) return null;
    const user = result.data.users.find((candidate) => candidate.email?.toLowerCase() === email);
    if (user) return user;
    if (result.data.users.length < perPage) break;
    page += 1;
  }
  return null;
}
