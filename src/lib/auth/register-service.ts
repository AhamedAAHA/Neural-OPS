import { prisma } from "@/lib/db";
import { createSupabaseAdmin } from "@/lib/supabase/client";
import { writeAuthSession, type AuthSessionCookie } from "./session-cookie";
import type { LoginResult } from "./login-service";

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

async function uniqueOrgSlug(base: string) {
  const root = slugify(base) || "workspace";
  let candidate = root;
  let suffix = 1;
  while (await prisma.organization.findUnique({ where: { slug: candidate } })) {
    candidate = `${root}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

export async function registerWithEmailPassword(input: RegisterInput): Promise<LoginResult> {
  const name = input.name.trim();
  const normalizedEmail = normalizeEmail(input.email);
  const password = input.password;

  if (!name) throw new Error("Full name is required.");
  if (!normalizedEmail) throw new Error("Email is required.");
  if (password.length < 8) throw new Error("Password must be at least 8 characters.");

  const supabase = createSupabaseAdmin();
  if (!supabase) {
    throw new Error("Authentication service is not configured.");
  }

  const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existingUser) {
    throw new Error("An account with this email already exists. Sign in instead.");
  }

  const orgSlug = await uniqueOrgSlug(name);
  const organization = await prisma.organization.create({
    data: {
      name: `${name}'s Workspace`,
      slug: orgSlug,
    },
  });

  const dbUser = await prisma.user.create({
    data: {
      name,
      email: normalizedEmail,
      role: "admin",
      organizationId: organization.id,
    },
  });

  const createResult = await supabase.auth.admin.createUser({
    email: normalizedEmail,
    password,
    email_confirm: true,
    user_metadata: {
      name,
      role: dbUser.role,
      organizationId: organization.id,
      prismaUserId: dbUser.id,
    },
  });

  if (createResult.error) {
    await prisma.user.delete({ where: { id: dbUser.id } }).catch(() => {});
    await prisma.organization.delete({ where: { id: organization.id } }).catch(() => {});

    const message = createResult.error.message.toLowerCase();
    if (message.includes("already")) {
      throw new Error("An account with this email already exists. Sign in instead.");
    }
    throw new Error(createResult.error.message);
  }

  const authUserId = createResult.data.user.id;
  await prisma.user.update({
    where: { id: dbUser.id },
    data: { authId: authUserId },
  });

  const authResult = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });
  if (authResult.error || !authResult.data.session) {
    throw new Error(authResult.error?.message ?? "Account created but sign-in failed. Try signing in.");
  }

  const session = authResult.data.session;
  const authSession: AuthSessionCookie = {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    userId: dbUser.id,
    email: normalizedEmail,
    name,
    role: dbUser.role,
    organizationId: organization.id,
  };

  await writeAuthSession(authSession);
  return {
    session: authSession,
    organization: { id: organization.id, name: organization.name, slug: organization.slug },
  };
}
