import { prisma } from "@/lib/db";
import { broadcastEvent } from "@/lib/realtime/broadcaster";
import { wrapAgent } from "@/lib/agents/registry";

export async function analyzeRisk(incidentId: string, agentId?: string) {
  const incident = await prisma.incident.findUnique({ where: { id: incidentId }, include: { evidence: true } });
  if (!incident) throw new Error("Incident not found");

  const agent = agentId
    ? await prisma.agent.findUnique({ where: { id: agentId } })
    : await prisma.agent.findFirst({ where: { role: "FutureRiskSimulationAgent", room: { incidentId } } });

  if (!agent) throw new Error("Risk agent not found");
  const room = await prisma.investigationRoom.findFirst({ where: { incidentId } });
  if (!room) throw new Error("Room not found");

  const riskAgent = await wrapAgent(agent, incidentId, room.id, room.bandRoomId);
  const analysis = await riskAgent.analyze({ incident, evidence: incident.evidence });

  const assessment = await prisma.riskAssessment.create({
    data: {
      incidentId,
      riskScore: (analysis.riskScore as number) ?? 75,
      financialImpact: (analysis.financialImpact as number) ?? 1000000,
      legalImpact: (analysis.legalImpact as number) ?? 70,
      reputationImpact: (analysis.reputationImpact as number) ?? 65,
      operationalImpact: (analysis.operationalImpact as number) ?? 40,
      customerImpact: (analysis.customerImpact as number) ?? 55,
      recommendation: (analysis.recommendation as string) ?? "Conduct full investigation and freeze affected systems",
      generatedByAgentId: agent.id,
    },
  });

  await broadcastEvent({ type: "risk_update", incidentId, payload: { assessment } });
  return assessment;
}

export async function simulateRisk(
  incidentId: string,
  scenario: string,
  scenarioDescription?: string,
  timeframe?: "24h" | "7d"
) {
  const incident = await prisma.incident.findUnique({
    where: { id: incidentId },
    select: {
      id: true,
      status: true,
      severity: true,
    },
  });
  if (!incident) throw new Error("Incident not found");

  const [
    evidenceAgg,
    complianceCount,
    legalCount,
    pendingApprovals,
    vendorRiskAgg,
    latestRisk,
    agent,
    room,
  ] = await Promise.all([
    prisma.evidence.aggregate({
      where: { incidentId },
      _count: { _all: true },
      _avg: { confidence: true },
    }),
    prisma.complianceFinding.count({ where: { incidentId } }),
    prisma.legalFinding.count({ where: { incidentId } }),
    prisma.approval.count({ where: { incidentId, status: "pending" } }),
    prisma.vendorIntelligence.aggregate({
      where: { incidentId },
      _count: { _all: true },
      _avg: { riskScore: true },
    }),
    prisma.riskAssessment.findFirst({
      where: { incidentId },
      orderBy: { createdAt: "desc" },
      select: { riskScore: true },
    }),
    prisma.agent.findFirst({ where: { role: "FutureRiskSimulationAgent", room: { incidentId } } }),
    prisma.investigationRoom.findFirst({ where: { incidentId } }),
  ]);

  const effectiveTimeframe = timeframe ?? "24h";

  const evidenceCount = evidenceAgg._count._all ?? 0;
  const avgEvidenceConfidence = evidenceAgg._avg.confidence ?? 0;
  const vendorRiskScore =
    (vendorRiskAgg._count._all ?? 0) > 0
      ? vendorRiskAgg._avg.riskScore ?? 40
      : 40;
  const latestRiskScore = latestRisk?.riskScore ?? 55;

  const severityWeight = incident.severity === "critical" ? 1.35 : incident.severity === "high" ? 1.18 : incident.severity === "medium" ? 1.0 : 0.82;
  const timeframeMultiplier = effectiveTimeframe === "7d" ? 1.45 : 1;
  const evidencePressure = Math.max(1, evidenceCount * (0.6 + avgEvidenceConfidence));
  const baseFinancial = Math.round((130000 + evidencePressure * 85000 + complianceCount * 60000 + legalCount * 75000 + pendingApprovals * 45000) * severityWeight * timeframeMultiplier);
  const baseLegal = clamp(Math.round(20 + legalCount * 15 + complianceCount * 8 + pendingApprovals * 6 + latestRiskScore * 0.22), 5, 100);
  const baseReputation = clamp(Math.round(18 + evidenceCount * 4 + avgEvidenceConfidence * 30 + vendorRiskScore * 0.38), 5, 100);
  const baseOperational = clamp(Math.round(12 + evidenceCount * 2 + pendingApprovals * 6 + (incident.status === "escalated" ? 20 : 0)), 5, 100);
  const baseCustomer = clamp(Math.round(15 + avgEvidenceConfidence * 25 + complianceCount * 7 + legalCount * 5), 5, 100);

  const scenarioProfiles: Record<string, { financial: number; legal: number; reputation: number; operational: number; customer: number; recommendation: string }> = {
    ignore: {
      financial: 1.95,
      legal: 1.65,
      reputation: 1.5,
      operational: 1.2,
      customer: 1.55,
      recommendation: "Not recommended. Delayed response materially increases loss and legal exposure.",
    },
    shutdown: {
      financial: 0.68,
      legal: 0.82,
      reputation: 0.9,
      operational: 1.55,
      customer: 0.9,
      recommendation: "Containment-first strategy. Best when spread risk is high and continuity tradeoff is acceptable.",
    },
    notify: {
      financial: 0.84,
      legal: 0.58,
      reputation: 0.78,
      operational: 1.06,
      customer: 0.7,
      recommendation: "Good for legal/regulatory posture. Pair with containment to reduce customer impact.",
    },
    freeze: {
      financial: 0.56,
      legal: 0.62,
      reputation: 0.74,
      operational: 0.94,
      customer: 0.76,
      recommendation: "High ROI immediate control for vendor-driven incidents.",
    },
    audit: {
      financial: 0.76,
      legal: 0.55,
      reputation: 0.82,
      operational: 1.08,
      customer: 0.84,
      recommendation: "Improves defensibility and board reporting quality; combine with tactical controls.",
    },
  };

  const selectedProfile = scenarioProfiles[scenario] ?? scenarioProfiles.ignore;
  const impact = {
    financial: Math.round(baseFinancial * selectedProfile.financial),
    legal: clamp(Math.round(baseLegal * selectedProfile.legal), 1, 100),
    reputation: clamp(Math.round(baseReputation * selectedProfile.reputation), 1, 100),
    operational: clamp(Math.round(baseOperational * selectedProfile.operational), 1, 100),
    customer: clamp(Math.round(baseCustomer * selectedProfile.customer), 1, 100),
  };

  const scenarioComparisons = Object.entries(scenarioProfiles).map(([id, profile]) => ({
    id,
    financial: Math.round(baseFinancial * profile.financial),
    legal: clamp(Math.round(baseLegal * profile.legal), 1, 100),
    reputation: clamp(Math.round(baseReputation * profile.reputation), 1, 100),
    operational: clamp(Math.round(baseOperational * profile.operational), 1, 100),
    customer: clamp(Math.round(baseCustomer * profile.customer), 1, 100),
  }));

  if (agent && room) {
    try {
      const riskAgent = await wrapAgent(agent, incidentId, room.id, room.bandRoomId);
      await riskAgent.sendMessageToBand(
        null,
        "RISK_UPDATE",
        `Scenario simulated: ${scenario} (${effectiveTimeframe})`,
        { scenario, impact, description: scenarioDescription, timeframe: effectiveTimeframe, baseFinancial, baseLegal, baseReputation }
      );
    } catch {
      // Do not fail simulation if external Band transport is unavailable.
    }
  }

  const confidence = clampFloat(
    0.62 +
      Math.min(0.28, evidenceCount * 0.015 + complianceCount * 0.02 + legalCount * 0.025) +
      Math.min(0.08, avgEvidenceConfidence * 0.08),
    0.5,
    0.96
  );

  return {
    scenario,
    timeframe: effectiveTimeframe,
    description: scenarioDescription,
    impacts: impact,
    recommendation: selectedProfile.recommendation,
    confidence,
    basis: {
      evidenceCount,
      complianceCount,
      legalCount,
      pendingApprovals,
      vendorRiskScore: Math.round(vendorRiskScore),
      latestRiskScore: Math.round(latestRiskScore),
    },
    scenarioComparisons,
    computedAt: new Date().toISOString(),
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function clampFloat(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
