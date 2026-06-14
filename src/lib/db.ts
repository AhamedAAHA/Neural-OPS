import { Prisma, type PrismaClient } from "@prisma/client";
import { getTenantContext } from "@/lib/auth/tenant-context";
import { recordMonitoringEvent } from "@/lib/observability/store";
import { createPrismaClient, resolveDatabaseUrl } from "@/lib/prisma-client-factory";

function ensureDatabaseSchema() {
  const resolved = resolveDatabaseUrl();
  if (resolved) process.env.DATABASE_URL = resolved;
}

ensureDatabaseSchema();

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
const observeDbQueries = process.env.OBSERVE_DB_QUERIES === "true";
const prismaLog: Array<Prisma.LogLevel | Prisma.LogDefinition> = [
  ...(process.env.NODE_ENV === "development"
    ? (["error", "warn"] as Prisma.LogLevel[])
    : (["error"] as Prisma.LogLevel[])),
  ...(observeDbQueries ? ([{ emit: "event", level: "query" }] as Prisma.LogDefinition[]) : []),
];

const basePrisma =
  globalForPrisma.prisma ??
  createPrismaClient(prismaLog);

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = basePrisma;

if (observeDbQueries) {
  // Prisma type generation may not expose query events with dynamic log configs.
  (basePrisma as unknown as { $on: (event: "query", cb: (payload: { duration: number; query: string; target: string }) => void) => void }).$on("query", (event) => {
    if (event.duration < 30) return;
    void recordMonitoringEvent({
      source: "DATABASE",
      level: event.duration > 1500 ? "warning" : "info",
      operation: "prisma.query",
      status: "ok",
      durationMs: event.duration,
      message: event.query.slice(0, 160),
      details: {
        target: event.target,
        durationMs: event.duration,
      },
    }).catch(() => {});
  });
}

function withOrgScope(args: Record<string, unknown> | undefined, organizationId: string) {
  const where = (args?.where as Record<string, unknown> | undefined) ?? {};
  return {
    ...(args ?? {}),
    where: { AND: [where, { organizationId }] },
  } as Record<string, unknown>;
}

function withOrgData(args: Record<string, unknown> | undefined, organizationId: string) {
  const data = (args?.data as Record<string, unknown> | undefined) ?? {};
  return {
    ...(args ?? {}),
    data: { organizationId, ...data },
  } as Record<string, unknown>;
}

const TENANT_MODELS = [
  "organization",
  "user",
  "incident",
  "document",
  "vendor",
  "vendorIntelligence",
  "approval",
  "auditLog",
  "bandRoom",
  "workflowDefinition",
  "workflowExecution",
  "boardIntelligenceReport",
  "apiRequestMetric",
  "monitoringEvent",
  "serviceHealthCheck",
  "userActivity",
] as const;

export const prisma = basePrisma.$extends({
  query: Object.fromEntries(
    TENANT_MODELS.map((model) => [
      model,
      {
        async findMany({ args, query }: { args: Record<string, unknown>; query: (args: Record<string, unknown>) => unknown }) {
          const tenant = getTenantContext();
          if (!tenant || model === "organization") return query(args);
          return query(withOrgScope(args, tenant.organizationId));
        },
        async findFirst({ args, query }: { args: Record<string, unknown>; query: (args: Record<string, unknown>) => unknown }) {
          const tenant = getTenantContext();
          if (!tenant || model === "organization") return query(args);
          return query(withOrgScope(args, tenant.organizationId));
        },
        async count({ args, query }: { args: Record<string, unknown>; query: (args: Record<string, unknown>) => unknown }) {
          const tenant = getTenantContext();
          if (!tenant || model === "organization") return query(args);
          return query(withOrgScope(args, tenant.organizationId));
        },
        async create({ args, query }: { args: Record<string, unknown>; query: (args: Record<string, unknown>) => unknown }) {
          const tenant = getTenantContext();
          if (!tenant || model === "organization") return query(args);
          return query(withOrgData(args, tenant.organizationId));
        },
        async createMany({ args, query }: { args: Record<string, unknown>; query: (args: Record<string, unknown>) => unknown }) {
          const tenant = getTenantContext();
          if (!tenant || model === "organization") return query(args);
          const rawData = args.data;
          if (Array.isArray(rawData)) {
            return query({
              ...args,
              data: rawData.map((item) => ({ organizationId: tenant.organizationId, ...(item as Record<string, unknown>) })),
            });
          }
          return query({
            ...args,
            data: { organizationId: tenant.organizationId, ...(rawData as Record<string, unknown>) },
          });
        },
        async updateMany({ args, query }: { args: Record<string, unknown>; query: (args: Record<string, unknown>) => unknown }) {
          const tenant = getTenantContext();
          if (!tenant || model === "organization") return query(args);
          return query(withOrgScope(args, tenant.organizationId));
        },
        async deleteMany({ args, query }: { args: Record<string, unknown>; query: (args: Record<string, unknown>) => unknown }) {
          const tenant = getTenantContext();
          if (!tenant || model === "organization") return query(args);
          return query(withOrgScope(args, tenant.organizationId));
        },
        async findUnique({ args, query }: { args: Record<string, unknown>; query: (args: Record<string, unknown>) => unknown }) {
          const tenant = getTenantContext();
          const result = (await query(args)) as Record<string, unknown> | null;
          if (!tenant || model === "organization" || !result) return result;
          if (result.organizationId && result.organizationId !== tenant.organizationId) return null;
          return result;
        },
      },
    ])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) as any,
});

export default prisma;
