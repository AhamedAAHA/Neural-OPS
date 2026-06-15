import { prisma } from "@/lib/db";
import { broadcastEvent } from "@/lib/realtime/broadcaster";
import { createDbAgent, wrapAgent } from "@/lib/agents/registry";
import { BandService } from "@/lib/band";

const DEFAULT_INVESTIGATION_RECRUITMENTS = [
  "DigitalForensicsAgent",
  "FinancialForensicsAgent",
  "IdentityInvestigationAgent",
  "CommunicationAnalysisAgent",
  "ComplianceAgent",
  "FutureRiskSimulationAgent",
  "LegalAgent",
  "AuditAgent",
  "ExecutiveStrategyAgent",
];

export async function startInvestigationWorkflow(incidentId: string) {
  const bandService = new BandService();
  const incident = await prisma.incident.findUnique({
    where: { id: incidentId },
    include: { rooms: { include: { agents: true } } },
  });
  if (!incident || !incident.rooms[0]) throw new Error("Incident or room not found");

  const room = incident.rooms[0];
  let commander = room.agents.find((a) => a.role === "IncidentCommanderAgent");
  if (!commander) {
    commander = await createDbAgent("IncidentCommanderAgent", room.id);
  }

  const commanderAgent = await wrapAgent(commander, incidentId, room.id, room.bandRoomId);

  await prisma.incident.update({ where: { id: incidentId }, data: { status: "investigating" } });
  await broadcastEvent({ type: "incident_status", incidentId, payload: { status: "investigating" } });

  await commanderAgent.sendMessageToBand(null, "CONTEXT_SHARE", `Investigation started: ${incident.title}`, {
    description: incident.description,
    type: incident.type,
    severity: incident.severity,
  });

  const recruited: string[] = [];
  for (const role of DEFAULT_INVESTIGATION_RECRUITMENTS) {
    const agent = await createDbAgent(role, room.id);
    const def = (await import("@/lib/agents/registry")).AGENT_DEFINITIONS.find((d) => d.role === role)!;
    await bandService.recruitAgent(
      room.bandRoomId,
      {
        id: agent.id,
        name: def.name,
        role: def.role,
        tier: def.tier,
        capabilities: def.capabilities,
      },
      { incidentId, roomId: room.id, organizationId: incident.organizationId ?? undefined }
    );
    await commanderAgent.sendMessageToBand(agent.id, "AGENT_RECRUITMENT", `Recruited ${def.name}`, { agentId: agent.id });
    recruited.push(agent.id);
  }

  await runAutomatedInvestigationFlow(incidentId, room.id, room.bandRoomId, commander.id, recruited, incident.title);

  return { incidentId, roomId: room.id, recruitedAgents: recruited.length };
}

async function runAutomatedInvestigationFlow(
  incidentId: string,
  roomId: string,
  bandRoomId: string,
  commanderId: string,
  agentIds: string[],
  incidentTitle: string
) {
  const agents = await prisma.agent.findMany({ where: { id: { in: agentIds } } });
  const byRole = Object.fromEntries(agents.map((a) => [a.role, a]));

  const ff = await wrapAgent(byRole.FinancialForensicsAgent, incidentId, roomId, bandRoomId);
  const df = await wrapAgent(byRole.DigitalForensicsAgent, incidentId, roomId, bandRoomId);
  const idAgent = await wrapAgent(byRole.IdentityInvestigationAgent, incidentId, roomId, bandRoomId);
  const ca = await wrapAgent(byRole.CommunicationAnalysisAgent, incidentId, roomId, bandRoomId);
  const cp = await wrapAgent(byRole.ComplianceAgent, incidentId, roomId, bandRoomId);
  const lg = await wrapAgent(byRole.LegalAgent, incidentId, roomId, bandRoomId);
  const rs = await wrapAgent(byRole.FutureRiskSimulationAgent, incidentId, roomId, bandRoomId);
  const es = await wrapAgent(byRole.ExecutiveStrategyAgent, incidentId, roomId, bandRoomId);
  const au = await wrapAgent(byRole.AuditAgent, incidentId, roomId, bandRoomId);

  // Financial forensics evidence
  const ffAnalysis = await ff.analyze({ incident: incidentTitle, focus: "payments" });
  const evidence1 = await saveEvidence(incidentId, byRole.FinancialForensicsAgent.id, {
    evidenceType: "transaction",
    title: "Suspicious Invoice #INV-9847",
    description: `Invoice for $847,000 with irregular approval chain linked to ${incidentTitle}`,
    confidence: 0.92,
    metadata: ffAnalysis,
  });
  await ff.sendMessageToBand(byRole.ComplianceAgent.id, "EVIDENCE_SUBMISSION", "Suspicious vendor payment detected", {
    evidenceId: evidence1.id, amount: 847000,
  }, { confidence: 0.92 });
  await ff.handoffTask(byRole.CommunicationAnalysisAgent.id, "Build communication timeline", { incident: incidentTitle });

  // Digital forensics → identity
  await df.sendMessageToBand(byRole.IdentityInvestigationAgent.id, "TASK_HANDOFF", "Unusual login detected at 02:14 UTC", { account: "Finance Manager" });
  const idAnalysis = await idAgent.analyze({ account: "Finance Manager", event: "privilege_abuse" });
  const evidence2 = await saveEvidence(incidentId, byRole.IdentityInvestigationAgent.id, {
    evidenceType: "identity",
    title: "Privilege Abuse Confirmed",
    description: `Finance Manager credentials used to approve suspicious invoice linked to ${incidentTitle}`,
    confidence: 0.94,
    metadata: idAnalysis,
  });
  await idAgent.sendMessageToBand(commanderId, "EVIDENCE_SUBMISSION", "Privilege abuse confirmed", { evidenceId: evidence2.id }, { confidence: 0.94 });

  // Communication analysis
  const caAnalysis = await ca.analyze({ incident: incidentTitle, type: "email" });
  await ca.sendMessageToBand(commanderId, "EVIDENCE_SUBMISSION", "Email coordination thread discovered", caAnalysis as Record<string, unknown>, { confidence: 0.89 });

  // Compliance review
  const cpAnalysis = await cp.analyze({ evidence: [evidence1.id, evidence2.id], frameworks: ["GDPR", "SOC2", "ISO 27001"] });
  await prisma.complianceFinding.createMany({
    data: [
      { incidentId, regulation: "GDPR", finding: "Art. 33 breach notification may be required", severity: "high", requiredAction: "Prepare breach notification draft", generatedByAgentId: byRole.ComplianceAgent.id },
      { incidentId, regulation: "SOC2", finding: "CC6.1 logical access controls bypassed", severity: "critical", requiredAction: "Remediate access control gaps", generatedByAgentId: byRole.ComplianceAgent.id },
      { incidentId, regulation: "ISO 27001", finding: "A.9.2.3 privileged access management failure", severity: "high", requiredAction: "Implement PAM solution", generatedByAgentId: byRole.ComplianceAgent.id },
    ],
  });
  await cp.sendMessageToBand(byRole.LegalAgent.id, "REVIEW_REQUEST", "Compliance violations flagged for legal review", cpAnalysis as Record<string, unknown>);

  // Risk assessment
  const risk = await prisma.riskAssessment.create({
    data: {
      incidentId,
      riskScore: 87,
      financialImpact: 2400000,
      legalImpact: 85,
      reputationImpact: 75,
      operationalImpact: 45,
      customerImpact: 60,
      recommendation: "Freeze vendor payments, rotate credentials, initiate forensic audit",
      generatedByAgentId: byRole.FutureRiskSimulationAgent.id,
    },
  });
  await rs.sendMessageToBand(byRole.ExecutiveStrategyAgent.id, "RISK_UPDATE", "Fraud probability: 91%. Estimated exposure: $2.4M", { riskId: risk.id, riskScore: 87 }, { confidence: 0.91 });

  // Legal → human approval
  await prisma.legalFinding.create({
    data: {
      incidentId,
      liability: "Potential securities fraud implications",
      disclosureRequirement: "Regulatory disclosure may be required within 72 hours",
      legalExposure: 85,
      recommendedAction: "Engage external counsel and freeze vendor payments",
      generatedByAgentId: byRole.LegalAgent.id,
    },
  });
  await lg.requestHumanApproval(
    "Freeze vendor payments and notify stakeholders",
    "Legal review confirms high-risk vendor fraud. Recommend immediate payment freeze and stakeholder notification.",
    "high"
  );

  // Executive strategy — auto-approved under admin-operated policy
  await es.sendMessageToBand(null, "DECISION", "Investigation complete. Recommended actions auto-approved and queued for execution.", {
    recommendation: "Freeze payments + initiate forensic audit + prepare disclosure",
    autoApproved: true,
  });

  // Audit
  await au.analyze({ action: "workflow_complete", evidenceCount: 2 });
  await au.sendMessageToBand(null, "CONTEXT_SHARE", "All agent actions recorded. Full audit trail available.", { evidenceCount: 2 });

  await prisma.incident.update({ where: { id: incidentId }, data: { status: "contained" } });
  await broadcastEvent({ type: "incident_status", incidentId, payload: { status: "contained", riskScore: 87 } });
}

async function saveEvidence(
  incidentId: string,
  sourceAgentId: string,
  data: { evidenceType: string; title: string; description: string; confidence: number; metadata?: Record<string, unknown> }
) {
  const evidence = await prisma.evidence.create({
    data: {
      incidentId,
      sourceAgentId,
      evidenceType: data.evidenceType,
      title: data.title,
      description: data.description,
      confidence: data.confidence,
      metadataJson: (data.metadata ?? {}) as object,
    },
  });
  await broadcastEvent({ type: "evidence_created", incidentId, payload: { evidence } });
  return evidence;
}

export { saveEvidence };
