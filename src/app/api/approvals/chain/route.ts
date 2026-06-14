import { withAuth, json, parseBody } from "@/lib/api/handler";
import { approvalChainCreateSchema } from "@/lib/api/schemas";
import { assertIncidentInOrganization } from "@/lib/auth/tenant";
import { buildExecutiveDecision, ensureApprovalChain } from "@/lib/services/decision-service";

export const POST = withAuth("approvals:request", async (request, { user }) => {
  const body = await parseBody(request, approvalChainCreateSchema);
  await assertIncidentInOrganization(body.incidentId, user.organizationId);

  const decision = await buildExecutiveDecision(body.incidentId, user.organizationId);
  const chain = await ensureApprovalChain(body.incidentId, user.organizationId, user.id, {
    action: decision.recommendedAction,
    reason: decision.reasoningChain.join(" "),
    riskLevel: decision.legalExposure > 75 ? "critical" : decision.legalExposure > 55 ? "high" : decision.legalExposure > 30 ? "medium" : "low",
  });

  return json({ approvals: chain }, 201);
});
