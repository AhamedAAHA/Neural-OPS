import { checkRateLimit } from "@/lib/api/rate-limit";
import { getAuthUser, type AuthUser } from "@/lib/auth/session";
import {
  ApiForbiddenError,
  ApiNotFoundError,
  ApiUnauthorizedError,
  ApiValidationError,
  requirePermission,
  type Permission,
} from "@/lib/auth/rbac";

export type ApiHandler = (
  request: Request,
  context: { user: AuthUser; params: Record<string, string> }
) => Promise<Response>;

export function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

export function errorResponse(error: unknown) {
  if (error instanceof ApiUnauthorizedError) return json({ error: error.message }, 401);
  if (error instanceof ApiForbiddenError) return json({ error: error.message }, 403);
  if (error instanceof ApiValidationError) return json({ error: error.message }, 400);
  if (error instanceof ApiNotFoundError) return json({ error: error.message }, 404);
  console.error("[API Error]", error);
  return json({ error: "Internal server error" }, 500);
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

      if (options?.rateLimitKey) {
        const limited = checkRateLimit(`${options.rateLimitKey}:${user.id}`, options.rateLimitMax ?? 30);
        if (limited) return json({ error: "Rate limit exceeded" }, 429);
      }

      if (permission) {
        const perms = Array.isArray(permission) ? permission : [permission];
        for (const p of perms) requirePermission(user, p);
      }

      const params = await context.params;
      return await handler(request, { user, params });
    } catch (error) {
      return errorResponse(error);
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
