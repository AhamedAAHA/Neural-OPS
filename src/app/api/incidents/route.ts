import { withAuth, json, parseBody } from "@/lib/api/handler";
import { createIncidentSchema } from "@/lib/api/schemas";
import { createIncident, listIncidents } from "@/lib/services/incident-service";
import { startInvestigationWorkflow } from "@/lib/services/workflow-service";
import { prisma } from "@/lib/db";
import { executeWorkflowsForTrigger } from "@/lib/services/workflow-automation-service";

export const GET = withAuth("incidents:read", async (request, { user }) => {
  const url = new URL(request.url);
  const severity = url.searchParams.get("severity") ?? undefined;
  const status = url.searchParams.get("status") ?? undefined;
  const incidents = await listIncidents({ severity, status, organizationId: user.organizationId });
  try {
    await prisma.auditLog.create({
      data: {
        organizationId: user.organizationId,
        actorType: "user",
        actorId: user.id,
        action: "incidents_list_viewed",
        detailsJson: { severity, status, count: incidents.length },
      },
    });
  } catch (auditError) {
    console.error("[API Warning] /api/incidents audit log failed:", auditError);
  }
  return json({ incidents });
});

export const POST = withAuth("incidents:create", async (request, { user }) => {
  const body = await parseBody(request, createIncidentSchema);
  const result = await createIncident(user, body);
  await startInvestigationWorkflow(result.incident.id);
  await executeWorkflowsForTrigger({
    organizationId: user.organizationId,
    triggerType: "NEW_INCIDENT",
    incidentId: result.incident.id,
    payload: {
      incidentId: result.incident.id,
      title: result.incident.title,
      type: result.incident.type,
      severity: result.incident.severity,
    },
  });
  return json(result, 201);
});
