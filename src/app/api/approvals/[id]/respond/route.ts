import { withAuth, json, parseBody } from "@/lib/api/handler";
import { approvalRespondSchema } from "@/lib/api/schemas";
import { respondToApproval } from "@/lib/services/approval-service";
import { prisma } from "@/lib/db";
import { ApiForbiddenError } from "@/lib/auth/rbac";
import { assertIncidentInOrganization } from "@/lib/auth/tenant";

export const POST = withAuth("approvals:respond", async (request, { user, params }) => {
  const body = await parseBody(request, approvalRespondSchema);

  const approvalV2 = await prisma.approval.findUnique({ where: { id: params.id } });
  if (approvalV2) {
    await assertIncidentInOrganization(approvalV2.incidentId, approvalV2.organizationId ?? user.organizationId);

    const pendingBefore = approvalV2.chainOrder
      ? await prisma.approval.findFirst({
          where: {
            incidentId: approvalV2.incidentId,
            organizationId: approvalV2.organizationId ?? user.organizationId,
            chainOrder: { lt: approvalV2.chainOrder },
            status: { not: "approved" },
          },
        })
      : null;

    if (pendingBefore) {
      throw new ApiForbiddenError("Earlier approval steps must be completed first");
    }

    const allowedRolesByStep: Record<string, string[]> = {
      "Compliance Manager": ["compliance_manager", "admin"],
      "Legal Counsel": ["legal_counsel", "admin"],
      "Risk Officer": ["risk_officer", "admin"],
      CISO: ["admin"],
      Executive: ["executive", "admin"],
    };

    const stepRole = approvalV2.approverRole ?? "Executive";
    const allowed = allowedRolesByStep[stepRole] ?? ["admin"];
    if (!allowed.includes(user.role)) {
      throw new ApiForbiddenError(`${stepRole} approval required. Current role '${user.role}' is not authorized for this step.`);
    }

    const updated = await prisma.approval.update({
      where: { id: approvalV2.id },
      data: {
        status: body.decision,
        decidedById: user.id,
        decisionNote: body.decisionNote,
      },
    });

    const allApproved = await prisma.approval.count({
      where: {
        incidentId: approvalV2.incidentId,
        organizationId: approvalV2.organizationId ?? user.organizationId,
        chainOrder: { not: null },
        status: "approved",
      },
    });
    const chainSteps = await prisma.approval.count({
      where: {
        incidentId: approvalV2.incidentId,
        organizationId: approvalV2.organizationId ?? user.organizationId,
        chainOrder: { not: null },
      },
    });

    if (body.decision === "rejected") {
      await prisma.incident.update({
        where: { id: approvalV2.incidentId },
        data: { status: "investigating" },
      });
    } else if (body.decision === "escalated") {
      await prisma.incident.update({
        where: { id: approvalV2.incidentId },
        data: { status: "escalated" },
      });
    } else if (chainSteps > 0 && allApproved === chainSteps) {
      await prisma.incident.update({
        where: { id: approvalV2.incidentId },
        data: { status: "contained" },
      });
    }

    await prisma.auditLog.create({
      data: {
        organizationId: approvalV2.organizationId ?? user.organizationId,
        incidentId: approvalV2.incidentId,
        actorType: "user",
        actorId: user.id,
        action: `approval_${body.decision}`,
        detailsJson: {
          approvalId: updated.id,
          stepRole: updated.approverRole,
          chainOrder: updated.chainOrder,
          decisionNote: body.decisionNote ?? null,
        },
      },
    });

    return json({ approval: updated });
  }

  const approval = await respondToApproval(params.id, user, body.decision, body.decisionNote);
  return json({ approval });
});
