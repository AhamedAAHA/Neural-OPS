"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AppShell } from "@/components/layout/AppShell";
import { CyberPanel, CyberBadge } from "@/components/cyber/CyberPanel";
import { useNeuralOpsStore } from "@/store/neural-ops";
import { fetchJsonWithRetry } from "@/lib/http/retry";
import { TrendingDown, DollarSign, Scale, Shield, Users, Clock, Star } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from "recharts";

const LIVE_SCENARIOS = [
  { id: "ignore", title: "Ignore Incident", description: "Take no immediate action and monitor only." },
  { id: "shutdown", title: "Shutdown Systems", description: "Isolate affected systems to contain spread." },
  { id: "notify", title: "Notify Stakeholders", description: "Alert regulators, customers, and leadership." },
  { id: "freeze", title: "Freeze Vendor Payments", description: "Block outbound payments to suspicious vendors." },
  { id: "audit", title: "Launch Forensic Audit", description: "Commission full forensic and compliance audit." },
];

const IMPACT_ICONS = {
  financial: DollarSign,
  legal: Scale,
  compliance: Shield,
  reputation: TrendingDown,
  downtime: Clock,
  customer: Users,
};

export function RiskSimulationView() {
  const [incidents, setIncidents] = useState<Array<{ id: string; title: string; severity: string; status: string }>>([]);
  const [incidentsLoading, setIncidentsLoading] = useState(true);
  const [incidentsError, setIncidentsError] = useState<string | null>(null);
  const [selected, setSelected] = useState(LIVE_SCENARIOS[3]);
  const [timeframe, setTimeframe] = useState<"24h" | "7d">("24h");
  const [simulation, setSimulation] = useState<{
    impacts: Record<string, number>;
    confidence?: number;
    description?: string;
    recommendation?: string;
    timeframe?: "24h" | "7d";
    basis?: {
      evidenceCount: number;
      complianceCount: number;
      legalCount: number;
      pendingApprovals: number;
      vendorRiskScore: number;
      latestRiskScore: number;
    };
    scenarioComparisons?: Array<{
      id: string;
      financial: number;
      legal: number;
      reputation: number;
      operational: number;
      customer: number;
    }>;
    computedAt?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [incidentBaseline, setIncidentBaseline] = useState<{
    latestRiskScore: number;
    evidenceCount: number;
    complianceCount: number;
    legalCount: number;
    pendingApprovals: number;
    vendorRiskScore: number;
  } | null>(null);
  const { riskScore, riskBreakdown, selectedIncidentId, setSelectedIncident } = useNeuralOpsStore();

  useEffect(() => {
    let active = true;
    const loadIncidents = async () => {
      setIncidentsLoading(true);
      setIncidentsError(null);
      try {
        const data = await fetchJsonWithRetry<{ incidents?: Array<{ id: string; title: string; severity: string; status: string }> }>(
          "/api/incidents",
          { cache: "no-store" },
          { retries: 2 }
        );
        if (!active) return;
        let next = data.incidents ?? [];

        // Recover from stale active-organization cookie by syncing to a valid org and retrying once.
        if (!next.length) {
          const orgData = await fetchJsonWithRetry<{ organizations?: Array<{ id: string }>; activeOrganizationId?: string }>(
            "/api/organizations",
            { cache: "no-store" },
            { retries: 1 }
          );
          const firstOrgId = orgData.organizations?.[0]?.id;
          if (firstOrgId) {
            await fetchJsonWithRetry<{ ok?: boolean }>("/api/auth/switch-organization", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ organizationId: firstOrgId }),
            }, { retries: 1 });
            const retry = await fetchJsonWithRetry<{ incidents?: Array<{ id: string; title: string; severity: string; status: string }> }>(
              "/api/incidents",
              { cache: "no-store" },
              { retries: 1 }
            );
            next = retry.incidents ?? [];
          }
        }

        setIncidents(next);
        if (next[0]?.id && (!selectedIncidentId || !next.some((item) => item.id === selectedIncidentId))) {
          setSelectedIncident(next[0].id);
        }
      } catch (err) {
        if (!active) return;
        setIncidents([]);
        setIncidentsError(err instanceof Error ? err.message : "Failed to load incidents");
      } finally {
        if (active) setIncidentsLoading(false);
      }
    };
    void loadIncidents();
    return () => {
      active = false;
    };
  }, [selectedIncidentId, setSelectedIncident]);

  useEffect(() => {
    if (!selectedIncidentId) {
      setIncidentBaseline(null);
      return;
    }
    let active = true;
    const loadBaseline = async () => {
      try {
        const data = await fetchJsonWithRetry<{
          incident?: {
            evidence?: Array<unknown>;
            complianceFindings?: Array<unknown>;
            legalFindings?: Array<unknown>;
            approvals?: Array<{ status?: string }>;
            riskAssessments?: Array<{ riskScore: number }>;
            vendorIntelligence?: Array<{ riskScore?: number }>;
          };
        }>(`/api/incidents/${encodeURIComponent(selectedIncidentId)}`, { cache: "no-store" }, { retries: 2, timeoutMs: 20000 });
        if (!active) return;
        const incident = data.incident;
        const vendorRiskValues = (incident?.vendorIntelligence ?? [])
          .map((item) => item.riskScore ?? 0)
          .filter((value) => value > 0);
        const avgVendorRisk = vendorRiskValues.length
          ? Math.round(vendorRiskValues.reduce((sum, value) => sum + value, 0) / vendorRiskValues.length)
          : 40;
        setIncidentBaseline({
          latestRiskScore: incident?.riskAssessments?.[0]?.riskScore ?? 55,
          evidenceCount: incident?.evidence?.length ?? 0,
          complianceCount: incident?.complianceFindings?.length ?? 0,
          legalCount: incident?.legalFindings?.length ?? 0,
          pendingApprovals: (incident?.approvals ?? []).filter((item) => item.status === "pending").length,
          vendorRiskScore: avgVendorRisk,
        });
      } catch {
        if (!active) return;
        setIncidentBaseline(null);
      }
    };
    void loadBaseline();
    return () => {
      active = false;
    };
  }, [selectedIncidentId]);

  useEffect(() => {
    if (!selectedIncidentId) return;
    let active = true;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchJsonWithRetry<{ simulation: { impacts: Record<string, number>; confidence?: number; description?: string } }>(
          "/api/risk/simulate",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              incidentId: selectedIncidentId,
              scenario: selected.id,
              scenarioDescription: selected.description,
              timeframe,
            }),
          },
          { retries: 1, timeoutMs: 30000 }
        );
        if (!active) return;
        setSimulation(data.simulation);
      } catch (err) {
        if (!active) return;
        const message = err instanceof Error ? err.message : "Simulation failed";
        if (message.toLowerCase().includes("aborted") || message.toLowerCase().includes("timeout")) {
          setError("Live simulation timed out. Retrying in background while fallback model stays active.");
        } else {
          setError(message);
        }
        // Keep last successful simulation visible instead of collapsing charts to zero.
      } finally {
        if (active) setLoading(false);
      }
    };
    void run();
    return () => {
      active = false;
    };
  }, [selected, selectedIncidentId, timeframe]);

  useEffect(() => {
    if (!selectedIncidentId) return;
    const interval = setInterval(() => {
      void fetchJsonWithRetry<{ simulation: { impacts: Record<string, number>; confidence?: number; description?: string } }>(
        "/api/risk/simulate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            incidentId: selectedIncidentId,
            scenario: selected.id,
            scenarioDescription: selected.description,
            timeframe,
          }),
        },
        { retries: 1, timeoutMs: 30000 }
      )
        .then((data) => setSimulation(data.simulation))
        .catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, [selectedIncidentId, selected.id, selected.description, timeframe]);

  const baseline = incidentBaseline ?? {
    latestRiskScore: Math.max(1, riskScore),
    evidenceCount: 0,
    complianceCount: 0,
    legalCount: 0,
    pendingApprovals: 0,
    vendorRiskScore: 40,
  };
  const baseFinancial = Math.round(140000 + baseline.latestRiskScore * 18000 + baseline.evidenceCount * 42000 + baseline.complianceCount * 30000 + baseline.legalCount * 35000 + baseline.pendingApprovals * 20000);
  const fallbackImpacts = {
    financial: baseFinancial,
    legal: Math.min(100, Math.max(5, Math.round(baseline.latestRiskScore * 0.65 + baseline.legalCount * 12))),
    reputation: Math.min(100, Math.max(5, Math.round(baseline.latestRiskScore * 0.75 + baseline.evidenceCount * 2))),
    operational: Math.min(100, Math.max(5, Math.round(baseline.latestRiskScore * 0.55 + baseline.pendingApprovals * 7))),
    customer: Math.min(100, Math.max(5, Math.round(baseline.latestRiskScore * 0.6 + baseline.complianceCount * 8))),
  };

  const impacts = simulation?.impacts ?? fallbackImpacts;

  const liveBreakdown = useMemo(() => {
    const basis = simulation?.basis;
    if (!basis) return null;
    return {
      threatSeverity: Math.min(25, Math.max(0, Math.round((basis.latestRiskScore / 100) * 25))),
      financialExposure: Math.min(25, Math.max(0, Math.round((Math.min(1, impacts.financial / 2_000_000)) * 25))),
      complianceExposure: Math.min(20, Math.max(0, basis.complianceCount * 6 + (impacts.legal >= 70 ? 6 : 2))),
      vendorRisk: Math.min(20, Math.max(0, Math.round((basis.vendorRiskScore / 100) * 20))),
      operationalImpact: Math.min(15, Math.max(0, Math.round((impacts.operational / 100) * 15))),
      reputationImpact: Math.min(10, Math.max(0, Math.round((impacts.reputation / 100) * 10))),
    };
  }, [simulation?.basis, impacts.financial, impacts.legal, impacts.operational, impacts.reputation]);

  const baselineBreakdown = {
    threatSeverity: Math.min(25, Math.max(0, Math.round((baseline.latestRiskScore / 100) * 25))),
    financialExposure: Math.min(25, Math.max(0, Math.round((Math.min(1, fallbackImpacts.financial / 2_000_000)) * 25))),
    complianceExposure: Math.min(20, Math.max(0, baseline.complianceCount * 6 + (fallbackImpacts.legal >= 70 ? 6 : 2))),
    vendorRisk: Math.min(20, Math.max(0, Math.round((Math.min(100, baseline.vendorRiskScore) / 100) * 20))),
    operationalImpact: Math.min(15, Math.max(0, Math.round((fallbackImpacts.operational / 100) * 15))),
    reputationImpact: Math.min(10, Math.max(0, Math.round((fallbackImpacts.reputation / 100) * 10))),
  };

  const activeBreakdown = liveBreakdown ?? baselineBreakdown ?? riskBreakdown;
  const activeRiskScore = simulation?.basis?.latestRiskScore ?? baseline.latestRiskScore ?? riskScore;

  const breakdownItems = [
    { label: "Threat Severity", value: activeBreakdown.threatSeverity, max: 25 },
    { label: "Financial Exposure", value: activeBreakdown.financialExposure, max: 25 },
    { label: "Compliance Exposure", value: activeBreakdown.complianceExposure, max: 20 },
    { label: "Vendor Risk", value: activeBreakdown.vendorRisk, max: 20 },
    { label: "Operational Impact", value: activeBreakdown.operationalImpact, max: 15 },
    { label: "Reputation Impact", value: activeBreakdown.reputationImpact, max: 10 },
  ];

  const radarData = Object.entries(impacts).map(([key, value]) => ({
    subject: key.slice(0, 6),
    value: key === "financial" ? Math.min(value / 50000, 100) : value,
  }));

  const fallbackScenarioMultiplier: Record<string, { financial: number; legal: number }> = {
    ignore: { financial: 1.9, legal: 1.6 },
    shutdown: { financial: 0.7, legal: 0.85 },
    notify: { financial: 0.85, legal: 0.62 },
    freeze: { financial: 0.58, legal: 0.66 },
    audit: { financial: 0.78, legal: 0.6 },
  };

  const compareData = LIVE_SCENARIOS.map((scenario) => {
    const matched = simulation?.scenarioComparisons?.find((item) => item.id === scenario.id);
    const fallback = fallbackScenarioMultiplier[scenario.id] ?? { financial: 1, legal: 1 };
    return {
      name: scenario.title.slice(0, 12),
      financial: matched ? matched.financial / 10000 : (baseFinancial * fallback.financial) / 10000,
      legal: matched ? matched.legal : Math.min(100, Math.round(fallbackImpacts.legal * fallback.legal)),
    };
  });

  return (
    <AppShell title="Risk War-Game Simulator" subtitle={`Enterprise Risk Score ${activeRiskScore}/100 · Live scenario simulation`}>
      <div className="grid h-[calc(100vh-5.5rem)] grid-cols-12 gap-2 overflow-hidden">
        <div className="col-span-3 space-y-2 overflow-y-auto">
          <CyberPanel title="Incident" compact glow="cyan">
            <select
              value={selectedIncidentId ?? ""}
              onChange={(event) => setSelectedIncident(event.target.value || null)}
              className="w-full rounded border border-white/10 bg-slate-950 px-2 py-2 font-mono text-xs text-slate-200"
            >
              {incidents.length === 0 ? (
                <option value="">No incidents</option>
              ) : (
                incidents.map((incident) => (
                  <option key={incident.id} value={incident.id}>
                    {incident.title}
                  </option>
                ))
              )}
            </select>
          </CyberPanel>
          <CyberPanel title="Enterprise Risk Formula" compact glow="red">
            <div className="mb-2 font-mono text-[9px] text-slate-500">Threat + Financial + Compliance + Vendor + Ops + Reputation</div>
            {breakdownItems.map((item) => (
              <div key={item.label} className="mb-1.5">
                <div className="flex justify-between font-mono text-[9px]">
                  <span className="text-slate-500">{item.label}</span>
                  <span className="text-slate-300">{item.value}/{item.max}</span>
                </div>
                <div className="h-1 overflow-hidden rounded bg-white/5">
                  <div className="h-full rounded bg-red-500/60" style={{ width: `${(item.value / item.max) * 100}%` }} />
                </div>
              </div>
            ))}
            <div className="mt-2 font-display text-xl font-bold text-red-400">{activeRiskScore}/100</div>
          </CyberPanel>
          <CyberPanel title="Scenarios" compact glow="cyan">
            {LIVE_SCENARIOS.map((scenario) => (
              <button
                key={scenario.id}
                type="button"
                onClick={() => setSelected(scenario)}
                className={`mb-1.5 w-full rounded border p-2 text-left transition-all last:mb-0 ${
                  selected.id === scenario.id ? "glow-active border-cyan-500/30 bg-cyan-500/5" : "border-white/5 hover:border-cyan-500/15"
                }`}
              >
                <div className="font-mono text-[10px] font-medium text-white">{scenario.title}</div>
                <div className="font-mono text-[9px] text-slate-600">{scenario.description.slice(0, 50)}...</div>
              </button>
            ))}
          </CyberPanel>
          <div className="flex gap-1">
            {(["24h", "7d"] as const).map((tf) => (
              <button key={tf} type="button" onClick={() => setTimeframe(tf)} className={`flex-1 rounded border p-1.5 font-mono text-[9px] ${timeframe === tf ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-300" : "border-white/5 text-slate-600"}`}>
                {tf.toUpperCase()}
              </button>
            ))}
          </div>
          {incidentsLoading && <p className="font-mono text-[10px] text-slate-500">Loading incidents...</p>}
          {!incidentsLoading && !incidents.length && (
            <div className="rounded border border-amber-500/25 bg-amber-500/10 px-2.5 py-2 font-mono text-[10px] text-amber-200">
              No incidents found for the current organization context.
              <div className="mt-1 text-amber-300/80">Open Command Center and create an incident, then return here.</div>
            </div>
          )}
          {!selectedIncidentId && incidents.length > 0 && <p className="font-mono text-[10px] text-amber-400">Select an incident to run live simulations.</p>}
          {incidentsError && <p className="font-mono text-[10px] text-red-400">{incidentsError}</p>}
          {error && <p className="font-mono text-[10px] text-red-400">{error}</p>}
          {simulation?.computedAt && (
            <p className="font-mono text-[10px] text-emerald-400">Live model updated {new Date(simulation.computedAt).toLocaleTimeString()}</p>
          )}
          {!simulation && selectedIncidentId && !loading && (
            <p className="font-mono text-[10px] text-amber-300">Waiting for live simulation output. Showing fallback risk model.</p>
          )}
        </div>

        <div className="col-span-5 space-y-2 overflow-y-auto">
          <CyberPanel title={selected.title} glow="red">
            <p className="mb-3 font-mono text-[10px] text-slate-400">{selected.description}</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(impacts).map(([key, value]) => {
                const Icon = IMPACT_ICONS[key as keyof typeof IMPACT_ICONS] ?? Star;
                return (
                  <div key={key} className="rounded border border-white/5 p-2">
                    <div className="mb-1 flex items-center gap-1 font-mono text-[9px] uppercase text-slate-500">
                      <Icon className="h-3 w-3" /> {key}
                    </div>
                    <div className="font-display text-lg font-bold text-white">
                      {key === "financial" ? `$${Math.round(value).toLocaleString()}` : value}
                    </div>
                  </div>
                );
              })}
            </div>
            {loading && <p className="mt-2 font-mono text-[10px] text-slate-500">Running simulation...</p>}
            {simulation?.confidence != null && (
              <CyberBadge label={`Confidence ${Math.round(simulation.confidence * 100)}%`} variant="amber" />
            )}
            {simulation?.basis && (
              <div className="mt-2 grid grid-cols-3 gap-1.5 font-mono text-[9px] text-slate-500">
                <div>Evidence: {simulation.basis.evidenceCount}</div>
                <div>Compliance: {simulation.basis.complianceCount}</div>
                <div>Legal: {simulation.basis.legalCount}</div>
                <div>Pending: {simulation.basis.pendingApprovals}</div>
                <div>Vendor Risk: {simulation.basis.vendorRiskScore}</div>
                <div>Latest Risk: {simulation.basis.latestRiskScore}</div>
              </div>
            )}
            {simulation?.recommendation && <p className="mt-2 font-mono text-[10px] text-amber-300">{simulation.recommendation}</p>}
          </CyberPanel>

          <CyberPanel title="Impact Radar" glow="violet">
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#1e293b" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "#64748b", fontSize: 9 }} />
                <Radar dataKey="value" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.25} />
              </RadarChart>
            </ResponsiveContainer>
          </CyberPanel>
        </div>

        <div className="col-span-4 space-y-2 overflow-y-auto">
          <CyberPanel title="Scenario Comparison" glow="cyan">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={compareData}>
                <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 8 }} />
                <YAxis tick={{ fill: "#64748b", fontSize: 8 }} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", fontSize: 10 }} />
                <Bar dataKey="financial" fill="#22d3ee" />
                <Bar dataKey="legal" fill="#a78bfa" />
              </BarChart>
            </ResponsiveContainer>
          </CyberPanel>

          <CyberPanel title="Agent Debate" glow="amber">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2 font-mono text-[10px]">
              <p className="text-cyan-300">Risk Agent: {simulation ? `Scenario "${selected.title}" projects elevated exposure.` : "Awaiting simulation output."}</p>
              <p className="text-violet-300">Legal Agent: {impacts.legal >= 70 ? "High disclosure risk. Trigger external counsel and prepare regulator briefing." : "Legal burden manageable with documented controls and timeline."}</p>
              <p className="text-emerald-300">Executive Agent: {impacts.financial >= 1000000 ? "Prioritize cash protection actions and board-level escalation." : "Proceed with controlled remediation and stakeholder transparency."}</p>
            </motion.div>
          </CyberPanel>
        </div>
      </div>
    </AppShell>
  );
}
