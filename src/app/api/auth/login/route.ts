import { NextResponse } from "next/server";
import { authenticateWithEmailPassword } from "@/lib/auth/login-service";
import { cookies } from "next/headers";
import { ORGANIZATION_COOKIE_NAME } from "@/lib/auth/constants";
import { z } from "zod";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { recordApiMetric, recordMonitoringEvent } from "@/lib/observability/store";
import { withSpan } from "@/lib/observability/tracing";

const LOGIN_RATE_LIMIT = Number(process.env.AUTH_LOGIN_RATE_LIMIT ?? "500");
const LOGIN_RATE_WINDOW_MS = Number(process.env.AUTH_LOGIN_RATE_WINDOW_MS ?? "3600000");

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(request: Request) {
  const started = Date.now();
  const route = "/api/auth/login";
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (checkRateLimit(`auth:login:${ip}`, LOGIN_RATE_LIMIT, LOGIN_RATE_WINDOW_MS)) {
    void recordApiMetric({ route, method: "POST", statusCode: 429, durationMs: Date.now() - started, errorMessage: "rate_limited" }).catch(() => {});
    return NextResponse.json({ ok: false, error: "Too many login attempts. Try again shortly.", route }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    void recordApiMetric({ route, method: "POST", statusCode: 400, durationMs: Date.now() - started, errorMessage: "invalid_payload" }).catch(() => {});
    return NextResponse.json({ ok: false, error: "Invalid login payload.", route }, { status: 400 });
  }

  try {
    const result = await authenticateWithEmailPassword(parsed.data.email, parsed.data.password);
    const cookieStore = await cookies();
    cookieStore.set(ORGANIZATION_COOKIE_NAME, result.organization.id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    const response = await withSpan("auth.login", { "http.route": route }, async () =>
      NextResponse.json({ ok: true, organization: result.organization })
    );
    void recordApiMetric({
      organizationId: result.organization.id,
      route,
      method: "POST",
      statusCode: response.status,
      durationMs: Date.now() - started,
    }).catch(() => {});
    void recordMonitoringEvent({
      organizationId: result.organization.id,
      source: "API",
      operation: "auth.login",
      durationMs: Date.now() - started,
      details: { method: "password" },
    }).catch(() => {});
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed.";
    void recordApiMetric({ route, method: "POST", statusCode: 401, durationMs: Date.now() - started, errorMessage: message }).catch(() => {});
    return NextResponse.json({ ok: false, error: message, route }, { status: 401 });
  }
}
