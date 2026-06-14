import { withAuth, json, parseBody } from "@/lib/api/handler";
import { evidenceSchema } from "@/lib/api/schemas";
import { saveEvidence } from "@/lib/services/agent-service";
import { prisma } from "@/lib/db";

export const GET = withAuth("evidence:read", async (request) => {
  const { searchParams } = new URL(request.url);
  const incidentId = searchParams.get("incidentId");
  const evidence = await prisma.evidence.findMany({
    where: incidentId ? { incidentId } : undefined,
    include: {
      sourceAgent: { select: { name: true } },
      incident: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  });
  return json({ evidence });
});

export const POST = withAuth("evidence:create", async (request) => {
  const body = await parseBody(request, evidenceSchema);
  const evidence = await saveEvidence(body);
  return json({ evidence }, 201);
});
