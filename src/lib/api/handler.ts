import { checkRateLimit } from "@/lib/api/rate-limit";
import { getAuthUser, getOrganizationFromRequest, type AuthUser } from "@/lib/auth/session";
import {
  ApiForbiddenError,
  ApiNotFoundError,
  ApiUnauthorizedError,
  ApiValidationError,
  requirePermission,
  type Permission,
} from "@/lib/auth/rbac";
import { runWithTenantContext } from "@/lib/auth/tenant-context";
import { recordApiMetric, recordMonitoringEvent, touchUserActivity } from "@/lib/observability/store";
import { withSpan } from "@/lib/observability/tracing";

export type ApiHandler = (
  request: Request,
  context: { user: AuthUser; params: Record<string, string>; organizationId: string }
) => Promise<Response>;

export function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

function formatErrorPayload(message: string, route: string) {
  return { ok: false as const, error: message, route };
}

export function errorResponse(error: unknown, route = "unknown") {
  if (error instanceof ApiUnauthorizedError) return json(formatErrorPayload(error.message, route), 401);
  if (error instanceof ApiForbiddenError) return json(formatErrorPayload(error.message, route), 403);
  if (error instanceof ApiValidationError) return json(formatErrorPayload(error.message, route), 400);
  if (error instanceof ApiNotFoundError) return json(formatErrorPayload(error.message, route), 404);

  const message = error instanceof Error ? error.message : "Internal server error";
  console.error(`[API Error] ${route}:`, error);
  if (error instanceof Error && error.stack) {
    console.error(error.stack);
  }
  return json(formatErrorPayload(message, route), 500);
}

export function withAuth(
  permission: Permission | Permission[] | null,
  handler: ApiHandler,
  options?: { rateLimitKey?: string; rateLimitMax?: number }
) {
  return async (
    request: Request,
    context: { params: Promise<Record<string, string>> }
  ) => {
    try {
      const user = await getAuthUser(request);
      if (!user) throw new ApiUnauthorizedError();
      const requestedOrganizationId = getOrganizationFromRequest(request);
      if (requestedOrganizationId && requestedOrganizationId !== user.organizationId && user.role !== "admin") {
        throw new ApiForbiddenError("Organization mismatch for current user");
      }
      const organizationId = requestedOrganizationId ?? user.organizationId;
      if (!organizationId) throw new ApiForbiddenError("Active organization is required");
      const url = new URL(request.url);
      const route = url.pathname;
      const requestStartedAt = Date.now();
      const defaultKey = `${request.method}:${url.pathname}`;
      const rateLimitKey = options?.rateLimitKey ?? defaultKey;
      const rateLimitMax = options?.rateLimitMax ?? (request.method === "GET" ? 120 : 40);
      const limited = checkRateLimit(`${rateLimitKey}:${user.id}:${organizationId}`, rateLimitMax);
      if (limited) return json({ error: "Rate limit exceeded" }, 429);

      if (permission) {
        const perms = Array.isArray(permission) ? permission : [permission];
        for (const p of perms) requirePermission(user, p);
      }

      const params = await context.params;
      void touchUserActivity({ organizationId, userId: user.id, path: route }).catch(() => {});
      const response = await withSpan(
        "api.request",
        {
          "http.method": request.method,
          "http.route": route,
          "organization.id": organizationId,
          "user.id": user.id,
        },
        async () =>
          runWithTenantContext({ organizationId, userId: user.id }, async () =>
            handler(request, { user: { ...user, organizationId }, params, organizationId })
          )
      );
      void recordApiMetric({
        organizationId,
        userId: user.id,
        route,
        method: request.method,
        statusCode: response.status,
        durationMs: Date.now() - requestStartedAt,
      }).catch(() => {});
      return response;
    } catch (error) {
      const url = new URL(request.url);
      const response = errorResponse(error, url.pathname);
      const organizationId = getOrganizationFromRequest(request) ?? undefined;
      void recordApiMetric({
        organizationId,
        route: url.pathname,
        method: request.method,
        statusCode: response.status,
        durationMs: 0,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      }).catch(() => {});
      void recordMonitoringEvent({
        organizationId,
        source: "API",
        level: "error",
        operation: `${request.method} ${url.pathname}`,
        status: "error",
        message: error instanceof Error ? error.message : "Unknown API error",
      }).catch(() => {});
      return response;
    }
  };
}

export async function parseBody<T>(request: Request, schema: { parse: (data: unknown) => T }): Promise<T> {
  const body = await request.json();
  try {
    return schema.parse(body);
  } catch (e) {
    throw new ApiValidationError(e instanceof Error ? e.message : "Invalid request body");
  }
}
