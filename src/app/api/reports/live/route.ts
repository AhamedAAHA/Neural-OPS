import { withAuth, json } from "@/lib/api/handler";
import { assertIncidentInOrganization } from "@/lib/auth/tenant";
import { buildExecutiveDecision } from "@/lib/services/decision-service";
import { getIncidentDetails } from "@/lib/services/incident-service";
import { prisma } from "@/lib/db";
import { ApiValidationError } from "@/lib/auth/rbac";

export const GET = withAuth("incidents:read", async (request, { user }) => {
  const incidentId = new URL(request.url).searchParams.get("incidentId");
  if (!incidentId) throw new ApiValidationError("incidentId is required");

  await assertIncidentInOrganization(incidentId, user.organizationId);

  const incident = await getIncidentDetails(incidentId);
  if (!incident || (incident.organizationId && incident.organizationId !== user.organizationId)) {
    return json({ error: "Incident not found" }, 404);
  }

  const [decision, report] = await Promise.all([
    buildExecutiveDecision(incidentId, user.organizationId),
    prisma.executiveReport.findFirst({
      where: { incidentId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const vendorIntelligence = incident.vendorIntelligence ?? [];
  const vendorEvidence = (incident.evidence ?? []).filter((item) =>
    ["vendor_profile", "reputation_intelligence", "market_intelligence", "third_party_risk"].includes(item.evidenceType)
  );

  return json({
    liveAt: new Date().toISOString(),
    incident: {
      id: incident.id,
      title: incident.title,
      type: incident.type,
      severity: incident.severity,
      status: incident.status,
      description: incident.description,
    },
    decision,
    report,
    vendorIntelligence: {
      totalFindings: vendorIntelligence.length,
      averageRiskScore: vendorIntelligence.length
        ? Math.round(
            vendorIntelligence.reduce((sum, item) => sum + (item.riskScore ?? 0), 0) / vendorIntelligence.length
          )
        : 0,
      findings: vendorIntelligence.map((item) => ({
        id: item.id,
        riskScore: item.riskScore,
        summary: item.summary,
        source: item.source,
        createdAt: item.createdAt.toISOString(),
        vendor: item.vendor,
      })),
    },
    investigationEvidence: {
      total: incident.evidence?.length ?? 0,
      vendorRelated: vendorEvidence.length,
      recent: (incident.evidence ?? []).slice(0, 8).map((item) => ({
        id: item.id,
        title: item.title,
        evidenceType: item.evidenceType,
        confidence: item.confidence,
        agent: item.sourceAgent?.name ?? "System",
        createdAt: item.createdAt.toISOString(),
      })),
    },
    complianceFindings: incident.complianceFindings ?? [],
    legalFindings: incident.legalFindings ?? [],
    latestRisk: incident.riskAssessments?.[0] ?? null,
  });
});
