import { prisma } from "@/lib/db";
import { broadcastEvent } from "@/lib/realtime/broadcaster";
import { wrapAgent } from "@/lib/agents/registry";
import { buildExecutiveDecision } from "@/lib/services/decision-service";
import { ApiNotFoundError } from "@/lib/auth/rbac";

export async function generateExecutiveReport(incidentId: string) {
  const incident = await prisma.incident.findUnique({
    where: { id: incidentId },
    include: {
      evidence: true,
      riskAssessments: { orderBy: { createdAt: "desc" }, take: 1 },
      complianceFindings: true,
      legalFindings: true,
      approvals: true,
      vendorIntelligence: true,
      documents: { include: { chunks: true } },
      rooms: { include: { messages: { include: { agent: true }, orderBy: { createdAt: "asc" } }, agents: true } },
      auditLogs: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!incident) throw new ApiNotFoundError("Incident not found");

  const decision = await buildExecutiveDecision(incidentId, incident.organizationId ?? undefined);

  const room = incident.rooms[0];
  const execAgent = incident.rooms[0]?.agents.find((a) => a.role === "ExecutiveStrategyAgent");
  let aiSummary = `Executive summary for ${incident.title}: Recommendation is '${decision.recommendedAction}' with confidence ${decision.confidenceScore}%.`;

  if (execAgent && room) {
    const agent = await wrapAgent(execAgent, incidentId, room.id, room.bandRoomId);
    const result = await agent.analyze({ incident, evidence: incident.evidence, risk: incident.riskAssessments[0] });
    aiSummary = (result.recommendation as string) ?? (result.summary as string) ?? aiSummary;
  }

  const timeline = incident.auditLogs.map((log) => ({
    time: log.createdAt.toISOString(),
    action: log.action,
    actor: log.actorId,
  }));

  const reportPayload = {
    recommendedAction: decision.recommendedAction,
    confidenceScore: decision.confidenceScore,
    financialImpact: decision.financialImpact,
    complianceImpact: decision.complianceImpact,
    legalExposure: decision.legalExposure,
    operationalImpact: decision.operationalImpact,
    reputationImpact: decision.reputationImpact,
    reasoningChain: decision.reasoningChain,
    ranking: decision.ranking.map((item) => ({
      id: item.id,
      label: item.label,
      rank: item.rank,
      confidence: item.confidence,
      expectedSavings: item.expectedSavings,
      rationale: item.rationale,
    })),
    vendorIntelligence: {
      totalFindings: incident.vendorIntelligence.length,
      averageRiskScore: incident.vendorIntelligence.length
        ? Math.round(
            incident.vendorIntelligence.reduce((sum, item) => sum + item.riskScore, 0) / incident.vendorIntelligence.length
          )
        : 0,
      topSignals: incident.vendorIntelligence
        .slice(0, 10)
        .map((item) => ({
          id: item.id,
          source: item.source,
          riskScore: item.riskScore,
          summary: item.summary,
          createdAt: item.createdAt.toISOString(),
        })),
    },
  };

  const report = await prisma.executiveReport.create({
    data: {
      incidentId,
      summary: aiSummary,
      timelineJson: timeline as object,
      evidenceJson: incident.evidence as object,
      riskJson: {
        ...(incident.riskAssessments[0] ?? {}),
        ...reportPayload,
      } as object,
      complianceJson: incident.complianceFindings as object,
      legalJson: incident.legalFindings as object,
      recommendationsJson: decision.ranking.map((item) => ({
        action: item.label,
        rationale: item.rationale,
        confidence: item.confidence,
      })) as object,
      agentContributionJson: room?.agents.map((a) => ({ id: a.id, name: a.name, role: a.role })) ?? [] as object,
      approvalHistoryJson: decision.approvalChain as object,
    },
  });

  await prisma.auditLog.create({
    data: {
      organizationId: incident.organizationId ?? undefined,
      incidentId,
      actorType: "system",
      actorId: "executive_report_engine",
      action: "executive_report_generated",
      detailsJson: {
        reportId: report.id,
        recommendedAction: decision.recommendedAction,
        confidenceScore: decision.confidenceScore,
      },
    },
  });

  await broadcastEvent({ type: "report_generated", incidentId, payload: { report } });
  return report;
}

export async function getReport(id: string) {
  return prisma.executiveReport.findUnique({ where: { id }, include: { incident: true } });
}
