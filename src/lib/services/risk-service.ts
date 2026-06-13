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

export async function simulateRisk(incidentId: string, scenario: string, scenarioDescription?: string) {
  const incident = await prisma.incident.findUnique({ where: { id: incidentId } });
  if (!incident) throw new Error("Incident not found");

  const agent = await prisma.agent.findFirst({ where: { role: "FutureRiskSimulationAgent", room: { incidentId } } });
  const room = await prisma.investigationRoom.findFirst({ where: { incidentId } });

  const scenarios: Record<string, { financial: number; legal: number; reputation: number; operational: number; customer: number; recommendation: string }> = {
    ignore: { financial: 4200000, legal: 95, reputation: 90, operational: 10, customer: 80, recommendation: "Strongly not recommended" },
    shutdown: { financial: 450000, legal: 40, reputation: 25, operational: 85, customer: 35, recommendation: "Targeted isolation recommended" },
    notify: { financial: 320000, legal: 25, reputation: 45, operational: 5, customer: 60, recommendation: "Approve after legal review" },
    freeze: { financial: 120000, legal: 15, reputation: 20, operational: 15, customer: 10, recommendation: "Approve — highest priority" },
    audit: { financial: 220000, legal: 15, reputation: 25, operational: 10, customer: 10, recommendation: "Approve for regulatory compliance" },
  };

  const impact = scenarios[scenario] ?? scenarios.ignore;

  if (agent && room) {
    const riskAgent = await wrapAgent(agent, incidentId, room.id, room.bandRoomId);
    await riskAgent.sendMessageToBand(null, "RISK_UPDATE", `Scenario simulated: ${scenario}`, { scenario, impact, description: scenarioDescription });
  }

  return { scenario, description: scenarioDescription, impacts: impact, confidence: 0.88 };
}
