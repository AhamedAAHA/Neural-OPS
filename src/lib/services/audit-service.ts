import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export interface AuditLogInput {
  incidentId?: string;
  actorType: "user" | "agent" | "system";
  actorId?: string;
  action: string;
  detailsJson?: Record<string, unknown>;
}

export class AuditLogger {
  static async log(input: AuditLogInput) {
    return prisma.auditLog.create({
      data: {
        incidentId: input.incidentId,
        actorType: input.actorType,
        actorId: input.actorId ?? "system",
        action: input.action,
        detailsJson: (input.detailsJson ?? {}) as Prisma.InputJsonValue,
      },
    });
  }

  static async list(incidentId?: string, limit = 100) {
    return prisma.auditLog.findMany({
      where: incidentId ? { incidentId } : undefined,
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }
}

export async function logAuditEvent(input: AuditLogInput) {
  return AuditLogger.log(input);
}

export async function getAuditLogs(incidentId?: string, limit = 100) {
  return AuditLogger.list(incidentId, limit);
}
