import { prisma } from "@/lib/db";
import { wrapAgent } from "@/lib/agents/registry";

export async function reviewCompliance(incidentId: string, regulations: string[]) {
  const room = await prisma.investigationRoom.findFirst({ where: { incidentId } });
  const agent = await prisma.agent.findFirst({ where: { role: "ComplianceAgent", room: { incidentId } } });
  if (!agent || !room) throw new Error("Compliance agent or room not found");

  const complianceAgent = await wrapAgent(agent, incidentId, room.id, room.bandRoomId);
  const analysis = await complianceAgent.analyze({ incidentId, regulations });

  const findings = [];
  for (const regulation of regulations) {
    const finding = await prisma.complianceFinding.create({
      data: {
        incidentId,
        regulation,
        finding: (analysis[`${regulation}_finding`] as string) ?? `${regulation} review completed — violations detected`,
        severity: "high",
        requiredAction: (analysis[`${regulation}_action`] as string) ?? "Remediate identified gaps",
        generatedByAgentId: agent.id,
      },
    });
    findings.push(finding);
  }

  const legalAgent = await prisma.agent.findFirst({ where: { role: "LegalAgent", room: { incidentId } } });
  if (legalAgent) {
    await complianceAgent.sendMessageToBand(legalAgent.id, "REVIEW_REQUEST", "Compliance findings ready for legal review", { findings: findings.map((f) => f.id) });
  }

  return findings;
}

export async function reviewLegal(incidentId: string) {
  const room = await prisma.investigationRoom.findFirst({ where: { incidentId } });
  const agent = await prisma.agent.findFirst({ where: { role: "LegalAgent", room: { incidentId } } });
  if (!agent || !room) throw new Error("Legal agent or room not found");

  const legalAgent = await wrapAgent(agent, incidentId, room.id, room.bandRoomId);
  const analysis = await legalAgent.analyze({ incidentId });

  const finding = await prisma.legalFinding.create({
    data: {
      incidentId,
      liability: (analysis.liability as string) ?? "Legal exposure under review",
      disclosureRequirement: (analysis.disclosureRequirement as string) ?? "Assess regulatory disclosure requirements",
      legalExposure: (analysis.legalExposure as number) ?? 70,
      recommendedAction: (analysis.recommendedAction as string) ?? "Engage legal counsel",
      generatedByAgentId: agent.id,
    },
  });

  return finding;
}
