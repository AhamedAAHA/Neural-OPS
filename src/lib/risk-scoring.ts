import type { RiskBreakdown } from "./types";

export function calculateEnterpriseRiskScore(breakdown: RiskBreakdown): number {
  const total =
    breakdown.threatSeverity +
    breakdown.financialExposure +
    breakdown.complianceExposure +
    breakdown.vendorRisk +
    breakdown.operationalImpact +
    breakdown.reputationImpact;
  return Math.min(100, Math.max(0, Math.round(total)));
}

export function deriveRiskBreakdown(params: {
  threatSeverity?: number;
  financialExposure?: number;
  complianceExposure?: number;
  vendorRisk?: number;
  operationalImpact?: number;
  reputationImpact?: number;
}): RiskBreakdown {
  return {
    threatSeverity: params.threatSeverity ?? 0,
    financialExposure: params.financialExposure ?? 0,
    complianceExposure: params.complianceExposure ?? 0,
    vendorRisk: params.vendorRisk ?? 0,
    operationalImpact: params.operationalImpact ?? 0,
    reputationImpact: params.reputationImpact ?? 0,
  };
}

export function riskLevelFromScore(score: number): "critical" | "high" | "medium" | "low" {
  if (score >= 85) return "critical";
  if (score >= 70) return "high";
  if (score >= 45) return "medium";
  return "low";
}
