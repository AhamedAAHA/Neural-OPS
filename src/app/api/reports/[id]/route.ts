import { withAuth, json } from "@/lib/api/handler";
import { ApiNotFoundError } from "@/lib/auth/rbac";
import { getReport } from "@/lib/services/report-service";
import { assertIncidentInOrganization } from "@/lib/auth/tenant";

export const GET = withAuth("reports:read", async (_request, { params, user }) => {
  const report = await getReport(params.id);
  if (!report) throw new ApiNotFoundError("Report not found");
  await assertIncidentInOrganization(report.incidentId, user.organizationId);
  return json({ report });
});
