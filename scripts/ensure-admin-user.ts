/**
 * Ensure admin exists in Prisma and Supabase Auth.
 * Usage: ADMIN_PASSWORD='...' npx tsx scripts/ensure-admin-user.ts
 */
import { config } from "dotenv";
import path from "node:path";
import { createPrismaClient } from "../src/lib/prisma-client-factory";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

config({ path: path.resolve(process.cwd(), ".env.local") });
config({ path: path.resolve(process.cwd(), ".env") });

const email = (process.env.ADMIN_EMAIL ?? "admin@neural-ops.io").trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!password) {
  throw new Error("ADMIN_PASSWORD is required");
}
if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
}

const prisma = createPrismaClient();

async function findSupabaseUserByEmail(supabase: SupabaseClient, targetEmail: string) {
  let page = 1;
  while (page <= 10) {
    const result = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (result.error) throw result.error;
    const user = result.data.users.find((candidate) => candidate.email?.toLowerCase() === targetEmail);
    if (user) return user;
    if (result.data.users.length < 200) break;
    page += 1;
  }
  return null;
}

async function main() {
  let organization = await prisma.organization.findFirst({ orderBy: { createdAt: "asc" } });
  if (!organization) {
    organization = await prisma.organization.create({
      data: {
        name: "Acme Financial Group",
        slug: "acme-financial-group",
        industry: "Finance",
        country: "US",
      },
    });
    console.log("Created organization:", organization.slug);
  }

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        name: "Admin User",
        email,
        role: "admin",
        organizationId: organization.id,
      },
    });
    console.log("Created Prisma user:", email);
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        role: "admin",
        organizationId: organization.id,
      },
    });
    console.log("Updated Prisma user:", email);
  }

  const supabase = createClient(supabaseUrl!, serviceRoleKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const existingAuthUser = await findSupabaseUserByEmail(supabase, email);
  let authUserId = existingAuthUser?.id;

  if (existingAuthUser) {
    const updated = await supabase.auth.admin.updateUserById(existingAuthUser.id, {
      password,
      email_confirm: true,
      user_metadata: {
        name: user.name,
        role: user.role,
        organizationId: organization.id,
        prismaUserId: user.id,
      },
    });
    if (updated.error) throw updated.error;
    console.log("Updated Supabase auth password for:", email);
  } else {
    const created = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name: user.name,
        role: user.role,
        organizationId: organization.id,
        prismaUserId: user.id,
      },
    });
    if (created.error) throw created.error;
    authUserId = created.data.user.id;
    console.log("Created Supabase auth user:", email);
  }

  if (authUserId && user.authId !== authUserId) {
    await prisma.user.update({
      where: { id: user.id },
      data: { authId: authUserId },
    });
    console.log("Linked authId on Prisma user");
  }

  const verify = await supabase.auth.signInWithPassword({ email, password: password! });
  if (verify.error || !verify.data.session) {
    throw new Error(`Login verification failed: ${verify.error?.message ?? "no session"}`);
  }

  console.log("Verified sign-in for:", email);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
