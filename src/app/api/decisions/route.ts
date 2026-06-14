import { withAuth, json } from "@/lib/api/handler";
import { decisionQuerySchema } from "@/lib/api/schemas";
import { buildExecutiveDecision } from "@/lib/services/decision-service";
import { assertIncidentInOrganization, assertOrganizationAccess } from "@/lib/auth/tenant";
import { ApiValidationError } from "@/lib/auth/rbac";

export const GET = withAuth("incidents:read", async (request, { user }) => {
  const url = new URL(request.url);
  const parsed = decisionQuerySchema.safeParse({ incidentId: url.searchParams.get("incidentId") ?? "" });
  if (!parsed.success) throw new ApiValidationError(parsed.error.issues[0]?.message ?? "Invalid decision query");

  await assertIncidentInOrganization(parsed.data.incidentId, user.organizationId);
  await assertOrganizationAccess(user.organizationId, user.organizationId, user.role);

  const decision = await buildExecutiveDecision(parsed.data.incidentId, user.organizationId);
  return json({ decision });
});
