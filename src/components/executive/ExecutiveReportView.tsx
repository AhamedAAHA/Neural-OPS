"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { CyberPanel, CyberBadge } from "@/components/cyber/CyberPanel";
import { NeonButton } from "@/components/ui/NeonButton";
import { Toast } from "@/components/ui/Toast";
import { Download, Shield, Scale, DollarSign, TrendingDown, CheckCircle, Bot, Loader2, Radio, FileSearch } from "lucide-react";
import { fetchJsonWithRetry, fetchWithRetry } from "@/lib/http/retry";

function formatMoney(n: number) {
  return n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${(n / 1000).toFixed(0)}K`;
}

interface LiveSnapshot {
  liveAt: string;
  incident: {
    id: string;
    title: string;
    type: string;
    severity: string;
    status: string;
    description?: string;
  };
  decision: {
    recommendedAction: string;
    confidenceScore: number;
    financialImpact: number;
    complianceImpact: number;
    legalExposure: number;
    operationalImpact: number;
    reputationImpact: number;
    reasoningChain: string[];
    ranking: Array<{ id?: string; label?: string; rank?: number; confidence?: number }>;
  };
  report: Record<string, unknown> | null;
  vendorIntelligence: {
    totalFindings: number;
    averageRiskScore: number;
    findings: Array<{
      id: string;
      riskScore: number;
      summary: string | null;
      source: string;
      createdAt: string;
      vendor?: { id: string; name: string; country?: string | null; industry?: string | null };
    }>;
  };
  investigationEvidence: {
    total: number;
    vendorRelated: number;
    recent: Array<{ id: string; title: string; evidenceType: string; confidence: number; agent: string; createdAt: string }>;
  };
  complianceFindings: Array<Record<string, unknown>>;
  latestRisk: { riskScore?: number; recommendation?: string } | null;
}

export function ExecutiveReportView() {
  const [incidents, setIncidents] = useState<Array<{ id: string; title: string; type: string; status: string; severity: string }>>([]);
  const [incidentId, setIncidentId] = useState<string>("");
  const [live, setLive] = useState<LiveSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [toast, setToast] = useState<{ message: string; kind: "success" | "error" | "info" } | null>(null);

  const loadLiveSnapshot = useCallback(async (selectedIncidentId: string, showLoader = true) => {
    if (!selectedIncidentId) return;
    if (showLoader) setLoading(true);
    try {
      const data = await fetchJsonWithRetry<LiveSnapshot>(
        `/api/reports/live?incidentId=${encodeURIComponent(selectedIncidentId)}`,
        { cache: "no-store" },
        { retries: 2, timeoutMs: 25000 }
      );
      setLive(data);
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : "Failed to load live executive data", kind: "error" });
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const run = async () => {
      setLoading(true);
      try {
        const incidentsJson = await fetchJsonWithRetry<{ incidents: Array<{ id: string; title: string; type: string; status: string; severity: string }> }>(
          "/api/incidents",
          { cache: "no-store" },
          { retries: 2 }
        );
        if (!active) return;
        const list = incidentsJson.incidents;
        setIncidents(list);
        if (list[0]?.id) setIncidentId(list[0].id);
      } catch (error) {
        if (!active) return;
        setToast({ message: error instanceof Error ? error.message : "Failed to load incidents", kind: "error" });
      } finally {
        if (active) setLoading(false);
      }
    };
    run();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!incidentId) return;
    void loadLiveSnapshot(incidentId);
  }, [incidentId, loadLiveSnapshot]);

  useEffect(() => {
    if (!incidentId) return;
    const timer = window.setInterval(() => {
      void loadLiveSnapshot(incidentId, false);
    }, 30000);
    return () => window.clearInterval(timer);
  }, [incidentId, loadLiveSnapshot]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const storedReport = live?.report ?? null;
  const rec = live?.decision ?? {
    recommendedAction: "Awaiting investigation data",
    confidenceScore: 0,
    financialImpact: 0,
    complianceImpact: 0,
    legalExposure: 0,
    operationalImpact: 0,
    reputationImpact: 0,
    reasoningChain: [],
    ranking: [],
  };

  const reportSummary = useMemo(() => {
    if (storedReport?.summary) return String(storedReport.summary);
    if (live?.latestRisk?.recommendation) return live.latestRisk.recommendation;
    if (rec.reasoningChain[0]) return rec.reasoningChain.join(" ");
    return live?.incident.description ?? "Live executive analysis compiled from investigation, vendor intelligence, and risk signals.";
  }, [storedReport, live, rec.reasoningChain]);

  const timeline = ((storedReport?.timelineJson as Array<Record<string, unknown>> | undefined) ?? []);
  const complianceFindings = live?.complianceFindings?.length
    ? live.complianceFindings
    : ((storedReport?.complianceJson as Array<Record<string, unknown>> | undefined) ?? []);
  const approvalHistory = ((storedReport?.approvalHistoryJson as Array<Record<string, unknown>> | undefined) ?? []);
  const agentContribution = ((storedReport?.agentContributionJson as Array<Record<string, unknown>> | undefined) ?? []);
  const recommendations = ((storedReport?.recommendationsJson as Array<Record<string, unknown>> | undefined) ?? rec.ranking.map((item) => ({
    action: item.label,
    confidence: item.confidence,
  })));
  const vendorIntelligence = live?.vendorIntelligence ?? { totalFindings: 0, averageRiskScore: 0, findings: [] };
  const vendorEvidence = live?.investigationEvidence ?? { total: 0, vendorRelated: 0, recent: [] };

  const generateReport = async () => {
    if (!incidentId) return;
    setGenerating(true);
    try {
      const res = await fetchWithRetry("/api/reports/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ incidentId }),
      }, { retries: 1, timeoutMs: 45000 });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Report generation failed");
      setToast({ message: "Executive report archived from live investigation data", kind: "success" });
      await loadLiveSnapshot(incidentId, false);
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : "Report generation failed", kind: "error" });
    } finally {
      setGenerating(false);
    }
  };

  const hasLiveData = Boolean(live && (vendorIntelligence.totalFindings > 0 || vendorEvidence.total > 0 || rec.confidenceScore > 0));

  return (
    <AppShell title="Executive Report" subtitle="Live synthesis from vendor intelligence, investigation evidence, and risk modeling">
      {toast && <Toast message={toast.message} kind={toast.kind} />}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CyberBadge label="CONFIDENTIAL" variant="red" pulse />
          {live?.liveAt ? (
            <CyberBadge label={`LIVE · ${new Date(live.liveAt).toLocaleTimeString()}`} variant="emerald" pulse />
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={incidentId}
            onChange={(event) => setIncidentId(event.target.value)}
            className="rounded border border-white/10 bg-slate-950 px-2 py-1.5 font-mono text-xs text-slate-200"
          >
            {incidents.map((row) => (
              <option key={row.id} value={row.id}>{row.title}</option>
            ))}
          </select>
          <NeonButton size="sm" className="font-mono text-[10px] uppercase" onClick={generateReport}>
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Archive Report
          </NeonButton>
        </div>
      </div>

      {loading && (
        <div className="mb-4 flex items-center gap-2 font-mono text-xs text-slate-400">
          <Loader2 className="h-3 w-3 animate-spin" /> Loading live executive intelligence...
        </div>
      )}

      {!hasLiveData && !loading && (
        <CyberPanel glow="cyan" title="Start Investigation">
          <p className="font-mono text-xs text-slate-400">
            Run a vendor investigation in Bright Data Intelligence, collect evidence in the investigation room, then return here for live executive synthesis.
          </p>
        </CyberPanel>
      )}

      {live && (
        <div className="space-y-6">
        <CyberPanel glow="emerald" title="Executive Recommendation (Live)">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="font-mono text-[10px] uppercase text-slate-500">Recommended Action</div>
              <div className="font-display text-xl font-bold text-emerald-300">{rec.recommendedAction}</div>
              <p className="mt-2 font-mono text-[11px] leading-relaxed text-slate-400">
                {rec.reasoningChain[0] ?? reportSummary}
              </p>
              <ul className="mt-3 space-y-1 font-mono text-[10px] text-slate-500">
                {rec.reasoningChain.slice(1).map((line, index) => (
                  <li key={`${line}-${index}`}>{index + 2}. {line}</li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-3 font-mono text-[11px]">
              <div><span className="text-slate-500">Financial Impact</span><div className="text-lg font-bold text-emerald-400">{formatMoney(rec.financialImpact)}</div></div>
              <div><span className="text-slate-500">Confidence</span><div className="text-lg font-bold text-cyan-300">{rec.confidenceScore}%</div></div>
              <div><span className="text-slate-500">Compliance Impact</span><div className="text-slate-300">{rec.complianceImpact}%</div></div>
              <div><span className="text-slate-500">Operational Impact</span><div className="text-slate-300">{rec.operationalImpact}%</div></div>
              <div><span className="text-slate-500">Legal Exposure</span><div className="text-slate-300">{rec.legalExposure}%</div></div>
              <div><span className="text-slate-500">Reputation Impact</span><div className="text-lg font-bold text-red-400">{rec.reputationImpact}%</div></div>
            </div>
          </div>
        </CyberPanel>

        <CyberPanel glow="cyan" title="Incident Summary">
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <div className="text-xs text-slate-500">Incident</div>
              <div className="font-semibold text-white">{live.incident.title}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Type</div>
              <div className="text-slate-300">{live.incident.type}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Severity</div>
              <div className="text-2xl font-bold text-red-400">{live.incident.severity.toUpperCase()}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Status</div>
              <CyberBadge label={live.incident.status} variant="red" pulse />
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-slate-400">{reportSummary}</p>
          <div className="mt-3 flex flex-wrap gap-2 font-mono text-[10px]">
            <CyberBadge label={`${vendorEvidence.total} evidence items`} variant="cyan" />
            <CyberBadge label={`${vendorIntelligence.totalFindings} vendor intel records`} variant="amber" />
            {live.latestRisk?.riskScore != null ? (
              <CyberBadge label={`Risk score ${Math.round(live.latestRisk.riskScore)}/100`} variant="red" />
            ) : null}
          </div>
        </CyberPanel>

        <div className="grid gap-6 lg:grid-cols-2">
          <CyberPanel title="Live Vendor Intelligence" glow="amber">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
                <div className="text-xs text-slate-500">Findings</div>
                <div className="text-lg font-bold text-amber-300">{vendorIntelligence.totalFindings}</div>
              </div>
              <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
                <div className="text-xs text-slate-500">Average Vendor Risk</div>
                <div className="text-lg font-bold text-red-400">{vendorIntelligence.averageRiskScore}/100</div>
              </div>
              <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
                <div className="text-xs text-slate-500">Vendor Evidence</div>
                <div className="text-lg font-bold text-cyan-300">{vendorEvidence.vendorRelated}</div>
              </div>
            </div>
            {vendorIntelligence.findings.length > 0 ? (
              <div className="mt-4 space-y-2">
                {vendorIntelligence.findings.slice(0, 6).map((finding) => (
                  <div key={finding.id} className="rounded border border-amber-500/20 bg-amber-500/[0.04] px-3 py-2">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Radio className="h-3 w-3 text-amber-400" />
                        <span className="font-mono text-[10px] text-amber-200">{finding.vendor?.name ?? "Vendor"}</span>
                        <CyberBadge label={finding.source} variant="amber" />
                      </div>
                      <span className="font-mono text-[10px] text-red-300">Risk {finding.riskScore}</span>
                    </div>
                    <div className="font-mono text-[11px] text-slate-300">{finding.summary ?? "Vendor intelligence captured from Bright Data investigation."}</div>
                    <div className="mt-1 font-mono text-[9px] text-slate-600">{new Date(finding.createdAt).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-3 font-mono text-xs text-slate-500">No vendor intelligence yet. Run Investigate Vendor to populate live executive risk inputs.</div>
            )}
          </CyberPanel>

          <CyberPanel title="Recent Investigation Evidence" glow="violet">
            <div className="space-y-2">
              {vendorEvidence.recent.length > 0 ? vendorEvidence.recent.map((item) => (
                <div key={item.id} className="flex gap-3 rounded border border-violet-500/15 bg-violet-500/[0.03] px-3 py-2">
                  <FileSearch className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-400" />
                  <div>
                    <div className="font-mono text-[11px] text-slate-200">{item.title}</div>
                    <div className="font-mono text-[10px] text-slate-500">{item.agent} · {item.evidenceType} · {Math.round(item.confidence * 100)}% confidence</div>
                  </div>
                </div>
              )) : (
                <div className="font-mono text-xs text-slate-500">Evidence from investigation agents will appear here in real time.</div>
              )}
            </div>
          </CyberPanel>
        </div>

        {timeline.length > 0 && (
          <CyberPanel title="Investigation Timeline" glow="violet">
            <div className="space-y-3">
              {timeline.map((event, index) => (
                <div key={`${event.time}-${index}`} className="flex gap-3 border-l-2 border-cyan-500/30 pl-4">
                  <div>
                    <div className="text-xs font-mono text-cyan-500">{String(event.time ?? "")}</div>
                    <div className="text-sm text-slate-300">{String(event.action ?? "")}</div>
                    {Boolean(event.actor) && <div className="text-[10px] text-slate-500">{String(event.actor ?? "")}</div>}
                  </div>
                </div>
              ))}
            </div>
          </CyberPanel>
        )}

        <CyberPanel title="Impact Assessment" glow="amber">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {[
                { icon: DollarSign, label: "Financial Impact", value: formatMoney(rec.financialImpact), color: "text-red-400" },
                { icon: Scale, label: "Legal Exposure", value: `${rec.legalExposure}%`, color: "text-orange-400" },
                { icon: Shield, label: "Compliance Impact", value: `${rec.complianceImpact}%`, color: "text-yellow-400" },
                { icon: TrendingDown, label: "Reputation Impact", value: `${rec.reputationImpact}%`, color: "text-red-400" },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
                  <item.icon className="mb-2 h-5 w-5 text-slate-500" />
                  <div className="text-xs text-slate-500">{item.label}</div>
                  <div className={`text-lg font-bold ${item.color}`}>{item.value}</div>
                </div>
              ))}
            </div>
        </CyberPanel>

        {complianceFindings.length > 0 && (
        <CyberPanel title="Compliance Findings" glow="cyan">
          <div className="grid gap-4 md:grid-cols-2">
            {complianceFindings.map((finding, index) => (
              <div key={`${finding.regulation}-${index}`} className="rounded-lg border border-white/5 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-medium text-white">{String(finding.regulation ?? "Regulation")}</span>
                  <CyberBadge label={String(finding.severity ?? "unknown")} variant="amber" />
                </div>
                <ul className="space-y-1">
                  <li className="text-xs text-slate-400">• {String(finding.finding ?? "No finding details")}</li>
                  <li className="text-xs text-slate-500">• {String(finding.requiredAction ?? "No action recorded")}</li>
                </ul>
              </div>
            ))}
          </div>
        </CyberPanel>
        )}

        <CyberPanel title="Decision Ranking" glow="emerald">
          <div className="grid gap-2 md:grid-cols-2">
            {rec.ranking.map((item, index) => (
              <div key={`${item.id ?? index}`} className="flex items-center gap-2 rounded-lg bg-emerald-500/5 px-3 py-2 text-sm text-slate-300">
                <CheckCircle className="h-3 w-3 shrink-0 text-emerald-400" />
                #{index + 1} {String(item.label ?? "Decision")} ({Number(item.confidence ?? 0)}%)
              </div>
            ))}
          </div>
        </CyberPanel>

        {agentContribution.length > 0 && (
        <CyberPanel title="Agent Contribution History" glow="violet">
          <div className="mb-2 flex items-center gap-2">
            <Bot className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="space-y-2">
            {agentContribution.map((agent, index) => (
              <div key={`${agent.id ?? index}`} className="flex items-start gap-3 rounded-lg bg-white/[0.02] p-3 text-xs">
                <span className="shrink-0 text-cyan-400">{String(agent.role ?? "Agent")}</span>
                <span className="text-slate-600">•</span>
                <span className="shrink-0 text-violet-400">{String(agent.name ?? "Unknown")}</span>
              </div>
            ))}
          </div>
        </CyberPanel>
        )}

        {(approvalHistory.length > 0 || recommendations.length > 0) && (
        <div className="grid gap-6 lg:grid-cols-2">
          {approvalHistory.length > 0 && (
          <CyberPanel title="Approval History" glow="red">
            <div className="space-y-2 text-sm">
              {approvalHistory.map((row, index) => (
                <div key={`${row.id ?? index}`} className="flex justify-between rounded-lg bg-white/[0.02] p-3">
                  <span className="text-slate-400">{String(row.role ?? row.name ?? "Approval Step")}</span>
                  <CyberBadge label={String(row.status ?? "pending")} variant={row.status === "approved" ? "emerald" : row.status === "pending" ? "red" : "amber"} pulse={row.status === "pending"} />
                </div>
              ))}
            </div>
          </CyberPanel>
          )}

          <CyberPanel title="Ranked Recommendations" glow="cyan">
            <div className="space-y-1 font-mono text-xs text-slate-500">
              {recommendations.map((row, index) => (
                <div key={`${row.action ?? index}`}>#{index + 1} {String(row.action ?? "Action")} ({Number(row.confidence ?? 0)}%)</div>
              ))}
            </div>
          </CyberPanel>
        </div>
        )}

        {storedReport && (
          <CyberPanel glow="emerald" title="Archived Report">
            <p className="font-mono text-[10px] text-slate-500">
              Last archived {storedReport.createdAt ? new Date(String(storedReport.createdAt)).toLocaleString() : "recently"}. Live data above reflects current investigation state.
            </p>
          </CyberPanel>
        )}
        </div>
      )}
    </AppShell>
  );
}
