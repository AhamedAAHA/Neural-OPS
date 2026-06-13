import type { UserRole } from "@prisma/client";
import type { AuthUser } from "./session";

export type Permission =
  | "incidents:create"
  | "incidents:read"
  | "incidents:manage"
  | "evidence:create"
  | "evidence:read"
  | "agents:manage"
  | "approvals:respond"
  | "approvals:request"
  | "reports:generate"
  | "reports:read"
  | "audit:read"
  | "voice:use"
  | "ai:use"
  | "risk:analyze";

type PermissionCheck = Permission;

const ROLE_PERMISSIONS: Record<UserRole, PermissionCheck[]> = {
  admin: [
    "incidents:create", "incidents:read", "incidents:manage",
    "evidence:create", "evidence:read", "agents:manage",
    "approvals:respond", "approvals:request",
    "reports:generate", "reports:read", "audit:read",
    "voice:use", "ai:use", "risk:analyze",
  ],
  analyst: [
    "incidents:create", "incidents:read",
    "evidence:create", "evidence:read",
    "approvals:request", "reports:read",
    "voice:use", "ai:use", "risk:analyze",
  ],
  executive: [
    "incidents:read", "evidence:read",
    "approvals:respond", "reports:generate", "reports:read",
    "voice:use", "ai:use", "risk:analyze",
  ],
  auditor: ["incidents:read", "evidence:read", "reports:read", "audit:read"],
};

export function hasPermission(user: AuthUser, permission: PermissionCheck): boolean {
  return ROLE_PERMISSIONS[user.role]?.includes(permission) ?? false;
}

export function requirePermission(user: AuthUser, permission: PermissionCheck): void {
  if (!hasPermission(user, permission)) {
    throw new ApiForbiddenError(`Role '${user.role}' lacks permission: ${permission}`);
  }
}

export class ApiForbiddenError extends Error {
  status = 403;
  constructor(message: string) {
    super(message);
    this.name = "ApiForbiddenError";
  }
}

export class ApiUnauthorizedError extends Error {
  status = 401;
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "ApiUnauthorizedError";
  }
}

export class ApiValidationError extends Error {
  status = 400;
  constructor(message: string) {
    super(message);
    this.name = "ApiValidationError";
  }
}

export class ApiNotFoundError extends Error {
  status = 404;
  constructor(message: string) {
    super(message);
    this.name = "ApiNotFoundError";
  }
}
