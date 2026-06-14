import { withAuth, json } from "@/lib/api/handler";
import { ApiValidationError } from "@/lib/auth/rbac";
import { memoryQuerySchema } from "@/lib/api/schemas";
import { MemoryAgent } from "@/lib/agents/memory-agent";
import { prisma } from "@/lib/db";
import { assertIncidentInOrganization, assertOrganizationAccess } from "@/lib/auth/tenant";

export const GET = withAuth("incidents:read", async (request, { user }) => {
  const url = new URL(request.url);
  const parsed = memoryQuerySchema.safeParse({
    vendor: url.searchParams.get("vendor") ?? undefined,
    incidentId: url.searchParams.get("incidentId") ?? undefined,
    organizationId: url.searchParams.get("organizationId") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
  });

  if (!parsed.success) {
    throw new ApiValidationError(parsed.error.issues.map((issue) => issue.message).join("; "));
  }
  if (parsed.data.organizationId) {
    await assertOrganizationAccess(parsed.data.organizationId, user.organizationId, user.role);
  }
  if (parsed.data.incidentId) {
    await assertIncidentInOrganization(parsed.data.incidentId, parsed.data.organizationId ?? user.organizationId);
  }

  const memoryAgent = new MemoryAgent();
  const memory = await memoryAgent.buildMemory({
    vendorName: parsed.data.vendor,
    incidentId: parsed.data.incidentId,
    organizationId: parsed.data.organizationId ?? user.organizationId,
    limit: parsed.data.limit,
  });

  await prisma.auditLog.create({
    data: {
      incidentId: parsed.data.incidentId,
      organizationId: parsed.data.organizationId ?? user.organizationId,
      actorType: "user",
      actorId: user.id,
      action: "memory_query_executed",
      detailsJson: {
        vendor: parsed.data.vendor,
        limit: parsed.data.limit,
        timelineItems: memory.timeline.length,
      },
    },
  });

  return json({ memory });
});
