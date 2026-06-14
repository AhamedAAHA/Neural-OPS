"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { CyberBadge, CyberPanel } from "@/components/cyber/CyberPanel";
import { NeonButton } from "@/components/ui/NeonButton";
import { Toast } from "@/components/ui/Toast";
import { fetchJsonWithRetry, fetchWithRetry } from "@/lib/http/retry";
import { Loader2, RefreshCcw, TrendingUp } from "lucide-react";

interface ForecastPoint {
  horizonDays: 30 | 90 | 180;
  expectedIncidents: number;
  expectedLosses: number;
  expectedComplianceExposure: number;
  vendorRiskTrend: number;
}

interface ForecastPayload {
  generatedAt: string;
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

interface BoardReport {
  id: string;
  generatedBy: string;
  summary: string;
  generatedAt: string;
  recommendationsJson: unknown;
}

function formatMoney(value: number) {
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

function trendBadgeValue(value: number) {
  if (value > 0) return `+${value.toFixed(1)}%`;
  return `${value.toFixed(1)}%`;
}

function trendVariant(value: number) {
  if (value >= 10) return "red" as const;
  if (value >= 0) return "amber" as const;
  return "emerald" as const;
}

function asRecommendations(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export function ExecutiveIntelligenceView() {
  const [incidents, setIncidents] = useState<Array<{ id: string; title: string }>>([]);
  const [incidentId, setIncidentId] = useState("");
  const [forecast, setForecast] = useState<ForecastPayload | null>(null);
  const [report, setReport] = useState<BoardReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ kind: "success" | "error" | "info"; message: string } | null>(null);

  const loadIncidents = async () => {
    const data = await fetchJsonWithRetry<{ incidents: Array<{ id: string; title: string }> }>(
      "/api/incidents",
      { cache: "no-store" },
      { retries: 2 }
    );
    setIncidents(data.incidents);
  };

  const loadIntelligence = async (selectedIncidentId: string) => {
    setLoading(true);
    setError(null);
    try {
      const query = selectedIncidentId ? `?incidentId=${encodeURIComponent(selectedIncidentId)}` : "";
      const data = await fetchJsonWithRetry<{ report: BoardReport | null; forecast: ForecastPayload | null }>(
        `/api/executive-intelligence${query}`,
        { cache: "no-store" },
        { retries: 2 }
      );
      setReport(data.report);
      setForecast(data.forecast);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load executive intelligence";
      setError(message);
      setToast({ kind: "error", message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const run = async () => {
      setLoading(true);
      try {
        const data = await fetchJsonWithRetry<{ incidents: Array<{ id: string; title: string }> }>(
          "/api/incidents",
          { cache: "no-store" },
          { retries: 2 }
        );
        if (!active) return;
        setIncidents(data.incidents);
      } catch (err) {
        if (!active) return;
        const message = err instanceof Error ? err.message : "Failed to load incidents";
        setError(message);
        setToast({ kind: "error", message });
      } finally {
        if (active) setLoading(false);
      }
    };
    void run();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    void loadIntelligence(incidentId);
  }, [incidentId]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  const recommendations = useMemo(
    () => asRecommendations(report?.recommendationsJson ?? forecast?.recommendations ?? []),
    [report?.recommendationsJson, forecast?.recommendations]
  );

  const outlook = forecast?.outlook ?? [];

  const generateReport = async () => {
    setGenerating(true);
    try {
      const response = await fetchWithRetry(
        "/api/executive-intelligence",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ incidentId: incidentId || undefined }),
        },
        { retries: 1 }
      );
      const data = (await response.json()) as { error?: string; report?: BoardReport; forecast?: ForecastPayload };
      if (!response.ok) throw new Error(data.error ?? "Failed to generate intelligence report");
      if (data.report) setReport(data.report);
      if (data.forecast) setForecast(data.forecast);
      await loadIncidents();
      setToast({ kind: "success", message: "Board intelligence report generated" });
    } catch (err) {
      setToast({ kind: "error", message: err instanceof Error ? err.message : "Report generation failed" });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <AppShell title="Executive Intelligence" subtitle="Enterprise Forecast Agent powered by historical incident, risk, compliance, and vendor data">
      {toast ? <Toast kind={toast.kind} message={toast.message} /> : null}
      <div className="space-y-3 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CyberBadge label="enterprise forecast agent" variant="violet" pulse />
            <CyberBadge label="historical database" variant="cyan" />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={incidentId}
              onChange={(event) => setIncidentId(event.target.value)}
              className="rounded border border-white/10 bg-slate-950 px-2 py-1.5 font-mono text-xs text-slate-200"
            >
              <option value="">All Incidents</option>
              {incidents.map((incident) => (
                <option key={incident.id} value={incident.id}>{incident.title}</option>
              ))}
            </select>
            <NeonButton size="sm" onClick={generateReport} className="font-mono text-[10px] uppercase">
              {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCcw className="h-3.5 w-3.5" />} Generate Report
            </NeonButton>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 font-mono text-xs text-slate-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading executive intelligence...
          </div>
        ) : null}

        {error && !loading ? (
          <CyberPanel glow="red" title="Unable to Load Intelligence">
            <p className="font-mono text-xs text-red-300">{error}</p>
            <NeonButton size="sm" onClick={() => void loadIntelligence(incidentId)} className="mt-3 font-mono text-[10px] uppercase">
              Retry
            </NeonButton>
          </CyberPanel>
        ) : null}

        {!loading && !error && !forecast ? (
          <CyberPanel glow="amber" title="No Forecast Data Yet">
            <p className="font-mono text-xs text-slate-400">Generate a board intelligence report to produce 30/90/180 day forecasts from your organization history.</p>
          </CyberPanel>
        ) : null}

        {forecast ? (
          <>
            <div className="grid gap-3 md:grid-cols-3">
              {outlook.map((point) => (
                <CyberPanel key={point.horizonDays} glow="cyan" title={`${point.horizonDays} Day Outlook`}>
                  <div className="space-y-2 font-mono text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Expected Incidents</span>
                      <span className="text-cyan-300">{point.expectedIncidents}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Expected Losses</span>
                      <span className="text-red-300">{formatMoney(point.expectedLosses)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Compliance Exposure</span>
                      <span className="text-amber-300">{point.expectedComplianceExposure.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Vendor Risk Trend</span>
                      <span className="text-violet-300">{point.vendorRiskTrend.toFixed(2)}</span>
                    </div>
                  </div>
                </CyberPanel>
              ))}
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              <CyberPanel glow="emerald" title="Trend Signals" subtitle={`Generated ${new Date(forecast.generatedAt).toLocaleString()}`}>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Incident Trend", value: forecast.trendSummary.incidentTrendPct },
                    { label: "Loss Trend", value: forecast.trendSummary.lossTrendPct },
                    { label: "Compliance Trend", value: forecast.trendSummary.complianceTrendPct },
                    { label: "Vendor Risk Trend", value: forecast.trendSummary.vendorRiskTrendPct },
                  ].map((item) => (
                    <div key={item.label} className="rounded border border-white/10 bg-white/[0.02] p-2">
                      <div className="font-mono text-[10px] text-slate-500">{item.label}</div>
                      <div className="mt-1 flex items-center gap-2">
                        <TrendingUp className="h-3.5 w-3.5 text-cyan-400" />
                        <CyberBadge label={trendBadgeValue(item.value)} variant={trendVariant(item.value)} />
                      </div>
                    </div>
                  ))}
                </div>
              </CyberPanel>

              <CyberPanel glow="violet" title="Board-Level Intelligence Report">
                <p className="font-mono text-xs leading-relaxed text-slate-300">
                  {report?.summary ?? forecast.boardSummary}
                </p>
                <div className="mt-3 space-y-1.5">
                  {recommendations.map((recommendation, index) => (
                    <div key={`${recommendation}-${index}`} className="rounded border border-violet-500/20 bg-violet-500/[0.03] p-2 font-mono text-[11px] text-slate-300">
                      {index + 1}. {recommendation}
                    </div>
                  ))}
                </div>
                <div className="mt-3 font-mono text-[10px] text-slate-500">
                  Last stored report: {report ? new Date(report.generatedAt).toLocaleString() : "Not generated yet"}
                </div>
              </CyberPanel>
            </div>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}
