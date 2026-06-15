import { prisma } from "@/lib/db";
import { validateCoreEnvironment, validateEnvironment, validateLiveIntegrations } from "@/lib/env/validation";

export async function GET() {
  const env = validateEnvironment();
  const core = validateCoreEnvironment();
  const integrations = validateLiveIntegrations();
  const startedAt = Date.now();

  let database = { ok: false, latencyMs: 0, error: null as string | null };

  try {
    await prisma.$queryRaw`SELECT 1`;
    database = {
      ok: true,
      latencyMs: Date.now() - startedAt,
      error: null,
    };
  } catch (error) {
    database = {
      ok: false,
      latencyMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : "Database readiness check failed",
    };
  }

  const ready = core.ok && database.ok;

  return Response.json(
    {
      status: ready ? (integrations.ok ? "ready" : "ready_degraded") : "not_ready",
      timestamp: new Date().toISOString(),
      checks: {
        environment: env,
        core: {
          ok: core.ok,
          missing: core.missing,
          invalid: core.invalid,
        },
        integrations: {
          ok: integrations.ok,
          missing: integrations.missing,
        },
        database,
      },
    },
    { status: ready ? 200 : 503 }
  );
}
