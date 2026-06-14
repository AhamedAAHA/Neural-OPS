import { withAuth, json } from "@/lib/api/handler";
import { getIncidentDetails } from "@/lib/services/incident-service";

export const GET = withAuth("incidents:read", async (_request, { params, user }) => {
  const incident = await getIncidentDetails(params.id);
  if (!incident || (incident.organizationId && incident.organizationId !== user.organizationId)) {
    return json({ incident: { evidence: [] } });
  }
  return json({ incident });
});
