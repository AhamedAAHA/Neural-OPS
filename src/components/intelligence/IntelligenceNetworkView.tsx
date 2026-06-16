"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { CyberPanel, CyberBadge } from "@/components/cyber/CyberPanel";
import { Globe, Radio, AlertTriangle, RefreshCw, Activity } from "lucide-react";
import { Toast } from "@/components/ui/Toast";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { fetchJsonWithRetry } from "@/lib/http/retry";

interface Signal {
  id: string;
  source?: string;
  category?: string;
  incidentTitle?: string | null;
  agent: string;
  signal: string;
  severity: "critical" | "high" | "medium" | "low";
  timestamp: string;
}

interface InvestigationResult {
  scores: {
    vendorRiskScore: number;
    reputationScore: number;
    exposureScore: number;
  };
  intelligence: { id: string; summary: string | null };
  vendor: { id: string; name: string };
  sources: Array<{
    id: string;
    agent: string;
    category: string;
    title: string;
    url: string;
    snippet: string;
  }>;
  configurationWarning?: boolean;
}

export function IntelligenceNetworkView() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [incidents, setIncidents] = useState<Array<{ id: string; title: string }>>([]);
  const [incidentId, setIncidentId] = useState<string>("");
  const [agents, setAgents] = useState<Array<{ id: string; name: string; role: string }>>([]);
  const [loadingSignals, setLoadingSignals] = useState(true);
  const [vendorName, setVendorName] = useState("");
  const [country, setCountry] = useState("");
  const [industry, setIndustry] = useState("");
  const [loadingInvestigation, setLoadingInvestigation] = useState(false);
  const [investigation, setInvestigation] = useState<InvestigationResult | null>(null);
  const [configurationWarning, setConfigurationWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ kind: "success" | "error" | "info"; message: string } | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const loadSignals = useCallback(async () => {
    setLoadingSignals(true);
    setError(null);
    try {
      const query = incidentId ? `?incidentId=${encodeURIComponent(incidentId)}` : "";
      const data = await fetchJsonWithRetry<{ signals?: Signal[] }>(`/api/intelligence${query}`, undefined, { retries: 2 });
      setSignals(data.signals ?? []);
      setLastUpdated(new Date().toISOString());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load intelligence feed");
    } finally {
      setLoadingSignals(false);
    }
  }, [incidentId]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    void fetchJsonWithRetry<{ agents?: Array<{ id: string; name: string; role: string }> }>("/api/agents")
      .then((data) => setAgents(data.agents ?? []))
      .catch(() => {});
    void fetchJsonWithRetry<{ incidents?: Array<{ id: string; title: string }> }>("/api/incidents")
      .then((data) => {
        const rows = (data.incidents ?? []).map((row) => ({ id: row.id, title: row.title }));
        setIncidents(rows);
        if (rows[0]?.id) setIncidentId((current) => current || rows[0].id);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    void loadSignals().catch(() => {});
    const timer = setInterval(() => {
      void loadSignals().catch(() => {});
    }, 30000);
    return () => clearInterval(timer);
  }, [loadSignals]);

  const investigate = async () => {
    if (!vendorName.trim()) {
      setToast({ kind: "error", message: "Vendor name is required" });
      return;
    }

    setLoadingInvestigation(true);
    setError(null);
    setConfigurationWarning(null);
    try {
      const data = await fetchJsonWithRetry<InvestigationResult & { configurationWarning?: boolean }>(
        "/api/vendors/investigate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vendorName,
            country: country || undefined,
            industry: industry || undefined,
            incidentId: incidentId || undefined,
          }),
        },
        { retries: 1, timeoutMs: 60000 }
      );
      if (data.configurationWarning) {
        const msg = "Bright Data API not configured.";
        setConfigurationWarning(msg);
        setToast({ kind: "error", message: msg });
        return;
      }

      setInvestigation(data as InvestigationResult);
      setToast({ kind: "success", message: `Investigation complete — results synced to Risk Simulation, Enterprise Knowledge, and Executive Report` });
      await loadSignals();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Vendor investigation failed";
      if (msg.toLowerCase().includes("aborted") || msg.toLowerCase().includes("timeout")) {
        const timeoutMessage = "Investigation timed out while waiting for external intelligence sources. Please retry.";
        setError(timeoutMessage);
        setToast({ kind: "error", message: timeoutMessage });
        return;
      }
      if (msg.toLowerCase().includes("bright data api not configured")) {
        setConfigurationWarning(msg);
        setToast({ kind: "error", message: msg });
        return;
      }
      setError(msg);
      setToast({ kind: "error", message: msg });
    } finally {
      setLoadingInvestigation(false);
    }
  };

  return (
    <AppShell title="Bright Data Intelligence Network" subtitle="Vendor · Reputation · Market · Third Party · Dark Web Intelligence">
      {toast && <Toast kind={toast.kind} message={toast.message} />}
      <div className="grid h-[calc(100vh-5.5rem)] min-h-0 grid-cols-12 gap-3 overflow-hidden p-3">
        <ScrollArea className="col-span-12 min-h-0 lg:col-span-4">
          <div className="space-y-3 pr-1">
          <CyberPanel title="Intelligence Agents" glow="amber" hover={false}>
            {(agents.length ? agents : [{ id: "intel", name: "Vendor Intelligence Agent", role: "External intelligence collection" }]).map((agent) => (
              <div key={agent.id} className="mb-2 rounded border border-amber-500/25 bg-amber-500/5 px-3 py-2.5 last:mb-0">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-medium text-white">{agent.name}</span>
                  <CyberBadge label="Bright Data" variant="amber" />
                </div>
                <div className="mt-1 font-mono text-[10px] text-slate-500">{agent.role}</div>
              </div>
            ))}
          </CyberPanel>

          {investigation && (
            <CyberPanel compact glow="amber" hover={false}>
              <div className="font-mono text-[10px] text-slate-500">Latest result</div>
              <div className="font-mono text-sm font-bold text-amber-300">{investigation.vendor.name}</div>
              <div className="mt-1 grid grid-cols-3 gap-1.5 font-mono text-[10px]">
                <div className="rounded border border-red-500/25 px-1.5 py-1 text-center">
                  <div className="text-[11px] text-red-300">{investigation.scores.vendorRiskScore}</div>
                  <div className="text-slate-500">Risk</div>
                </div>
                <div className="rounded border border-violet-500/25 px-1.5 py-1 text-center">
                  <div className="text-[11px] text-violet-300">{investigation.scores.reputationScore}</div>
                  <div className="text-slate-500">Reputation</div>
                </div>
                <div className="rounded border border-cyan-500/25 px-1.5 py-1 text-center">
                  <div className="text-[11px] text-cyan-300">{investigation.scores.exposureScore}</div>
                  <div className="text-slate-500">Exposure</div>
                </div>
              </div>
            </CyberPanel>
          )}

          <CyberPanel title="How To Use" glow="violet" hover={false}>
            <div className="space-y-2 font-mono text-[11px] text-slate-300">
              <div>1. Enter a vendor name and run investigation.</div>
              <div>2. Check risk, reputation, and exposure scores in the result card.</div>
              <div>3. Watch the right feed for live evidence and vendor intelligence updates.</div>
              <div>4. Open source links and escalate critical findings into the investigation room.</div>
            </div>
          </CyberPanel>
          </div>
        </ScrollArea>

        <div className="col-span-12 flex min-h-0 flex-col gap-3 overflow-hidden lg:col-span-8">
          <CyberPanel title="Investigate Vendor" glow="cyan" hover={false}>
            <div className="space-y-2">
              <select
                value={incidentId}
                onChange={(e) => setIncidentId(e.target.value)}
                className="w-full rounded border border-cyan-500/20 bg-black/30 px-3 py-2 font-mono text-xs text-slate-200 outline-none"
              >
                {incidents.length === 0 ? (
                  <option value="">No incidents</option>
                ) : (
                  incidents.map((row) => (
                    <option key={row.id} value={row.id}>{row.title}</option>
                  ))
                )}
              </select>
              <input
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                placeholder="Vendor name"
                className="w-full rounded border border-cyan-500/20 bg-black/30 px-3 py-2 font-mono text-xs text-slate-200 outline-none"
              />
              <input
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Country (optional)"
                className="w-full rounded border border-cyan-500/20 bg-black/30 px-3 py-2 font-mono text-xs text-slate-200 outline-none"
              />
              <input
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="Industry (optional)"
                className="w-full rounded border border-cyan-500/20 bg-black/30 px-3 py-2 font-mono text-xs text-slate-200 outline-none"
              />
              <button
                type="button"
                onClick={investigate}
                disabled={loadingInvestigation}
                className="w-full rounded border border-cyan-400/40 bg-cyan-500/15 px-3 py-2 font-mono text-xs text-cyan-200 transition hover:bg-cyan-500/25 disabled:opacity-60"
              >
                {loadingInvestigation ? "Investigating..." : "Run Investigation"}
              </button>
              {configurationWarning && (
                <div className="rounded border border-amber-500/30 bg-amber-500/10 px-2.5 py-2 font-mono text-[11px] text-amber-300">
                  {configurationWarning}
                </div>
              )}
              {error && <p className="font-mono text-[11px] text-red-400">{error}</p>}
            </div>
          </CyberPanel>

          <CyberPanel title="Live Intelligence Feed" glow="amber" className="flex min-h-0 flex-1 flex-col overflow-hidden" hover={false}>
            <div className="mb-3 flex flex-wrap items-center gap-2 font-mono text-[11px] text-slate-400">
              <Globe className="h-4 w-4 text-amber-400" />
              <span>Live intelligence routed to investigation agents via Band</span>
              {lastUpdated ? (
                <span className="inline-flex items-center gap-1 text-emerald-300">
                  <Activity className="h-3.5 w-3.5" />
                  Updated {new Date(lastUpdated).toLocaleTimeString()}
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => void loadSignals()}
                className="ml-auto inline-flex items-center gap-1 rounded border border-amber-500/30 px-2 py-1 text-[10px] text-amber-300 hover:bg-amber-500/10"
              >
                <RefreshCw className="h-3 w-3" />
                Refresh
              </button>
            </div>
            <ScrollArea className="flex-1">
            <div className="space-y-2 pr-1">
              {loadingSignals && <div className="font-mono text-[11px] text-slate-500">Loading intelligence...</div>}
              {!loadingSignals && !signals.length && (
                <div className="rounded border border-amber-500/20 bg-amber-500/[0.05] p-3 font-mono text-[11px] text-amber-200">
                  No intelligence signals yet. Run a vendor investigation or generate incident evidence to populate this live feed.
                </div>
              )}
              {!loadingSignals && error && (
                <button
                  type="button"
                  onClick={() => void loadSignals()}
                  className="rounded border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 font-mono text-[10px] text-red-300"
                >
                  Retry feed
                </button>
              )}
              {signals.map((sig) => (
                <div key={sig.id} className="rounded border border-amber-500/15 bg-amber-500/[0.03] p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Radio className="h-3.5 w-3.5 text-amber-400" />
                    <span className="font-mono text-[11px] font-medium text-amber-300">{sig.agent}</span>
                    {sig.source ? <CyberBadge label={sig.source} variant="default" /> : null}
                    {sig.category ? <CyberBadge label={sig.category.replaceAll("_", " ")} variant="amber" /> : null}
                    <CyberBadge label={sig.severity} variant={sig.severity === "critical" ? "red" : sig.severity === "high" ? "amber" : "default"} pulse={sig.severity === "critical"} />
                    <span className="ml-auto font-mono text-[10px] text-slate-600">{sig.timestamp}</span>
                  </div>
                  {sig.incidentTitle ? <div className="mt-1 font-mono text-[10px] text-cyan-400">{sig.incidentTitle}</div> : null}
                  <div className="mt-2 flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
                    <p className="font-mono text-[11px] leading-relaxed text-slate-300">{sig.signal}</p>
                  </div>
                </div>
              ))}
              {investigation?.sources?.length ? (
                <div className="rounded border border-cyan-500/20 bg-cyan-500/[0.04] p-3">
                  <div className="mb-2 font-mono text-[11px] text-cyan-300">Bright Data Sources</div>
                  <div className="space-y-2">
                    {investigation.sources.slice(0, 20).map((source) => (
                      <a
                        key={source.id}
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block rounded border border-white/5 px-2.5 py-2 transition hover:border-cyan-500/30"
                      >
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <CyberBadge label={source.agent} variant="amber" />
                          <CyberBadge label={source.category.replaceAll("_", " ")} variant="default" />
                        </div>
                        <div className="font-mono text-[11px] text-slate-200">{source.title}</div>
                        <div className="mt-1 line-clamp-2 font-mono text-[10px] text-slate-500">{source.snippet || source.url}</div>
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
            </ScrollArea>
          </CyberPanel>
        </div>
      </div>
    </AppShell>
  );
}
