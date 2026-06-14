import { prisma } from "@/lib/db";
import { validateEnvironment } from "@/lib/env/validation";

export async function GET() {
  const env = validateEnvironment();
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

  const healthy = env.ok && dbOk;

  return Response.json(
    {
      status: healthy ? "ok" : "degraded",
      service: "neural-ops",
      timestamp: new Date().toISOString(),
      checks: {
        environment: {
          ok: env.required.ok,
          missing: env.required.missing,
          invalid: env.required.invalid,
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
