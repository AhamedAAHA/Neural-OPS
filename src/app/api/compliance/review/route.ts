import { withAuth, json, parseBody } from "@/lib/api/handler";
import { complianceReviewSchema } from "@/lib/api/schemas";
import { reviewCompliance } from "@/lib/services/compliance-service";
import { executeWorkflowsForTrigger } from "@/lib/services/workflow-automation-service";

export const POST = withAuth("incidents:read", async (request, { user }) => {
  const body = await parseBody(request, complianceReviewSchema);
  const findings = await reviewCompliance(body.incidentId, body.regulations);
  const severityOrder = ["low", "medium", "high", "critical"];
  const topSeverity =
    findings
      .map((finding) => finding.severity)
      .sort((a, b) => severityOrder.indexOf(b) - severityOrder.indexOf(a))[0] ?? "low";

  await executeWorkflowsForTrigger({
    organizationId: user.organizationId,
    triggerType: "COMPLIANCE_VIOLATION",
    incidentId: body.incidentId,
    payload: {
      incidentId: body.incidentId,
      severity: topSeverity,
      findingsCount: findings.length,
      regulations: body.regulations,
    },
  });
  return json({ findings }, 201);
});
