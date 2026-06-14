import { prisma } from "@/lib/db";
import { validateEnvironment } from "@/lib/env/validation";

export async function GET() {
  const env = validateEnvironment();
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

  const ready = env.ok && database.ok;

  return Response.json(
    {
      status: ready ? "ready" : "not_ready",
      timestamp: new Date().toISOString(),
      checks: {
        environment: env,
        database,
      },
    },
    { status: ready ? 200 : 503 }
  );
}
