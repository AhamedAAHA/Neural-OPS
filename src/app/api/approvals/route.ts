import { withAuth, json, parseBody } from "@/lib/api/handler";
import { approvalCreateSchemaV2, approvalsListSchema } from "@/lib/api/schemas";
import { prisma } from "@/lib/db";
import { assertIncidentInOrganization, assertOrganizationAccess } from "@/lib/auth/tenant";
import { ApiValidationError } from "@/lib/auth/rbac";

export const GET = withAuth("approvals:request", async (request, { user }) => {
  const url = new URL(request.url);
  const parsed = approvalsListSchema.safeParse({
    incidentId: url.searchParams.get("incidentId") ?? undefined,
    organizationId: url.searchParams.get("organizationId") ?? undefined,
  });
  if (!parsed.success) throw new ApiValidationError(parsed.error.issues[0]?.message ?? "Invalid approvals query");

  const organizationId = parsed.data.organizationId ?? user.organizationId;
  await assertOrganizationAccess(organizationId, user.organizationId, user.role);
  if (parsed.data.incidentId) await assertIncidentInOrganization(parsed.data.incidentId, organizationId);

  const approvals = await prisma.approval.findMany({
    where: {
      organizationId,
      ...(parsed.data.incidentId ? { incidentId: parsed.data.incidentId } : {}),
    },
    orderBy: [{ chainOrder: "asc" }, { createdAt: "asc" }],
    include: {
      requestedBy: { select: { id: true, name: true, email: true, role: true } },
      decidedBy: { select: { id: true, name: true, email: true, role: true } },
    },
  });

  return json({ approvals });
});

export const POST = withAuth("approvals:request", async (request, { user }) => {
  const body = await parseBody(request, approvalCreateSchemaV2);
  if (body.organizationId) await assertOrganizationAccess(body.organizationId, user.organizationId, user.role);
  await assertIncidentInOrganization(body.incidentId, body.organizationId ?? user.organizationId);

  const approval = await prisma.approval.create({
    data: {
      organizationId: body.organizationId ?? user.organizationId,
      incidentId: body.incidentId,
      requestedById: user.id,
      title: body.title,
      description: body.description,
      riskLevel: body.riskLevel,
      status: "pending",
    },
  });

  await prisma.auditLog.create({
    data: {
      organizationId: body.organizationId ?? user.organizationId,
      incidentId: body.incidentId,
      actorType: "user",
      actorId: user.id,
      action: "approval_requested",
      detailsJson: {
        approvalId: approval.id,
        title: body.title,
        riskLevel: body.riskLevel,
      },
    },
  });

  return json({ approval }, 201);
});
