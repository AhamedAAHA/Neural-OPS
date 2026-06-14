import { withAuth, json, parseBody } from "@/lib/api/handler";
import { vendorInvestigateSchema } from "@/lib/api/schemas";
import { prisma } from "@/lib/db";
import { BrightDataIntelligenceEngine } from "@/lib/brightdata/intelligence-engine";
import type { Prisma } from "@prisma/client";
import { assertIncidentInOrganization, assertOrganizationAccess } from "@/lib/auth/tenant";
import { recordMonitoringEvent } from "@/lib/observability/store";
import { executeWorkflowsForTrigger } from "@/lib/services/workflow-automation-service";
import { propagateVendorInvestigationResults } from "@/lib/services/vendor-intelligence-service";

const AGENTS = [
  {
    id: "vendor-intelligence-agent",
    name: "Vendor Intelligence Agent",
    role: "VendorIntelligenceAgent",
    capabilities: ["company_profile", "ownership_intel"],
  },
  {
    id: "reputation-intelligence-agent",
    name: "Reputation Intelligence Agent",
    role: "ReputationIntelligenceAgent",
    capabilities: ["news_monitoring", "complaints_reviews"],
  },
  {
    id: "market-intelligence-agent",
    name: "Market Intelligence Agent",
    role: "MarketIntelligenceAgent",
    capabilities: ["market_sentiment", "review_landscape"],
  },
  {
    id: "third-party-risk-agent",
    name: "Third Party Risk Agent",
    role: "ThirdPartyRiskAgent",
    capabilities: ["regulatory_mentions", "legal_disputes"],
  },
] as const;

export const POST = withAuth("incidents:read", async (request, { user }) => {
  const body = await parseBody(request, vendorInvestigateSchema);
  if (body.organizationId) await assertOrganizationAccess(body.organizationId, user.organizationId, user.role);

  if (!BrightDataIntelligenceEngine.configured()) {
    return json(
      {
        error: "Bright Data API not configured.",
        configurationWarning: true,
      },
      200
    );
  }

  const organizationId = body.organizationId ?? user.organizationId;
  const engine = new BrightDataIntelligenceEngine();
  const started = Date.now();
  let findings;
  try {
    findings = await engine.investigateVendor(body.vendorName, body.country, body.industry);
    void recordMonitoringEvent({
      organizationId,
      source: "BRIGHT_DATA",
      operation: "vendors.investigate",
      durationMs: Date.now() - started,
      details: { vendorName: body.vendorName },
    }).catch(() => {});
  } catch (error) {
    void recordMonitoringEvent({
      organizationId,
      source: "BRIGHT_DATA",
      level: "error",
      operation: "vendors.investigate",
      status: "error",
      durationMs: Date.now() - started,
      message: error instanceof Error ? error.message : "Vendor investigation failed",
      details: { vendorName: body.vendorName },
    }).catch(() => {});
    throw error;
  }

  const existingVendor = await prisma.vendor.findFirst({
    where: { organizationId: organizationId ?? null, name: body.vendorName },
  });
  const vendor = existingVendor
    ? await prisma.vendor.update({
        where: { id: existingVendor.id },
        data: { country: body.country, industry: body.industry },
      })
    : await prisma.vendor.create({
        data: {
          organizationId,
          name: body.vendorName,
          country: body.country,
          industry: body.industry,
        },
      });

  const resolvedIncidentId =
    body.incidentId ??
    (
      await prisma.incident.findFirst({
        orderBy: { createdAt: "desc" },
        select: { id: true },
      })
    )?.id;

  if (!resolvedIncidentId) {
    return json({ error: "No incident found. Create an incident before vendor investigation." }, 400);
  }
  await assertIncidentInOrganization(resolvedIncidentId, organizationId);

  const intelligenceRecord = await prisma.vendorIntelligence.create({
    data: {
      organizationId,
      incidentId: resolvedIncidentId,
      vendorId: vendor.id,
      source: "bright_data_engine",
      findingsJson: findings as unknown as Prisma.InputJsonValue,
      riskScore: findings.scores.vendorRiskScore,
      summary: findings.summary,
    },
  });

  const upsertedAgents = await Promise.all(
    AGENTS.map((agent) =>
      prisma.agent.upsert({
        where: { id: agent.id },
        create: {
          id: agent.id,
          name: agent.name,
          role: agent.role,
          tier: "Intelligence",
          framework: "bright-data",
          provider: "AIML_API",
          status: "active",
          capabilities: agent.capabilities,
        },
        update: {
          status: "active",
          capabilities: agent.capabilities,
        },
      })
    )
  );

  const agentByName = new Map(upsertedAgents.map((agent) => [agent.name, agent]));

  const evidencePayloads = [
    {
      agent: "Vendor Intelligence Agent",
      title: `${vendor.name} company profile intelligence`,
      description: `Company profile and ownership findings for ${vendor.name}.`,
      sources: findings.companyProfile,
      evidenceType: "vendor_profile",
    },
    {
      agent: "Reputation Intelligence Agent",
      title: `${vendor.name} reputation intelligence`,
      description: `News and complaints findings for ${vendor.name}.`,
      sources: [...findings.news, ...findings.complaints],
      evidenceType: "reputation_intelligence",
    },
    {
      agent: "Market Intelligence Agent",
      title: `${vendor.name} market review intelligence`,
      description: `Market review findings for ${vendor.name}.`,
      sources: findings.reviews,
      evidenceType: "market_intelligence",
    },
    {
      agent: "Third Party Risk Agent",
      title: `${vendor.name} regulatory and legal intelligence`,
      description: `Regulatory mentions and legal disputes for ${vendor.name}.`,
      sources: [...findings.regulatoryMentions, ...findings.legalDisputes],
      evidenceType: "third_party_risk",
    },
  ];

  const evidences = await Promise.all(
    evidencePayloads.map(async (item) => {
      const sourceAgent = agentByName.get(item.agent);
      if (!sourceAgent) return null;

      return prisma.evidence.create({
        data: {
          incidentId: resolvedIncidentId,
          sourceAgentId: sourceAgent.id,
          evidenceType: item.evidenceType,
          title: item.title,
          description: item.description,
          confidence: 0.85,
          metadataJson: {
            vendorId: vendor.id,
            intelligenceId: intelligenceRecord.id,
            vendorRiskScore: findings.scores.vendorRiskScore,
            reputationScore: findings.scores.reputationScore,
            exposureScore: findings.scores.exposureScore,
            sources: item.sources,
          } as unknown as Prisma.InputJsonValue,
          sourceReference: "bright_data",
        },
      });
    })
  );

  await prisma.auditLog.create({
    data: {
      organizationId,
      incidentId: resolvedIncidentId,
      actorType: "user",
      actorId: user.id,
      action: "vendor_investigated_with_bright_data_engine",
      detailsJson: {
        vendorId: vendor.id,
        vendorName: vendor.name,
        intelligenceId: intelligenceRecord.id,
        evidenceIds: evidences.filter((evidence): evidence is NonNullable<typeof evidence> => Boolean(evidence)).map((evidence) => evidence.id),
        scores: findings.scores,
        sourceCount: findings.sources.length,
      } as unknown as Prisma.InputJsonValue,
    },
  });

  await executeWorkflowsForTrigger({
    organizationId,
    triggerType: "VENDOR_RISK_THRESHOLD",
    incidentId: resolvedIncidentId,
    payload: {
      incidentId: resolvedIncidentId,
      vendorId: vendor.id,
      vendorName: vendor.name,
      vendorRiskScore: findings.scores.vendorRiskScore,
      reputationScore: findings.scores.reputationScore,
      exposureScore: findings.scores.exposureScore,
    },
  });

  await propagateVendorInvestigationResults({
    incidentId: resolvedIncidentId,
    organizationId,
    vendorId: vendor.id,
    vendorName: vendor.name,
    intelligenceId: intelligenceRecord.id,
    summary: findings.summary,
    scores: findings.scores,
    agentId: "vendor-intelligence-agent",
  });

  return json(
    {
      vendor,
      intelligence: intelligenceRecord,
      scores: findings.scores,
      sources: findings.sources,
      findings,
      evidences: evidences.filter(Boolean),
      agents: AGENTS.map((agent) => agent.name),
    },
    201
  );
});
