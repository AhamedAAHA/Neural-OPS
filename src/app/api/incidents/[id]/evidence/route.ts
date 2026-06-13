import { withAuth, json } from "@/lib/api/handler";
import { getIncidentEvidence } from "@/lib/services/agent-service";

export const GET = withAuth("evidence:read", async (_request, { params }) => {
  const evidence = await getIncidentEvidence(params.id);
  return json({ evidence });
});
