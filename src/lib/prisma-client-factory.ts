import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Prisma } from "@prisma/client";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prismaPool?: Pool;
  prismaClient?: PrismaClient;
};

export function resolveDatabaseUrl() {
  const baseUrl = process.env.DATABASE_URL ?? process.env.DIRECT_URL;
  if (!baseUrl) return "";

  try {
    const parsed = new URL(baseUrl);
    if (!parsed.searchParams.get("schema")) {
      parsed.searchParams.set("schema", "neural_ops");
    }
    if (parsed.searchParams.get("pgbouncer") === "true" && !parsed.searchParams.get("connection_limit")) {
      parsed.searchParams.set("connection_limit", process.env.NODE_ENV === "development" ? "5" : "1");
    }
    if (!parsed.searchParams.get("pool_timeout")) {
      parsed.searchParams.set("pool_timeout", process.env.NODE_ENV === "development" ? "60" : "30");
    }

    const isSupabase = /supabase\.com/i.test(parsed.hostname);
    const relaxSsl =
      process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === "false" ||
      (process.env.NODE_ENV === "development" && isSupabase);

    if (relaxSsl) {
      parsed.searchParams.delete("sslmode");
      parsed.searchParams.set("uselibpqcompat", "true");
    }

    return parsed.toString();
  } catch {
    return baseUrl;
  }
}

function resolvePoolSsl(connectionString: string) {
  if (process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === "true") {
    return { rejectUnauthorized: true as const };
  }

  const isSupabase = /supabase\.com/i.test(connectionString);
  const relaxSsl =
    process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === "false" ||
    (process.env.NODE_ENV === "development" && isSupabase);

  if (relaxSsl) {
    return { rejectUnauthorized: false as const };
  }

  return isSupabase ? { rejectUnauthorized: true as const } : undefined;
}

export function createPrismaClient(
  log: Array<Prisma.LogLevel | Prisma.LogDefinition> = ["error"]
) {
  const connectionString = resolveDatabaseUrl();
  if (!connectionString) {
    throw new Error("DATABASE_URL or DIRECT_URL is required to initialize Prisma.");
  }

  const cacheKey = `${connectionString}:${process.env.DATABASE_SSL_REJECT_UNAUTHORIZED ?? "default"}`;
  const cached = globalForPrisma as typeof globalForPrisma & { prismaCacheKey?: string };

  if (cached.prismaClient && cached.prismaCacheKey === cacheKey) {
    return cached.prismaClient;
  }

  if (cached.prismaPool) {
    void cached.prismaPool.end().catch(() => {});
    cached.prismaPool = undefined;
    cached.prismaClient = undefined;
  }

  process.env.DATABASE_URL = connectionString;

  const pool = new Pool({
    connectionString,
    ssl: resolvePoolSsl(connectionString),
    max: process.env.NODE_ENV === "development" ? 5 : 2,
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 10_000,
    maxUses: process.env.NODE_ENV === "production" ? 1 : undefined,
  });

  const adapter = new PrismaPg(pool);
  const client = new PrismaClient({ adapter, log });

  cached.prismaPool = pool;
  cached.prismaClient = client;
  cached.prismaCacheKey = cacheKey;

  return client;
}
