import { withAuth, json, parseBody } from "@/lib/api/handler";
import { createIncidentSchema } from "@/lib/api/schemas";
import { createIncident, listIncidents } from "@/lib/services/incident-service";
import { startInvestigationWorkflow } from "@/lib/services/workflow-service";

export const GET = withAuth("incidents:read", async (request) => {
  const url = new URL(request.url);
  const severity = url.searchParams.get("severity") ?? undefined;
  const status = url.searchParams.get("status") ?? undefined;
  const incidents = await listIncidents({ severity, status });
  return json({ incidents });
});

export const POST = withAuth("incidents:create", async (request, { user }) => {
  const body = await parseBody(request, createIncidentSchema);
  const result = await createIncident(user, body);
  await startInvestigationWorkflow(result.incident.id);
  return json(result, 201);
});
