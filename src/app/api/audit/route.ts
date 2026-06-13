import { withAuth, json } from "@/lib/api/handler";
import { prisma } from "@/lib/db";

export const GET = withAuth("audit:read", async (request) => {
  const url = new URL(request.url);
  const incidentId = url.searchParams.get("incidentId") ?? undefined;

  const logs = await prisma.auditLog.findMany({
    where: incidentId ? { incidentId } : undefined,
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return json({ logs });
});
