import { prisma } from "@/lib/db";
import { broadcastEvent } from "@/lib/realtime/broadcaster";
import type { AuthUser } from "@/lib/auth/session";
import { ApiForbiddenError } from "@/lib/auth/rbac";

export async function requestApproval(data: {
  incidentId: string;
  requestedByAgentId: string;
  actionTitle: string;
  actionDescription: string;
  riskLevel: "critical" | "high" | "medium" | "low";
}) {
  const approval = await prisma.humanApproval.create({ data });
  await broadcastEvent({ type: "approval_requested", incidentId: data.incidentId, payload: { approval } });
  await prisma.auditLog.create({
    data: { incidentId: data.incidentId, actorType: "agent", actorId: data.requestedByAgentId, action: "approval_requested", detailsJson: { approvalId: approval.id } },
  });
  return approval;
}

export async function respondToApproval(
  approvalId: string,
  user: AuthUser,
  decision: "approved" | "rejected" | "escalated",
  decisionNote?: string
) {
  if (user.role !== "executive" && user.role !== "admin") {
    throw new ApiForbiddenError("Only executives and admins can respond to approvals");
  }

  const approval = await prisma.humanApproval.update({
    where: { id: approvalId },
    data: { status: decision, approvedBy: user.id, decisionNote },
  });

  const newStatus = decision === "approved" ? "contained" : decision === "escalated" ? "escalated" : "investigating";
  await prisma.incident.update({ where: { id: approval.incidentId }, data: { status: newStatus } });

  await broadcastEvent({
    type: "approval_updated",
    incidentId: approval.incidentId,
    payload: { approval, decision, decidedBy: user.id },
  });

  await prisma.auditLog.create({
    data: {
      incidentId: approval.incidentId,
      actorType: "user",
      actorId: user.id,
      action: `approval_${decision}`,
      detailsJson: { approvalId, decisionNote },
    },
  });

  return approval;
}
