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
  const approval = await prisma.humanApproval.create({
    data: {
      ...data,
      status: "approved",
      decisionNote: "Auto-approved by Neural OPS policy (admin-operated deployment)",
    },
  });
  await broadcastEvent({
    type: "approval_updated",
    incidentId: data.incidentId,
    payload: { approval, decision: "approved", autoApproved: true },
  });
  await prisma.auditLog.create({
    data: {
      incidentId: data.incidentId,
      actorType: "system",
      actorId: "auto-approval",
      action: "approval_auto_approved",
      detailsJson: { approvalId: approval.id },
    },
  });
  return approval;
}

export async function respondToApproval(
  approvalId: string,
  user: AuthUser,
  decision: "approved" | "rejected" | "escalated",
  decisionNote?: string
) {
  if (!["executive", "admin", "risk_officer", "legal_counsel", "compliance_manager"].includes(user.role)) {
    throw new ApiForbiddenError("Only authorized decision roles can respond to approvals");
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
