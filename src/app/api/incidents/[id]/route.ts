import { withAuth, json } from "@/lib/api/handler";
import { ApiNotFoundError } from "@/lib/auth/rbac";
import { getIncidentDetails } from "@/lib/services/incident-service";

export const GET = withAuth("incidents:read", async (_request, { params }) => {
  const incident = await getIncidentDetails(params.id);
  if (!incident) throw new ApiNotFoundError("Incident not found");
  return json({ incident });
});
