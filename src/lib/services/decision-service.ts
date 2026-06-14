import { prisma } from "@/lib/db";
import type { DecisionOption } from "@/lib/types";
import { ApiNotFoundError } from "@/lib/auth/rbac";

const APPROVAL_CHAIN_TEMPLATE = [
  { order: 1, role: "Compliance Manager" },
  { order: 2, role: "Legal Counsel" },
  { order: 3, role: "Risk Officer" },
  { order: 4, role: "CISO" },
  { order: 5, role: "Executive" },
] as const;

interface DecisionEngineResult {
  incidentId: string;
  recommendedAction: string;
  financialImpact: number;
  complianceImpact: number;
  legalExposure: number;
  operationalImpact: number;
  reputationImpact: number;
  confidenceScore: number;
  reasoningChain: string[];
  ranking: DecisionOption[];
  approvalChain: Array<{
    id: string;
    role: string;
    name: string;
    status: "pending" | "approved" | "rejected" | "escalated";
    timestamp: string | null;
    note: string | null;
  }>;
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function mapSeverityToWeight(severity: "critical" | "high" | "medium" | "low") {
  if (severity === "critical") return 30;
  if (severity === "high") return 22;
  if (severity === "medium") return 14;
  return 8;
}

export async function ensureApprovalChain(
  incidentId: string,
  organizationId: string,
  requestedById: string,
  recommendation: { action: string; reason: string; riskLevel: "critical" | "high" | "medium" | "low" }
) {
  const existing = await prisma.approval.findMany({
    where: { incidentId, organizationId },
    orderBy: [{ chainOrder: "asc" }, { createdAt: "asc" }],
  });
  if (existing.length > 0) return existing;

  const chainId = `chain_${incidentId}_${Date.now()}`;
  await prisma.approval.createMany({
    data: APPROVAL_CHAIN_TEMPLATE.map((step) => ({
      organizationId,
      incidentId,
      chainId,
      chainOrder: step.order,
      approverRole: step.role,
      approverName: step.role === "Executive" ? "Executive Board" : null,
      requestedById,
      title: recommendation.action,
      description: recommendation.reason,
      riskLevel: recommendation.riskLevel,
      status: "pending",
    })),
  });

  const created = await prisma.approval.findMany({
    where: { incidentId, organizationId, chainId },
    orderBy: [{ chainOrder: "asc" }, { createdAt: "asc" }],
  });

  await prisma.auditLog.create({
    data: {
      organizationId,
      incidentId,
      actorType: "user",
      actorId: requestedById,
      action: "approval_chain_created",
      detailsJson: {
        chainId,
        steps: created.map((s) => ({ id: s.id, role: s.approverRole, order: s.chainOrder })),
      },
    },
  });

  return created;
}

export async function buildExecutiveDecision(incidentId: string, organizationId?: string): Promise<DecisionEngineResult> {
  const incident = await prisma.incident.findFirst({
    where: { id: incidentId, ...(organizationId ? { organizationId } : {}) },
    include: {
      evidence: true,
      riskAssessments: { orderBy: { createdAt: "desc" }, take: 1 },
      complianceFindings: true,
      legalFindings: true,
      vendorIntelligence: { orderBy: { createdAt: "desc" } },
      approvalRecords: { orderBy: [{ chainOrder: "asc" }, { createdAt: "asc" }] },
      documents: { include: { chunks: true } },
      auditLogs: { orderBy: { createdAt: "desc" }, take: 30 },
    },
  });

  if (!incident) throw new ApiNotFoundError("Incident not found");

  const latestRisk = incident.riskAssessments[0];
  const avgVendorRisk = incident.vendorIntelligence.length
    ? incident.vendorIntelligence.reduce((acc, finding) => acc + finding.riskScore, 0) / incident.vendorIntelligence.length
    : 0;
  const vendorDrivenFinancial = avgVendorRisk > 0 ? Math.round(avgVendorRisk * 15000 + incident.vendorIntelligence.length * 45000) : 0;
  const financialImpact = Math.max(latestRisk?.financialImpact ?? incident.evidence.length * 120000, vendorDrivenFinancial);
  const complianceImpact = clampPercent(
    incident.complianceFindings.reduce((acc, finding) => acc + mapSeverityToWeight(finding.severity), 0)
  );
  const legalExposure = clampPercent(
    latestRisk?.legalImpact ??
      (incident.legalFindings.length
        ? incident.legalFindings.reduce((acc, finding) => acc + finding.legalExposure, 0) / incident.legalFindings.length
        : 12)
  );
  const operationalImpact = clampPercent(
    latestRisk?.operationalImpact ?? Math.min(incident.evidence.length * 8 + incident.vendorIntelligence.length * 7, 95)
  );
  const reputationImpact = clampPercent(
    latestRisk?.reputationImpact ?? Math.min(incident.vendorIntelligence.length * 9 + incident.legalFindings.length * 8, 90)
  );

  const confidenceScore = clampPercent(
    55 +
      Math.min(20, incident.evidence.length * 4) +
      Math.min(10, incident.vendorIntelligence.length * 3) +
      Math.min(10, incident.auditLogs.length / 3)
  );

  const options: DecisionOption[] = [
    {
      id: "freeze_vendor",
      label: "Freeze Vendor Exposure",
      rank: 0,
      recommended: false,
      confidence: clampPercent(confidenceScore + 4),
      expectedSavings: Math.round(financialImpact * 0.45),
      impacts: {
        financial: clampPercent(Math.min(95, financialImpact / 40000)),
        compliance: clampPercent(complianceImpact * 0.5),
        legal: clampPercent(legalExposure * 0.55),
        operational: clampPercent(operationalImpact * 0.8),
        customer: clampPercent(Math.max(8, operationalImpact * 0.6)),
        reputation: clampPercent(reputationImpact * 0.7),
      },
      agentSupport: ["Incident Commander", "Compliance Agent", "Risk Agent"],
      agentOpposition: legalExposure > 70 ? ["Legal Agent"] : [],
      rationale: "Immediate containment to prevent additional financial loss while preserving evidentiary trail.",
    },
    {
      id: "deep_forensic_audit",
      label: "Launch Deep Forensic Audit",
      rank: 0,
      recommended: false,
      confidence: clampPercent(confidenceScore),
      expectedSavings: Math.round(financialImpact * 0.32),
      impacts: {
        financial: clampPercent(Math.min(88, financialImpact / 52000)),
        compliance: clampPercent(Math.max(20, complianceImpact * 0.7)),
        legal: clampPercent(Math.max(20, legalExposure * 0.6)),
        operational: clampPercent(Math.max(15, operationalImpact * 0.55)),
        customer: clampPercent(Math.max(10, operationalImpact * 0.4)),
        reputation: clampPercent(Math.max(10, reputationImpact * 0.45)),
      },
      agentSupport: ["Digital Forensics Agent", "Audit Agent", "Executive Strategy Agent"],
      agentOpposition: [],
      rationale: "Preserves legal and compliance defensibility with stronger fact development before irreversible decisions.",
    },
    {
      id: "enhanced_monitoring",
      label: "Enhanced Monitoring and Controls",
      rank: 0,
      recommended: false,
      confidence: clampPercent(confidenceScore - 8),
      expectedSavings: Math.round(financialImpact * 0.2),
      impacts: {
        financial: clampPercent(Math.min(60, financialImpact / 73000)),
        compliance: clampPercent(Math.max(30, complianceImpact * 0.9)),
        legal: clampPercent(Math.max(35, legalExposure * 0.95)),
        operational: clampPercent(Math.max(5, operationalImpact * 0.35)),
        customer: clampPercent(Math.max(3, operationalImpact * 0.25)),
        reputation: clampPercent(Math.max(20, reputationImpact * 0.8)),
      },
      agentSupport: ["Operations Agent"],
      agentOpposition: ["Risk Agent"],
      rationale: "Minimizes short-term disruption but retains higher residual legal and financial exposure.",
    },
    {
      id: "terminate_relationship",
      label: "Terminate Vendor Relationship",
      rank: 0,
      recommended: false,
      confidence: clampPercent(confidenceScore - 3),
      expectedSavings: Math.round(financialImpact * 0.38),
      impacts: {
        financial: clampPercent(Math.min(85, financialImpact / 48000)),
        compliance: clampPercent(Math.max(18, complianceImpact * 0.45)),
        legal: clampPercent(Math.max(22, legalExposure * 0.7)),
        operational: clampPercent(Math.max(40, operationalImpact * 1.15)),
        customer: clampPercent(Math.max(20, operationalImpact * 0.85)),
        reputation: clampPercent(Math.max(15, reputationImpact * 0.55)),
      },
      agentSupport: ["Legal Agent", "Vendor Intelligence Agent"],
      agentOpposition: ["Executive Strategy Agent"],
      rationale: "Strong long-term isolation posture with significant operational and contractual transition costs.",
    },
  ];

  const ranked = rankDecisionOptions(options).map((option, index) => ({
    ...option,
    rank: index + 1,
    recommended: index === 0,
  }));
  const top = ranked[0];

  const reasoningChain = [
    `${incident.evidence.length} evidence items and ${incident.vendorIntelligence.length} intelligence findings were analyzed.`,
    ...(incident.vendorIntelligence[0]?.summary
      ? [`Latest vendor intelligence: ${incident.vendorIntelligence[0].summary.slice(0, 180)}`]
      : []),
    ...(avgVendorRisk > 0 ? [`Average vendor risk score ${Math.round(avgVendorRisk)}/100 from live Bright Data investigation.`] : []),
    `Financial exposure estimated at ${Math.round(financialImpact).toLocaleString("en-US")} with legal exposure ${legalExposure}%.`,
    `Compliance findings severity translates to impact score ${complianceImpact}% across active frameworks.`,
    `Operational impact ${operationalImpact}% and reputation impact ${reputationImpact}% informed trade-off scoring.`,
    `Top recommendation ranked by weighted containment score and confidence ${top.confidence}%.`,
  ];

  const approvalChain = incident.approvalRecords
    .filter((approval) => approval.chainOrder !== null)
    .sort((a, b) => (a.chainOrder ?? 0) - (b.chainOrder ?? 0))
    .map((approval) => ({
      id: approval.id,
      role: approval.approverRole ?? "Approver",
      name: approval.approverName ?? approval.approverRole ?? "Approver",
      status: approval.status,
      timestamp: approval.updatedAt ? approval.updatedAt.toISOString() : null,
      note: approval.decisionNote,
    }));

  return {
    incidentId,
    recommendedAction: top.label,
    financialImpact,
    complianceImpact,
    legalExposure,
    operationalImpact,
    reputationImpact,
    confidenceScore: top.confidence,
    reasoningChain,
    ranking: ranked,
    approvalChain,
  };
}

export async function getDecisionOptions(incidentId?: string): Promise<DecisionOption[]> {
  if (!incidentId) return [];
  const result = await buildExecutiveDecision(incidentId);
  return result.ranking;
}

export async function getExecutiveRecommendation(incidentId?: string) {
  if (!incidentId) return null;
  const result = await buildExecutiveDecision(incidentId);
  return {
    action: result.recommendedAction,
    reason: result.reasoningChain[0] ?? "Decision generated from live investigation data.",
    expectedSavings: result.ranking[0]?.expectedSavings ?? 0,
    complianceImpact: `${result.complianceImpact}%`,
    operationalImpact: `${result.operationalImpact}%`,
    legalExposure: `${result.legalExposure}%`,
    confidence: result.confidenceScore,
    ranking: result.ranking.map((entry) => entry.label),
  };
}

export function rankDecisionOptions(options: DecisionOption[]): DecisionOption[] {
  return [...options].sort((a, b) => {
    const aScore = a.confidence + a.impacts.financial - (a.impacts.legal * 0.28 + a.impacts.operational * 0.22);
    const bScore = b.confidence + b.impacts.financial - (b.impacts.legal * 0.28 + b.impacts.operational * 0.22);
    return bScore - aScore;
  });
}
