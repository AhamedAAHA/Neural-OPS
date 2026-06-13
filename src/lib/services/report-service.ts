import { prisma } from "@/lib/db";
import { broadcastEvent } from "@/lib/realtime/broadcaster";
import { wrapAgent } from "@/lib/agents/registry";

export async function generateExecutiveReport(incidentId: string) {
  const incident = await prisma.incident.findUnique({
    where: { id: incidentId },
    include: {
      evidence: true,
      riskAssessments: { orderBy: { createdAt: "desc" }, take: 1 },
      complianceFindings: true,
      legalFindings: true,
      approvals: true,
      rooms: { include: { messages: { include: { agent: true }, orderBy: { createdAt: "asc" } }, agents: true } },
      auditLogs: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!incident) throw new Error("Incident not found");

  const room = incident.rooms[0];
  const execAgent = incident.rooms[0]?.agents.find((a) => a.role === "ExecutiveStrategyAgent");
  let aiSummary = `Executive summary for ${incident.title}: Multi-agent investigation complete.`;

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

  const report = await prisma.executiveReport.create({
    data: {
      incidentId,
      summary: aiSummary,
      timelineJson: timeline as object,
      evidenceJson: incident.evidence as object,
      riskJson: (incident.riskAssessments[0] ?? {}) as object,
      complianceJson: incident.complianceFindings as object,
      legalJson: incident.legalFindings as object,
      recommendationsJson: [
        "Freeze vendor payments immediately",
        "Rotate compromised credentials",
        "Initiate forensic audit",
        "Prepare regulatory disclosure",
      ] as object,
      agentContributionJson: room?.agents.map((a) => ({ id: a.id, name: a.name, role: a.role })) ?? [] as object,
      approvalHistoryJson: incident.approvals as object,
    },
  });

  await broadcastEvent({ type: "report_generated", incidentId, payload: { report } });
  return report;
}

export async function getReport(id: string) {
  return prisma.executiveReport.findUnique({ where: { id }, include: { incident: true } });
}
