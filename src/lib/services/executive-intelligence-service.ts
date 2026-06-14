import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { recordMonitoringEvent } from "@/lib/observability/store";

interface ForecastPoint {
  horizonDays: 30 | 90 | 180;
  expectedIncidents: number;
  expectedLosses: number;
  expectedComplianceExposure: number;
  vendorRiskTrend: number;
}

interface ExecutiveForecastPayload {
  generatedAt: string;
  historicalWindowDays: number;
  outlook: ForecastPoint[];
  trendSummary: {
    incidentTrendPct: number;
    lossTrendPct: number;
    complianceTrendPct: number;
    vendorRiskTrendPct: number;
  };
  boardSummary: string;
  recommendations: string[];
}

function safeDivide(numerator: number, denominator: number) {
  return denominator > 0 ? numerator / denominator : 0;
}

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function pctChange(current: number, previous: number) {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function severityWeight(severity: string) {
  if (severity === "critical") return 4;
  if (severity === "high") return 3;
  if (severity === "medium") return 2;
  return 1;
}

export class EnterpriseForecastAgent {
  async buildForecast(organizationId: string, incidentId?: string): Promise<ExecutiveForecastPayload> {
    const started = Date.now();
    const now = new Date();
    const windowStart = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    const recent30Start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const prior30Start = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const [incidents, riskAssessments, complianceFindings, vendorIntel] = await Promise.all([
      prisma.incident.findMany({
        where: {
          organizationId,
          createdAt: { gte: windowStart },
          ...(incidentId ? { id: incidentId } : {}),
        },
        select: { id: true, createdAt: true, severity: true, status: true },
      }),
      prisma.riskAssessment.findMany({
        where: {
          incident: { organizationId },
          createdAt: { gte: windowStart },
          ...(incidentId ? { incidentId } : {}),
        },
        select: { incidentId: true, createdAt: true, financialImpact: true, riskScore: true },
      }),
      prisma.complianceFinding.findMany({
        where: {
          incident: { organizationId },
          createdAt: { gte: windowStart },
          ...(incidentId ? { incidentId } : {}),
        },
        select: { createdAt: true, severity: true },
      }),
      prisma.vendorIntelligence.findMany({
        where: {
          organizationId,
          createdAt: { gte: windowStart },
          ...(incidentId ? { incidentId } : {}),
        },
        select: { createdAt: true, riskScore: true },
      }),
    ]);

    const recentIncidents = incidents.filter((incident) => incident.createdAt >= recent30Start).length;
    const priorIncidents = incidents.filter((incident) => incident.createdAt >= prior30Start && incident.createdAt < recent30Start).length;

    const recentRisks = riskAssessments.filter((assessment) => assessment.createdAt >= recent30Start);
    const priorRisks = riskAssessments.filter((assessment) => assessment.createdAt >= prior30Start && assessment.createdAt < recent30Start);

    const recentCompliance = complianceFindings.filter((finding) => finding.createdAt >= recent30Start);
    const priorCompliance = complianceFindings.filter((finding) => finding.createdAt >= prior30Start && finding.createdAt < recent30Start);

    const recentVendor = vendorIntel.filter((intel) => intel.createdAt >= recent30Start);
    const priorVendor = vendorIntel.filter((intel) => intel.createdAt >= prior30Start && intel.createdAt < recent30Start);

    const dailyIncidentRate = safeDivide(incidents.length, 365);
    const avgLossPerIncident = average(riskAssessments.map((assessment) => assessment.financialImpact));
    const complianceExposureBase = average(complianceFindings.map((finding) => severityWeight(finding.severity)));
    const vendorRiskBase = average(vendorIntel.map((intel) => intel.riskScore));

    const incidentTrendPct = pctChange(recentIncidents, priorIncidents);
    const recentLoss = average(recentRisks.map((assessment) => assessment.financialImpact));
    const priorLoss = average(priorRisks.map((assessment) => assessment.financialImpact));
    const lossTrendPct = pctChange(recentLoss, priorLoss);

    const recentComplianceExposure = average(recentCompliance.map((finding) => severityWeight(finding.severity)));
    const priorComplianceExposure = average(priorCompliance.map((finding) => severityWeight(finding.severity)));
    const complianceTrendPct = pctChange(recentComplianceExposure, priorComplianceExposure);

    const recentVendorRisk = average(recentVendor.map((intel) => intel.riskScore));
    const priorVendorRisk = average(priorVendor.map((intel) => intel.riskScore));
    const vendorRiskTrendPct = pctChange(recentVendorRisk, priorVendorRisk);

    const horizons: Array<30 | 90 | 180> = [30, 90, 180];
    const outlook = horizons.map((horizonDays) => {
      const trendMultiplier = 1 + clamp(incidentTrendPct / 100, -0.6, 1.4);
      const expectedIncidents = Math.max(0, Math.round(dailyIncidentRate * horizonDays * trendMultiplier));

      const lossMultiplier = 1 + clamp(lossTrendPct / 100, -0.5, 1.2);
      const expectedLosses = Math.round(expectedIncidents * (avgLossPerIncident || 150000) * lossMultiplier);

      const complianceMultiplier = 1 + clamp(complianceTrendPct / 100, -0.4, 0.9);
      const expectedComplianceExposure = Number(
        clamp((complianceExposureBase || 1.8) * expectedIncidents * complianceMultiplier, 0, 100).toFixed(2)
      );

      const vendorTrend = Number(clamp((vendorRiskBase || 45) * (1 + clamp(vendorRiskTrendPct / 100, -0.4, 1)), 0, 100).toFixed(2));

      return {
        horizonDays,
        expectedIncidents,
        expectedLosses,
        expectedComplianceExposure,
        vendorRiskTrend: vendorTrend,
      };
    });

    const boardSummary = `Forecast indicates ${outlook[0].expectedIncidents} incidents in 30 days and ${outlook[2].expectedIncidents} incidents in 180 days, with projected loss exposure of $${outlook[2].expectedLosses.toLocaleString("en-US")}.`;

    const recommendations = [
      "Increase early triage automation for high-severity incidents to reduce projected incident growth.",
      "Expand vendor review cadence for vendors above risk threshold to reduce downstream loss exposure.",
      "Run proactive compliance control reviews in the next quarter for top trend-driving violation categories.",
      "Allocate board oversight checkpoints at 30/90/180 day milestones using forecast deltas.",
    ];

    const payload: ExecutiveForecastPayload = {
      generatedAt: new Date().toISOString(),
      historicalWindowDays: 365,
      outlook,
      trendSummary: {
        incidentTrendPct: Number(incidentTrendPct.toFixed(2)),
        lossTrendPct: Number(lossTrendPct.toFixed(2)),
        complianceTrendPct: Number(complianceTrendPct.toFixed(2)),
        vendorRiskTrendPct: Number(vendorRiskTrendPct.toFixed(2)),
      },
      boardSummary,
      recommendations,
    };

    void recordMonitoringEvent({
      organizationId,
      incidentId,
      source: "AGENT",
      operation: "enterprise_forecast_agent.buildForecast",
      durationMs: Date.now() - started,
      details: {
        incidentsAnalyzed: incidents.length,
        riskAssessmentsAnalyzed: riskAssessments.length,
        complianceFindingsAnalyzed: complianceFindings.length,
        vendorRecordsAnalyzed: vendorIntel.length,
      },
    }).catch(() => {});

    return payload;
  }
}

export async function generateBoardIntelligenceReport(organizationId: string, incidentId?: string) {
  const agent = new EnterpriseForecastAgent();
  const forecast = await agent.buildForecast(organizationId, incidentId);

  const report = await prisma.boardIntelligenceReport.create({
    data: {
      organizationId,
      incidentId,
      summary: forecast.boardSummary,
      outlook30Json: (forecast.outlook.find((row) => row.horizonDays === 30) ?? {}) as Prisma.InputJsonValue,
      outlook90Json: (forecast.outlook.find((row) => row.horizonDays === 90) ?? {}) as Prisma.InputJsonValue,
      outlook180Json: (forecast.outlook.find((row) => row.horizonDays === 180) ?? {}) as Prisma.InputJsonValue,
      vendorTrendJson: forecast.trendSummary as unknown as Prisma.InputJsonValue,
      recommendationsJson: forecast.recommendations as unknown as Prisma.InputJsonValue,
      generatedBy: "enterprise_forecast_agent",
    },
  });

  await prisma.auditLog.create({
    data: {
      organizationId,
      incidentId,
      actorType: "system",
      actorId: "enterprise_forecast_agent",
      action: "board_intelligence_report_generated",
      detailsJson: {
        boardReportId: report.id,
        generatedAt: report.generatedAt.toISOString(),
      },
    },
  });

  return { forecast, report };
}

export async function getLatestBoardIntelligenceReport(organizationId: string, incidentId?: string) {
  return prisma.boardIntelligenceReport.findFirst({
    where: {
      organizationId,
      ...(incidentId ? { incidentId } : {}),
    },
    orderBy: { generatedAt: "desc" },
  });
}
