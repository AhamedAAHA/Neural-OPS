import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { ORGANIZATION_COOKIE_NAME } from "@/lib/auth/constants";
import { registerWithEmailPassword } from "@/lib/auth/register-service";
import { recordApiMetric, recordMonitoringEvent } from "@/lib/observability/store";
import { withSpan } from "@/lib/observability/tracing";

const REGISTER_RATE_LIMIT = Number(process.env.AUTH_REGISTER_RATE_LIMIT ?? "500");
const REGISTER_RATE_WINDOW_MS = Number(process.env.AUTH_REGISTER_RATE_WINDOW_MS ?? "3600000");

const registerSchema = z.object({
  name: z.string().trim().min(1, "Full name is required."),
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export async function POST(request: Request) {
  const started = Date.now();
  const route = "/api/auth/register";
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (checkRateLimit(`auth:register:${ip}`, REGISTER_RATE_LIMIT, REGISTER_RATE_WINDOW_MS)) {
    void recordApiMetric({
      route,
      method: "POST",
      statusCode: 429,
      durationMs: Date.now() - started,
      errorMessage: "rate_limited",
    }).catch(() => {});
    return NextResponse.json(
      { ok: false, error: "Too many registration attempts. Try again shortly.", route },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid registration payload.";
    void recordApiMetric({
      route,
      method: "POST",
      statusCode: 400,
      durationMs: Date.now() - started,
      errorMessage: "invalid_payload",
    }).catch(() => {});
    return NextResponse.json({ ok: false, error: message, route }, { status: 400 });
  }

  try {
    const result = await registerWithEmailPassword(parsed.data);
    const cookieStore = await cookies();
    cookieStore.set(ORGANIZATION_COOKIE_NAME, result.organization.id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    const response = await withSpan("auth.register", { "http.route": route }, async () =>
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
      operation: "auth.register",
      durationMs: Date.now() - started,
    }).catch(() => {});
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration failed.";
    void recordApiMetric({
      route,
      method: "POST",
      statusCode: 400,
      durationMs: Date.now() - started,
      errorMessage: message,
    }).catch(() => {});
    return NextResponse.json({ ok: false, error: message, route }, { status: 400 });
  }
}
