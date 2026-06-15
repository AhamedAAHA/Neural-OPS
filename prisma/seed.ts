/**
 * Neural OPS — Database Seed
 * Run: npm run db:seed
 */
import { config } from "dotenv";
import path from "node:path";
import { getBandAdapter } from "../src/lib/band";
import { createPrismaClient } from "../src/lib/prisma-client-factory";

const root = process.cwd();
config({ path: path.resolve(root, ".env") });
config({ path: path.resolve(root, ".env.local") });
config({ path: path.resolve(root, ".env.development.local") });

if (process.env.SEED_USE_REAL_BAND !== "true") {
  process.env.USE_MOCK_BAND = "true";
}

function ensureDatabaseSchema() {
  const url = process.env.DATABASE_URL;
  if (!url || url.includes("schema=")) return;
  const separator = url.includes("?") ? "&" : "?";
  process.env.DATABASE_URL = `${url}${separator}schema=neural_ops`;
}

ensureDatabaseSchema();

const prisma = createPrismaClient();

async function main() {
  console.log("🌱 Seeding Neural OPS database...");
  if (process.env.USE_MOCK_BAND === "true") {
    console.log("ℹ️  Using mock Band adapter for seed (set SEED_USE_REAL_BAND=true to use live Band API).");
  }

  await prisma.modelInvocation.deleteMany();
  await prisma.voiceCommand.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.executiveReport.deleteMany();
  await prisma.humanApproval.deleteMany();
  await prisma.legalFinding.deleteMany();
  await prisma.complianceFinding.deleteMany();
  await prisma.riskAssessment.deleteMany();
  await prisma.taskHandoff.deleteMany();
  await prisma.evidence.deleteMany();
  await prisma.agentMessage.deleteMany();
  await prisma.agent.deleteMany();
  await prisma.investigationRoom.deleteMany();
  await prisma.incident.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  const organization = await prisma.organization.create({
    data: { name: "Acme Financial Group", slug: "acme-financial-group", industry: "Finance", country: "US" },
  });

  const _admin = await prisma.user.create({
    data: { name: "Admin User", email: "admin@neural-ops.io", role: "admin", organizationId: organization.id },
  });
  const analyst = await prisma.user.create({
    data: { name: "Sarah Chen", email: "analyst@neural-ops.io", role: "analyst", organizationId: organization.id },
  });
  const _executive = await prisma.user.create({
    data: { name: "James Morrison", email: "executive@neural-ops.io", role: "executive", organizationId: organization.id },
  });
  void _admin;
  void _executive;
  await prisma.user.create({
    data: { name: "Risk Officer", email: "risk.officer@neural-ops.io", role: "risk_officer", organizationId: organization.id },
  });

  const band = getBandAdapter();

  const incidents = [
    {
      title: "Vendor ABC suspected of fraud",
      description: "Suspicious vendor payments totaling $847K detected. Finance Manager credentials used for unauthorized approval.",
      type: "Vendor Fraud",
      severity: "critical" as const,
      status: "contained" as const,
    },
    {
      title: "Customer database breach detected",
      description: "Unauthorized bulk export of customer PII from cloud database. GDPR notification may be required.",
      type: "Data Breach",
      severity: "critical" as const,
      status: "investigating" as const,
    },
    {
      title: "Ransomware activity on finance server",
      description: "Encryption activity detected on finance server FS-PROD-01. Containment protocols initiated.",
      type: "Ransomware Attack",
      severity: "critical" as const,
      status: "escalated" as const,
    },
    {
      title: "Social media reputation attack detected",
      description: "Coordinated negative campaign detected across Twitter and LinkedIn targeting brand reputation.",
      type: "Brand Reputation Crisis",
      severity: "high" as const,
      status: "investigating" as const,
    },
  ];

  for (const inc of incidents) {
    const bandRoomId = await band.createRoom(`Investigation: ${inc.title}`, { type: inc.type });
    const incident = await prisma.incident.create({
      data: { ...inc, createdBy: analyst.id, organizationId: organization.id },
    });

    const room = await prisma.investigationRoom.create({
      data: {
        incidentId: incident.id,
        bandRoomId,
        name: `ROOM-${incident.id.slice(-6).toUpperCase()}`,
        status: "active",
      },
    });

    const agentRoles = [
      { name: "Incident Commander Agent", role: "IncidentCommanderAgent", tier: "Investigation" as const },
      { name: "Financial Forensics Agent", role: "FinancialForensicsAgent", tier: "Investigation" as const },
      { name: "Compliance Agent", role: "ComplianceAgent", tier: "Governance" as const },
      { name: "Legal Agent", role: "LegalAgent", tier: "Governance" as const },
      { name: "Future Risk Simulation Agent", role: "FutureRiskSimulationAgent", tier: "Intelligence" as const },
      { name: "Audit Agent", role: "AuditAgent", tier: "Governance" as const },
    ];

    const agents: Awaited<ReturnType<typeof prisma.agent.create>>[] = [];
    for (const a of agentRoles) {
      const agent = await prisma.agent.create({
        data: {
          name: a.name,
          role: a.role,
          tier: a.tier,
          status: "active",
          capabilities: [],
          roomId: room.id,
        },
      });
      await band.recruitAgent(bandRoomId, {
        id: agent.id,
        name: a.name,
        role: a.role,
        tier: a.tier,
        capabilities: [],
      });
      agents.push(agent);
    }

    const [commander, forensics, compliance, legal, risk, audit] = agents;

    // Band messages
    const messages = [
      { from: commander, to: null, type: "AGENT_RECRUITMENT" as const, summary: `Investigation room created for ${inc.title}` },
      { from: commander, to: forensics, type: "AGENT_RECRUITMENT" as const, summary: "Recruited Financial Forensics Agent" },
      { from: forensics, to: compliance, type: "EVIDENCE_SUBMISSION" as const, summary: "Suspicious transaction evidence shared" },
      { from: compliance, to: legal, type: "REVIEW_REQUEST" as const, summary: "GDPR/SOC2 compliance violations flagged" },
      { from: risk, to: commander, type: "RISK_UPDATE" as const, summary: "Risk score calculated" },
      { from: legal, to: null, type: "APPROVAL_REQUEST" as const, summary: "Human approval requested for critical action" },
    ];

    await prisma.bandRoom.create({
      data: {
        incidentId: incident.id,
        organizationId: organization.id,
        roomExternalId: bandRoomId,
        name: room.name,
        status: "active",
        connectedAgents: agents.length,
        messageCount: messages.length,
        lastActivityAt: new Date(),
        metadataJson: { source: "seed", incidentType: inc.type },
      },
    });

    for (const msg of messages) {
      const bandMsgId = await band.sendMessage(bandRoomId, msg.from.id, msg.to?.id ?? null, {
        roomId: bandRoomId,
        fromAgent: msg.from.id,
        toAgent: msg.to?.id ?? null,
        messageType: msg.type,
        incidentId: incident.id,
        summary: msg.summary,
        payload: {},
        createdAt: new Date().toISOString(),
      });

      await prisma.agentMessage.create({
        data: {
          roomId: room.id,
          agentId: msg.from.id,
          recipientAgentId: msg.to?.id,
          messageType: msg.type,
          contentJson: { summary: msg.summary },
          bandMessageId: bandMsgId,
          confidence: 0.9,
        },
      });
    }

    // Evidence
    await prisma.evidence.createMany({
      data: [
        {
          incidentId: incident.id,
          sourceAgentId: forensics.id,
          evidenceType: "transaction",
          title: "Suspicious Invoice",
          description: "Anomalous payment detected",
          confidence: 0.92,
        },
        {
          incidentId: incident.id,
          sourceAgentId: forensics.id,
          evidenceType: "communication",
          title: "Email Thread",
          description: "Pre-approval coordination emails",
          confidence: 0.89,
        },
      ],
    });

    // Handoff
    await prisma.taskHandoff.create({
      data: {
        roomId: room.id,
        fromAgentId: commander.id,
        toAgentId: forensics.id,
        taskTitle: "Analyze vendor payment trail",
        taskPayloadJson: { vendor: "Vendor ABC" },
        status: "completed",
        completedAt: new Date(),
      },
    });

    // Risk
    await prisma.riskAssessment.create({
      data: {
        incidentId: incident.id,
        riskScore: inc.severity === "critical" ? 87 : 62,
        financialImpact: 2400000,
        legalImpact: 85,
        reputationImpact: 75,
        operationalImpact: 45,
        customerImpact: 60,
        recommendation: "Freeze payments and initiate forensic audit",
        generatedByAgentId: risk.id,
      },
    });

    // Compliance
    await prisma.complianceFinding.createMany({
      data: [
        { incidentId: incident.id, regulation: "GDPR", finding: "Potential breach notification required", severity: "high", requiredAction: "Prepare notification draft", generatedByAgentId: compliance.id },
        { incidentId: incident.id, regulation: "SOC2", finding: "CC6.1 access control violation", severity: "critical", requiredAction: "Remediate access gaps", generatedByAgentId: compliance.id },
      ],
    });

    // Legal
    await prisma.legalFinding.create({
      data: {
        incidentId: incident.id,
        liability: "Securities fraud implications possible",
        disclosureRequirement: "Regulatory disclosure within 72 hours",
        legalExposure: 85,
        recommendedAction: "Engage external counsel",
        generatedByAgentId: legal.id,
      },
    });

    // Approval (first incident only)
    if (inc.title.includes("Vendor ABC")) {
      await prisma.humanApproval.create({
        data: {
          incidentId: incident.id,
          requestedByAgentId: legal.id,
          actionTitle: "Freeze vendor payments and notify stakeholders",
          actionDescription: "Critical action requiring executive approval",
          riskLevel: "high",
          status: "approved",
          decisionNote: "Auto-approved by Neural OPS policy (admin-operated deployment)",
        },
      });
    }

    // Executive report
    await prisma.executiveReport.create({
      data: {
        incidentId: incident.id,
        summary: `Executive summary for ${inc.title}. Multi-agent investigation complete.`,
        timelineJson: [{ time: new Date().toISOString(), action: "investigation_started" }],
        evidenceJson: [{ title: "Suspicious Invoice" }],
        riskJson: { score: 87 },
        complianceJson: [{ regulation: "GDPR" }],
        legalJson: [{ liability: "Under review" }],
        recommendationsJson: ["Freeze payments", "Rotate credentials", "Forensic audit"],
        agentContributionJson: agents.map((a) => ({ name: a.name, role: a.role })),
        approvalHistoryJson: [],
      },
    });

    // Voice commands
    await prisma.voiceCommand.create({
      data: {
        userId: analyst.id,
        incidentId: incident.id,
        transcript: "Start investigation for Vendor ABC fraud",
        intent: "CREATE_INCIDENT",
        confidence: 0.9,
        routedAgentId: commander.id,
      },
    });

    // Model invocations
    await prisma.modelInvocation.createMany({
      data: [
        { provider: "AIML_API", model: "gpt-4o-mini", agentId: forensics.id, incidentId: incident.id, promptTokens: 1200, completionTokens: 450, latencyMs: 890 },
        { provider: "FEATHERLESS", model: "llama-3.3-70b", agentId: risk.id, incidentId: incident.id, promptTokens: 800, completionTokens: 320, latencyMs: 1200 },
        { provider: "LOCAL", model: "local-deterministic", agentId: audit.id, incidentId: incident.id, promptTokens: 0, completionTokens: 0, latencyMs: 1 },
      ],
    });

    // Audit logs
    await prisma.auditLog.createMany({
      data: [
        { organizationId: organization.id, incidentId: incident.id, actorType: "user", actorId: analyst.id, action: "incident_created", detailsJson: { title: inc.title } },
        { organizationId: organization.id, incidentId: incident.id, actorType: "agent", actorId: commander.id, action: "band_message_sent", detailsJson: { type: "AGENT_RECRUITMENT" } },
        { organizationId: organization.id, incidentId: incident.id, actorType: "agent", actorId: audit.id, action: "audit_complete", detailsJson: { records: 47 } },
      ],
    });

    console.log(`  ✓ Incident: ${inc.title}`);
  }

  console.log("\n✅ Seed complete!");
  console.log(`   Users: admin, analyst, executive, risk_officer`);
  console.log(`   Incidents: ${incidents.length}`);
  console.log(`   Login: admin@neural-ops.io (first password you enter becomes your credential)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
