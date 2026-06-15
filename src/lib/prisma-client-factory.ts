import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Prisma } from "@prisma/client";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prismaPool?: Pool;
  prismaClient?: PrismaClient;
};

export function resolveDatabaseUrl() {
  const baseUrl =
    process.env.NODE_ENV === "development" && process.env.DIRECT_URL
      ? process.env.DIRECT_URL
      : (process.env.DATABASE_URL ?? process.env.DIRECT_URL);
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
    return parsed.toString();
  } catch {
    return baseUrl;
  }
}

export function createPrismaClient(
  log: Array<Prisma.LogLevel | Prisma.LogDefinition> = ["error"]
) {
  if (globalForPrisma.prismaClient) {
    return globalForPrisma.prismaClient;
  }

  const connectionString = resolveDatabaseUrl();
  if (!connectionString) {
    throw new Error("DATABASE_URL or DIRECT_URL is required to initialize Prisma.");
  }

  process.env.DATABASE_URL = connectionString;

  const pool =
    globalForPrisma.prismaPool ??
    new Pool({
      connectionString,
      max: process.env.NODE_ENV === "development" ? 5 : 2,
      idleTimeoutMillis: 20_000,
      connectionTimeoutMillis: 10_000,
      maxUses: process.env.NODE_ENV === "production" ? 1 : undefined,
    });

  const adapter = new PrismaPg(pool);
  const client = new PrismaClient({ adapter, log });

  globalForPrisma.prismaPool = pool;
  globalForPrisma.prismaClient = client;

  return client;
}
