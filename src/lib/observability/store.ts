import { PrismaClient, type ObservabilityLevel, type ObservabilitySource, type ServiceHealthStatus } from "@prisma/client";

function ensureDatabaseSchemaForObservability() {
  const baseUrl = process.env.DATABASE_URL ?? process.env.DIRECT_URL;
  if (!baseUrl) return;
  try {
    const parsed = new URL(baseUrl);
    if (!parsed.searchParams.get("schema")) {
      parsed.searchParams.set("schema", "neural_ops");
    }
    if (parsed.searchParams.get("pgbouncer") === "true" && !parsed.searchParams.get("connection_limit")) {
      parsed.searchParams.set("connection_limit", "1");
    }
    if (!parsed.searchParams.get("pool_timeout")) {
      parsed.searchParams.set("pool_timeout", "30");
    }
    process.env.DATABASE_URL = parsed.toString();
  } catch {
    process.env.DATABASE_URL = baseUrl;
  }
}

ensureDatabaseSchemaForObservability();

const globalForObservability = globalThis as unknown as { observabilityPrisma?: PrismaClient };
const observabilityPrisma =
  globalForObservability.observabilityPrisma ??
  new PrismaClient();
if (process.env.NODE_ENV !== "production") {
  globalForObservability.observabilityPrisma = observabilityPrisma;
}

interface ApiMetricInput {
  organizationId?: string;
  incidentId?: string;
  userId?: string;
  route: string;
  method: string;
  statusCode: number;
  durationMs: number;
  errorMessage?: string;
}

interface MonitoringEventInput {
  organizationId?: string;
  incidentId?: string;
  source: ObservabilitySource;
  level?: ObservabilityLevel;
  operation: string;
  status?: string;
  durationMs?: number;
  message?: string;
  details?: Record<string, unknown>;
}

interface ServiceHealthInput {
  organizationId?: string;
  service: string;
  status: ServiceHealthStatus;
  responseTimeMs?: number;
  errorRatePct?: number;
  activeConnections?: number;
  activeUsers?: number;
  details?: Record<string, unknown>;
}

export async function recordApiMetric(input: ApiMetricInput) {
  let organizationId = input.organizationId;
  if (!organizationId && input.incidentId) {
    const incident = await observabilityPrisma.incident.findUnique({
      where: { id: input.incidentId },
      select: { organizationId: true },
    });
    organizationId = incident?.organizationId ?? undefined;
  }

  await observabilityPrisma.apiRequestMetric.create({
    data: {
      organizationId,
      incidentId: input.incidentId,
      userId: input.userId,
      route: input.route,
      method: input.method,
      statusCode: input.statusCode,
      durationMs: input.durationMs,
      errorMessage: input.errorMessage,
    },
  });
}

export async function recordMonitoringEvent(input: MonitoringEventInput) {
  let organizationId = input.organizationId;
  if (!organizationId && input.incidentId) {
    const incident = await observabilityPrisma.incident.findUnique({
      where: { id: input.incidentId },
      select: { organizationId: true },
    });
    organizationId = incident?.organizationId ?? undefined;
  }

  await observabilityPrisma.monitoringEvent.create({
    data: {
      organizationId,
      incidentId: input.incidentId,
      source: input.source,
      level: input.level ?? "info",
      operation: input.operation,
      status: input.status ?? "ok",
      durationMs: input.durationMs,
      message: input.message,
      detailsJson: (input.details ?? {}) as object,
    },
  });
}

export async function recordServiceHealthCheck(input: ServiceHealthInput) {
  await observabilityPrisma.serviceHealthCheck.create({
    data: {
      organizationId: input.organizationId,
      service: input.service,
      status: input.status,
      responseTimeMs: input.responseTimeMs,
      errorRatePct: input.errorRatePct,
      activeConnections: input.activeConnections,
      activeUsers: input.activeUsers,
      detailsJson: (input.details ?? {}) as object,
    },
  });
}

export async function touchUserActivity(input: { organizationId?: string; userId: string; path?: string }) {
  if (!input.organizationId) return;
  await observabilityPrisma.userActivity.upsert({
    where: {
      organizationId_userId: {
        organizationId: input.organizationId,
        userId: input.userId,
      },
    },
    update: {
      path: input.path,
      lastSeenAt: new Date(),
    },
    create: {
      organizationId: input.organizationId,
      userId: input.userId,
      path: input.path,
      lastSeenAt: new Date(),
    },
  });
}

function avg(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function statusFromErrorRate(errorRate: number, responseTime: number): ServiceHealthStatus {
  if (errorRate >= 10 || responseTime >= 3000) return "down";
  if (errorRate >= 2 || responseTime >= 1200) return "degraded";
  return "healthy";
}

export async function getOperationsDashboardSnapshot(organizationId: string) {
  const now = Date.now();
  const window15m = new Date(now - 15 * 60_000);
  const window5m = new Date(now - 5 * 60_000);

  const [
    apiMetrics,
    monitoringEvents,
    activeInvestigations,
    activeUsers,
    bandRooms,
  ] = await Promise.all([
    observabilityPrisma.apiRequestMetric.findMany({
      where: { organizationId, createdAt: { gte: window15m } },
      orderBy: { createdAt: "desc" },
      take: 1000,
    }),
    observabilityPrisma.monitoringEvent.findMany({
      where: { organizationId, createdAt: { gte: window15m } },
      orderBy: { createdAt: "desc" },
      take: 1500,
    }),
    observabilityPrisma.incident.count({
      where: {
        organizationId,
        status: { in: ["open", "investigating", "pending_approval", "escalated", "contained"] },
      },
    }),
    observabilityPrisma.userActivity.count({
      where: {
        organizationId,
        lastSeenAt: { gte: window5m },
      },
    }),
    observabilityPrisma.bandRoom.findMany({
      where: { organizationId, status: { not: "closed" } },
      select: { connectedAgents: true, messageCount: true, lastActivityAt: true },
    }),
  ]);

  const apiErrorCount = apiMetrics.filter((metric) => metric.statusCode >= 500).length;
  const apiErrorRate = apiMetrics.length ? (apiErrorCount / apiMetrics.length) * 100 : 0;
  const apiResponseTime = avg(apiMetrics.map((metric) => metric.durationMs));
  const apiHealth = apiMetrics.length
    ? statusFromErrorRate(apiErrorRate, apiResponseTime)
    : "degraded";

  const sourceStats = {
    AGENT: monitoringEvents.filter((event) => event.source === "AGENT"),
    DATABASE: monitoringEvents.filter((event) => event.source === "DATABASE"),
    BRIGHT_DATA: monitoringEvents.filter((event) => event.source === "BRIGHT_DATA"),
    BAND: monitoringEvents.filter((event) => event.source === "BAND"),
    SPEECHMATICS: monitoringEvents.filter((event) => event.source === "SPEECHMATICS"),
    REALTIME: monitoringEvents.filter((event) => event.source === "REALTIME"),
  };

  const computeService = (events: typeof monitoringEvents) => {
    if (!events.length) {
      return {
        total: 0,
        errorRate: 0,
        latency: 0,
        status: "degraded" as ServiceHealthStatus,
      };
    }
    const failures = events.filter((event) => event.level === "error" || event.status !== "ok").length;
    const errorRate = (failures / events.length) * 100;
    const measuredDurations = events.map((event) => event.durationMs ?? 0).filter((value) => value > 0);
    const latency = avg(measuredDurations);
    const hasMeasuredLatency = measuredDurations.length > 0;
    return {
      total: events.length,
      errorRate,
      latency,
      status: hasMeasuredLatency || failures > 0
        ? statusFromErrorRate(errorRate, latency)
        : ("degraded" as ServiceHealthStatus),
    };
  };

  const agentHealth = computeService(sourceStats.AGENT);
  const databaseHealth = computeService(sourceStats.DATABASE);
  const brightDataHealth = computeService(sourceStats.BRIGHT_DATA);
  const bandHealth = computeService(sourceStats.BAND);
  const speechmaticsHealth = computeService(sourceStats.SPEECHMATICS);
  const realtimeHealth = computeService(sourceStats.REALTIME);

  const realtimeConnections = bandRooms.reduce((sum, room) => sum + room.connectedAgents, 0);

  const payload = {
    generatedAt: new Date().toISOString(),
    api: {
      health: apiHealth,
      requests: apiMetrics.length,
      errorRate: Number(apiErrorRate.toFixed(2)),
      responseTimeMs: Number(apiResponseTime.toFixed(2)),
    },
    services: {
      agent: agentHealth,
      database: databaseHealth,
      brightData: brightDataHealth,
      band: bandHealth,
      speechmatics: speechmaticsHealth,
      realtime: {
        ...realtimeHealth,
        activeConnections: realtimeConnections,
      },
    },
    investigations: {
      active: activeInvestigations,
    },
    users: {
      active: activeUsers,
    },
    metrics: {
      errorRate: Number(apiErrorRate.toFixed(2)),
      responseTimeMs: Number(apiResponseTime.toFixed(2)),
      activeInvestigations,
      activeUsers,
      realtimeConnections,
    },
    latestEvents: monitoringEvents.slice(0, 20).map((event) => ({
      id: event.id,
      source: event.source,
      level: event.level,
      operation: event.operation,
      status: event.status,
      durationMs: event.durationMs,
      message: event.message,
      createdAt: event.createdAt.toISOString(),
    })),
  };

  await Promise.all([
    recordServiceHealthCheck({
      organizationId,
      service: "API",
      status: apiHealth,
      responseTimeMs: Math.round(apiResponseTime),
      errorRatePct: Number(apiErrorRate.toFixed(2)),
      activeUsers,
      details: {
        requests: apiMetrics.length,
        telemetryWindowMinutes: 15,
      },
    }),
    recordServiceHealthCheck({
      organizationId,
      service: "DATABASE",
      status: databaseHealth.status,
      responseTimeMs: Math.round(databaseHealth.latency || 0),
      errorRatePct: Number(databaseHealth.errorRate.toFixed(2)),
    }),
    recordServiceHealthCheck({
      organizationId,
      service: "AGENT",
      status: agentHealth.status,
      responseTimeMs: Math.round(agentHealth.latency || 0),
      errorRatePct: Number(agentHealth.errorRate.toFixed(2)),
    }),
    recordServiceHealthCheck({
      organizationId,
      service: "BAND",
      status: bandHealth.status,
      responseTimeMs: Math.round(bandHealth.latency || 0),
      errorRatePct: Number(bandHealth.errorRate.toFixed(2)),
      activeConnections: realtimeConnections,
    }),
    recordServiceHealthCheck({
      organizationId,
      service: "SPEECHMATICS",
      status: speechmaticsHealth.status,
      responseTimeMs: Math.round(speechmaticsHealth.latency || 0),
      errorRatePct: Number(speechmaticsHealth.errorRate.toFixed(2)),
    }),
    recordServiceHealthCheck({
      organizationId,
      service: "BRIGHT_DATA",
      status: brightDataHealth.status,
      responseTimeMs: Math.round(brightDataHealth.latency || 0),
      errorRatePct: Number(brightDataHealth.errorRate.toFixed(2)),
    }),
    recordServiceHealthCheck({
      organizationId,
      service: "REALTIME",
      status: realtimeHealth.status,
      responseTimeMs: Math.round(realtimeHealth.latency || 0),
      errorRatePct: Number(realtimeHealth.errorRate.toFixed(2)),
      activeConnections: realtimeConnections,
    }),
  ]);

  return payload;
}
