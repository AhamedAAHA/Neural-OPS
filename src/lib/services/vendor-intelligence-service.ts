import { prisma } from "@/lib/db";
import { broadcastEvent } from "@/lib/realtime/broadcaster";

interface VendorInvestigationScores {
  vendorRiskScore: number;
  reputationScore: number;
  exposureScore: number;
}

export async function propagateVendorInvestigationResults(params: {
  incidentId: string;
  organizationId: string;
  vendorId: string;
  vendorName: string;
  intelligenceId: string;
  summary: string;
  scores: VendorInvestigationScores;
  agentId?: string;
}) {
  const agentId = params.agentId ?? "vendor-intelligence-agent";
  const compositeRisk = Math.round(
    params.scores.vendorRiskScore * 0.55 + params.scores.exposureScore * 0.45
  );
  const financialImpact = Math.round(
    95000 + params.scores.vendorRiskScore * 9200 + params.scores.exposureScore * 1800
  );

  const assessment = await prisma.riskAssessment.create({
    data: {
      incidentId: params.incidentId,
      riskScore: compositeRisk,
      financialImpact,
      legalImpact: Math.min(100, Math.round(params.scores.exposureScore * 0.72)),
      reputationImpact: Math.min(100, Math.round(Math.max(8, 100 - params.scores.reputationScore))),
      operationalImpact: Math.min(100, Math.round(params.scores.vendorRiskScore * 0.58)),
      customerImpact: Math.min(100, Math.round(params.scores.exposureScore * 0.52)),
      recommendation:
        params.scores.vendorRiskScore >= 70
          ? `High vendor risk detected for ${params.vendorName}. Freeze payments and escalate to legal/compliance. ${params.summary}`
          : `Vendor due diligence completed for ${params.vendorName}. Continue monitoring with enhanced controls. ${params.summary}`,
      generatedByAgentId: agentId,
    },
  });

  await prisma.auditLog.create({
    data: {
      organizationId: params.organizationId,
      incidentId: params.incidentId,
      actorType: "system",
      actorId: "vendor_intelligence_engine",
      action: "vendor_intelligence_propagated",
      detailsJson: {
        vendorId: params.vendorId,
        vendorName: params.vendorName,
        intelligenceId: params.intelligenceId,
        riskAssessmentId: assessment.id,
        scores: params.scores,
      },
    },
  });

  await broadcastEvent({
    type: "risk_update",
    incidentId: params.incidentId,
    payload: {
      assessment,
      vendorName: params.vendorName,
      intelligenceId: params.intelligenceId,
      source: "vendor_investigation",
    },
  });

  await broadcastEvent({
    type: "evidence_created",
    incidentId: params.incidentId,
    payload: {
      vendorName: params.vendorName,
      intelligenceId: params.intelligenceId,
      source: "bright_data_engine",
    },
  });

  return assessment;
}
