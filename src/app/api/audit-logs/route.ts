import { withAuth, json } from "@/lib/api/handler";
import { prisma } from "@/lib/db";
import { assertIncidentInOrganization, assertOrganizationAccess } from "@/lib/auth/tenant";

export const GET = withAuth("incidents:read", async (request, { user }) => {
  const url = new URL(request.url);
  const incidentId = url.searchParams.get("incidentId") ?? undefined;
  const organizationId = url.searchParams.get("organizationId") ?? undefined;
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 200), 500);
  if (organizationId) await assertOrganizationAccess(organizationId, user.organizationId, user.role);
  if (incidentId) await assertIncidentInOrganization(incidentId, organizationId ?? user.organizationId);

  const logs = await prisma.auditLog.findMany({
    where: {
      ...(incidentId ? { incidentId } : {}),
      organizationId: organizationId ?? user.organizationId,
    },
    orderBy: { createdAt: "desc" },
    take: Number.isFinite(limit) ? limit : 200,
  });

  await prisma.auditLog.create({
    data: {
      incidentId,
      organizationId: organizationId ?? user.organizationId,
      actorType: "user",
      actorId: user.id,
      action: "audit_logs_viewed",
      detailsJson: { returned: logs.length },
    },
  });

  return json({ logs });
});
