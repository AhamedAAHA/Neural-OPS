import { prisma } from "@/lib/db";
import { withAuth, json } from "@/lib/api/handler";
import { assertIncidentInOrganization } from "@/lib/auth/tenant";

export const GET = withAuth("incidents:read", async (request, { user }) => {
  const { searchParams } = new URL(request.url);
  const vendor = searchParams.get("vendor") ?? undefined;
  const incidentId = searchParams.get("incidentId") ?? undefined;
  if (incidentId) await assertIncidentInOrganization(incidentId, user.organizationId);

  if (vendor) {
    const rows = await prisma.vendorIntelligence.findMany({
      where: { organizationId: user.organizationId, vendor: { name: { contains: vendor, mode: "insensitive" } } },
      include: { vendor: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    return json({ vendorIntelligence: rows });
  }

  const [evidence, vendorIntelligence] = await Promise.all([
    prisma.evidence.findMany({
      where: {
        ...(incidentId ? { incidentId } : { incident: { organizationId: user.organizationId } }),
      },
      include: {
        sourceAgent: true,
        incident: { select: { title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 80,
    }),
    prisma.vendorIntelligence.findMany({
      where: {
        organizationId: user.organizationId,
        ...(incidentId ? { incidentId } : {}),
      },
      include: { vendor: true, incident: { select: { title: true } } },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
  ]);

  const evidenceSignals = evidence.map((item) => ({
    id: item.id,
    source: "Evidence",
    agent: item.sourceAgent?.name ?? "System",
    signal: `${item.title}: ${item.description}`,
    severity: item.confidence >= 0.9 ? "critical" : item.confidence >= 0.75 ? "high" : item.confidence >= 0.55 ? "medium" : "low",
    timestamp: item.createdAt.toISOString(),
    incidentTitle: item.incident?.title ?? null,
    category: item.evidenceType,
  }));

  const vendorSignals = vendorIntelligence.map((item) => ({
    id: `vendor-intel-${item.id}`,
    source: "Bright Data",
    agent: "Vendor Intelligence Agent",
    signal: item.summary ?? `Vendor intelligence update for ${item.vendor.name}`,
    severity:
      item.riskScore >= 85 ? "critical" : item.riskScore >= 70 ? "high" : item.riskScore >= 50 ? "medium" : "low",
    timestamp: item.createdAt.toISOString(),
    incidentTitle: item.incident?.title ?? null,
    category: "vendor_intelligence",
    vendorName: item.vendor.name,
    riskScore: item.riskScore,
  }));

  const signals = [...vendorSignals, ...evidenceSignals]
    .sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp))
    .slice(0, 100);

  return json({ signals });
});
