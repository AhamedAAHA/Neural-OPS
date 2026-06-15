import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { createSupabaseAdmin } from "@/lib/supabase/client";
import { writeAuthSession, type AuthSessionCookie } from "./session-cookie";

export interface LoginResult {
  session: AuthSessionCookie;
  organization: { id: string; name: string; slug: string };
}

interface SupabaseUserMetadata {
  name?: string;
  role?: string;
  organizationId?: string;
  prismaUserId?: string;
}

function readMetadata(value: unknown): SupabaseUserMetadata {
  if (!value || typeof value !== "object") return {};
  return value as SupabaseUserMetadata;
}

async function lookupDbUser(email: string) {
  try {
    return await prisma.user.findUnique({
      where: { email },
      include: { organization: true },
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[auth] Failed to load user from database:", error);
    }
    return null;
  }
}

async function lookupOrganization(organizationId: string) {
  try {
    return await prisma.organization.findUnique({ where: { id: organizationId } });
  } catch {
    return null;
  }
}

export async function authenticateWithEmailPassword(email: string, password: string): Promise<LoginResult> {
  const normalizedEmail = email.trim().toLowerCase();

  const supabase = createSupabaseAdmin();
  if (!supabase) {
    throw new Error("Authentication service is not configured.");
  }

  let dbUser = await lookupDbUser(normalizedEmail);

  let authResult = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
  if (authResult.error) {
    if (!dbUser || !dbUser.organizationId) {
      throw new Error("Invalid email or password.");
    }

    const createResult = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: {
        name: dbUser.name,
        role: dbUser.role,
        organizationId: dbUser.organizationId,
        prismaUserId: dbUser.id,
      },
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
        organizationId: dbUser.organizationId,
        prismaUserId: dbUser.id,
      });
    }
    authResult = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
    if (authResult.error || !authResult.data.session) {
      throw new Error("Invalid email or password.");
    }
  }

  const session = authResult.data.session;
  if (!session) throw new Error("Invalid email or password.");

  const metadata = readMetadata(session.user.user_metadata);

  if (!dbUser) {
    dbUser = await lookupDbUser(normalizedEmail);
  }

  const organizationId = dbUser?.organizationId ?? metadata.organizationId;
  if (!organizationId) {
    throw new Error("Invalid email or password.");
  }

  const role = dbUser?.role ?? (isAllowedRole(metadata.role ?? "") ? metadata.role : "analyst");
  const name = dbUser?.name ?? metadata.name ?? "User";
  const userId = dbUser?.id ?? metadata.prismaUserId ?? session.user.id;

  if (dbUser && !dbUser.authId) {
    try {
      await prisma.user.update({
        where: { id: dbUser.id },
        data: { authId: session.user.id },
      });
    } catch {
      // Ignore when Prisma is unavailable in edge runtime.
    }
  }

  const organization =
    dbUser?.organization ??
    (await lookupOrganization(organizationId)) ?? {
      id: organizationId,
      name: "Organization",
      slug: "organization",
    };

  const authSession: AuthSessionCookie = {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    userId,
    email: normalizedEmail,
    name,
    role: role as UserRole,
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
  organizationId: string;
  prismaUserId: string;
}

async function reconcileExistingSupabaseUserPassword(input: ReconcileInput) {
  const supabase = createSupabaseAdmin();
  if (!supabase) return;

  const existing = await findSupabaseUserByEmail(supabase, input.email);
  if (!existing?.id) return;

  await supabase.auth.admin.updateUserById(existing.id, {
    password: input.password,
    email_confirm: true,
    user_metadata: {
      name: input.name,
      role: input.role,
      organizationId: input.organizationId,
      prismaUserId: input.prismaUserId,
    },
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
