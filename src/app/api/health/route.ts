import { prisma } from "@/lib/db";
import { validateCoreEnvironment, validateEnvironment, validateLiveIntegrations } from "@/lib/env/validation";

export async function GET() {
  const env = validateEnvironment();
  const core = validateCoreEnvironment();
  const integrations = validateLiveIntegrations();
  const startedAt = Date.now();

  let dbOk = false;
  let dbLatencyMs = 0;
  let dbError: string | null = null;

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
    dbLatencyMs = Date.now() - startedAt;
  } catch (error) {
    dbOk = false;
    dbLatencyMs = Date.now() - startedAt;
    dbError = error instanceof Error ? error.message : "Unknown database error";
  }

  const healthy = core.ok && dbOk;

  return Response.json(
    {
      status: healthy ? (integrations.ok ? "ok" : "degraded") : "unhealthy",
      service: "neural-ops",
      timestamp: new Date().toISOString(),
      checks: {
        environment: {
          ok: core.ok,
          missing: core.missing,
          invalid: core.invalid,
        },
        integrations: {
          ok: integrations.ok,
          missing: integrations.missing,
        },
        database: {
          ok: dbOk,
          latencyMs: dbLatencyMs,
          error: dbError,
        },
      },
      warnings: env.optionalWarnings,
    },
    { status: healthy ? 200 : 503 }
  );
}
