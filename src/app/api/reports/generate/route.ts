import { withAuth, json, parseBody } from "@/lib/api/handler";
import { reportGenerateSchema } from "@/lib/api/schemas";
import { generateExecutiveReport } from "@/lib/services/report-service";
import { assertIncidentInOrganization } from "@/lib/auth/tenant";
import { prisma } from "@/lib/db";

export const POST = withAuth("reports:generate", async (request, { user }) => {
  const body = await parseBody(request, reportGenerateSchema);
  await assertIncidentInOrganization(body.incidentId, user.organizationId);
  const report = await generateExecutiveReport(body.incidentId);
  await prisma.auditLog.create({
    data: {
      organizationId: user.organizationId,
      incidentId: body.incidentId,
      actorType: "user",
      actorId: user.id,
      action: "executive_report_requested",
      detailsJson: { reportId: report.id },
    },
  });
  return json({ report }, 201);
});
