import { withAuth, json } from "@/lib/api/handler";
import { getIncidentEvidence } from "@/lib/services/agent-service";
import { prisma } from "@/lib/db";

export const GET = withAuth("evidence:read", async (_request, { params, user }) => {
  const incident = await prisma.incident.findFirst({
    where: { id: params.id, organizationId: user.organizationId },
    select: { id: true },
  });
  if (!incident) return json({ evidence: [] });
  const evidence = await getIncidentEvidence(params.id);
  return json({ evidence });
});
