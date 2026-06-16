"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { CyberPanel, CyberBadge } from "@/components/cyber/CyberPanel";
import { NeonButton } from "@/components/ui/NeonButton";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { Toast } from "@/components/ui/Toast";
import { Bot, Scale, DollarSign, Shield, Users, TrendingDown, Building2, Star, Loader2, CheckCircle2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { DecisionOption } from "@/lib/types";
import { fetchJsonWithRetry, fetchWithRetry } from "@/lib/http/retry";

const IMPACT_LABELS = [
  { key: "financial", label: "Financial", icon: DollarSign, color: "#ef4444" },
  { key: "compliance", label: "Compliance", icon: Shield, color: "#8b5cf6" },
  { key: "legal", label: "Legal", icon: Scale, color: "#f59e0b" },
  { key: "operational", label: "Operational", icon: Building2, color: "#22d3ee" },
  { key: "customer", label: "Customer", icon: Users, color: "#34d399" },
  { key: "reputation", label: "Reputation", icon: TrendingDown, color: "#fb7185" },
] as const;

function formatMoney(n: number) {
  return n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${(n / 1000).toFixed(0)}K`;
}

interface DecisionApiResult {
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

export function DecisionWarRoomView() {
  const [incidents, setIncidents] = useState<Array<{ id: string; title: string }>>([]);
  const [incidentId, setIncidentId] = useState<string>("");
  const [decision, setDecision] = useState<DecisionApiResult | null>(null);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; kind: "success" | "error" | "info" } | null>(null);

  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        const incidentsJson = await fetchJsonWithRetry<{ incidents: Array<{ id: string; title: string }> }>(
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
      }
    };
    run();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const run = async () => {
      if (!incidentId) return;
      setLoading(true);
      try {
        const data = await fetchJsonWithRetry<{ decision: DecisionApiResult }>(
          `/api/decisions?incidentId=${encodeURIComponent(incidentId)}`,
          { cache: "no-store" },
          { retries: 2 }
        );
        if (!active) return;
        setDecision(data.decision);
        setSelectedId(data.decision.ranking[0]?.id ?? "");
      } catch (error) {
        if (!active) return;
        setToast({ message: error instanceof Error ? error.message : "Failed to generate decision", kind: "error" });
      } finally {
        if (active) setLoading(false);
      }
    };
    run();
    return () => {
      active = false;
    };
  }, [incidentId]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const selected = useMemo(
    () => decision?.ranking.find((option) => option.id === selectedId) ?? decision?.ranking[0] ?? null,
    [decision, selectedId]
  );

  const chartData = (decision?.ranking ?? []).map((o) => ({
    name: o.label.slice(0, 10),
    savings: o.expectedSavings / 10000,
    confidence: o.confidence,
  }));

  const nextApprovalStep = decision?.approvalChain.find((step) => step.status === "pending") ?? null;

  const createApprovalChain = async () => {
    if (!incidentId) return;
    setSubmitting(true);
    try {
      const res = await fetchWithRetry("/api/approvals/chain", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ incidentId }),
      }, { retries: 1 });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create approval chain");
      setDecision((previous) => (previous ? { ...previous, approvalChain: data.approvals } : previous));
      setToast({ message: "Approval chain created", kind: "success" });
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : "Approval chain failed", kind: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const respondStep = async (decisionAction: "approved" | "rejected" | "escalated") => {
    if (!nextApprovalStep) return;
    setSubmitting(true);
    try {
      const res = await fetchWithRetry(`/api/approvals/${nextApprovalStep.id}/respond`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ decision: decisionAction, decisionNote: `Updated in Decision War Room (${decisionAction})` }),
      }, { retries: 1 });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update approval");

      setDecision((previous) => {
        if (!previous) return previous;
        return {
          ...previous,
          approvalChain: previous.approvalChain.map((step) =>
            step.id === data.approval.id
              ? {
                  ...step,
                  status: data.approval.status,
                  timestamp: data.approval.updatedAt ?? new Date().toISOString(),
                  note: data.approval.decisionNote ?? step.note,
                }
              : step
          ),
        };
      });
      setToast({ message: `Step ${decisionAction}`, kind: "success" });
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : "Failed to update step", kind: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell title="Decision War Room" subtitle="Live executive decision engine from investigation data" fullWidth>
      {toast && <Toast message={toast.message} kind={toast.kind} />}
      <div className="grid h-[calc(100vh-5.5rem)] min-h-0 grid-cols-12 gap-3 overflow-hidden p-3">
        <ScrollArea className="col-span-12 h-full max-h-[calc(100vh-5.5rem)] min-h-0 lg:col-span-3">
          <div className="space-y-3 pr-1">
          <CyberPanel title="Incident" glow="cyan" hover={false}>
            <select
              value={incidentId}
              onChange={(event) => setIncidentId(event.target.value)}
              className="w-full rounded border border-white/10 bg-slate-950 px-2 py-2 font-mono text-xs text-slate-200"
            >
              {incidents.map((incident) => (
                <option key={incident.id} value={incident.id}>
                  {incident.title}
                </option>
              ))}
            </select>
          </CyberPanel>
          <CyberPanel title="Decision Options" glow="cyan" hover={false}>
            {loading && (
              <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
                <Loader2 className="h-3 w-3 animate-spin" /> Generating decision options...
              </div>
            )}
            {!loading && (decision?.ranking ?? []).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSelectedId(opt.id)}
                className={`mb-2 w-full rounded border p-2.5 text-left transition-all last:mb-0 ${
                  selected?.id === opt.id ? "glow-active border-cyan-500/40 bg-cyan-500/5" : "border-white/5 hover:border-cyan-500/20"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-medium text-white">{opt.label}</span>
                  {opt.recommended && <CyberBadge label="REC" variant="emerald" />}
                </div>
                <div className="mt-1 font-mono text-[10px] text-slate-500">Rank #{opt.rank} · {opt.confidence}% confidence</div>
              </button>
            ))}
          </CyberPanel>
          </div>
        </ScrollArea>

        <ScrollArea className="col-span-12 h-full max-h-[calc(100vh-5.5rem)] min-h-0 lg:col-span-6">
          <div className="space-y-3 pr-1">
          <CyberPanel title={`Agent Debate: ${selected?.label ?? "Decision Model"}`} glow="violet" hover={false}>
            <p className="mb-4 font-mono text-[11px] leading-relaxed text-slate-400">{selected?.rationale ?? "Decision recommendation is being generated from live incident data."}</p>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {IMPACT_LABELS.map(({ key, label, icon: Icon }) => (
                <div key={key} className="rounded border border-white/5 bg-white/[0.02] p-3">
                  <Icon className="mb-1 h-4 w-4 text-slate-500" />
                  <div className="font-mono text-[10px] text-slate-500">{label} Impact</div>
                  <div className="font-mono text-lg font-bold text-white">{selected?.impacts[key as keyof typeof selected.impacts] ?? 0}%</div>
                </div>
              ))}
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div>
                <div className="mb-1 font-mono text-[10px] font-medium text-emerald-400">Agent Support</div>
                {selected?.agentSupport.map((a) => (
                  <div key={a} className="flex items-center gap-1.5 font-mono text-[10px] text-slate-400">
                    <Bot className="h-3 w-3 text-emerald-400" /> {a}
                  </div>
                ))}
              </div>
              <div>
                <div className="mb-1 font-mono text-[10px] font-medium text-red-400">Agent Opposition</div>
                {selected?.agentOpposition.length ? selected.agentOpposition.map((a) => (
                  <div key={a} className="flex items-center gap-1.5 font-mono text-[10px] text-slate-400">
                    <Bot className="h-3 w-3 text-red-400" /> {a}
                  </div>
                )) : <span className="font-mono text-[10px] text-slate-600">No opposition</span>}
              </div>
            </div>
            <div className="mt-4 rounded border border-cyan-500/20 bg-cyan-500/[0.03] p-3">
              <div className="mb-1 font-mono text-[10px] text-slate-500">Reasoning Chain</div>
              <ul className="space-y-1">
                {(decision?.reasoningChain ?? []).map((line, index) => (
                  <li key={`${line}-${index}`} className="font-mono text-[10px] text-slate-300">{index + 1}. {line}</li>
                ))}
              </ul>
            </div>
          </CyberPanel>

          <CyberPanel title="Option Comparison" glow="amber" hover={false}>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 9 }} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 9 }} />
                <Tooltip contentStyle={{ background: "#0c1222", border: "1px solid rgba(34,211,238,0.2)", fontSize: 10 }} />
                <Bar dataKey="confidence" fill="#22d3ee" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CyberPanel>
          </div>
        </ScrollArea>

        <ScrollArea className="col-span-12 h-full max-h-[calc(100vh-5.5rem)] min-h-0 lg:col-span-3">
          <div className="space-y-3 pr-1">
          <CyberPanel title="Recommendation Ranking" glow="emerald" hover={false}>
            {(decision?.ranking ?? []).map((entry, i) => (
              <div key={entry.id} className="mb-2 flex items-center gap-2 font-mono text-[11px] last:mb-0">
                <Star className={`h-3 w-3 ${i === 0 ? "text-amber-400" : "text-slate-600"}`} />
                <span className={i === 0 ? "font-medium text-emerald-300" : "text-slate-400"}>#{i + 1} {entry.label}</span>
              </div>
            ))}
          </CyberPanel>
          <CyberPanel compact glow="cyan" hover={false}>
            <div className="font-mono text-[10px] text-slate-500">Recommended Action</div>
            <div className="font-display text-sm font-bold text-emerald-300">{decision?.recommendedAction ?? "-"}</div>
            <div className="mt-2 font-mono text-[10px] text-slate-500">Expected Savings</div>
            <div className="font-display text-xl font-bold text-emerald-400">{formatMoney(selected?.expectedSavings ?? 0)}</div>
            <div className="mt-2 font-mono text-[10px] text-slate-500">Confidence Score</div>
            <div className="font-display text-lg font-bold text-cyan-300">{decision?.confidenceScore ?? 0}%</div>
          </CyberPanel>
          <CyberPanel title="Approval Chain" glow="violet" hover={false}>
            {(decision?.approvalChain.length ?? 0) === 0 && (
              <div className="font-mono text-[10px] text-slate-500">No approval chain yet.</div>
            )}
            {(decision?.approvalChain ?? []).map((step) => (
              <div key={step.id} className="mb-2 flex items-center gap-2 rounded border border-white/5 p-2 font-mono text-[10px] last:mb-0">
                {step.status === "approved" ? (
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                ) : (
                  <span className={`h-2 w-2 rounded-full ${step.status === "pending" ? "bg-amber-400" : "bg-red-400"}`} />
                )}
                <span className="text-slate-300">{step.role}</span>
                <span className="ml-auto capitalize text-slate-500">{step.status}</span>
              </div>
            ))}
            {nextApprovalStep ? (
              <div className="mt-3 grid grid-cols-3 gap-1">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => respondStep("approved")}
                  className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 font-mono text-[10px] text-emerald-300 disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => respondStep("rejected")}
                  className="rounded border border-red-500/30 bg-red-500/10 px-2 py-1 font-mono text-[10px] text-red-300 disabled:opacity-50"
                >
                  Reject
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => respondStep("escalated")}
                  className="rounded border border-amber-500/30 bg-amber-500/10 px-2 py-1 font-mono text-[10px] text-amber-300 disabled:opacity-50"
                >
                  Escalate
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={submitting || !incidentId}
                onClick={createApprovalChain}
                className="mt-3 w-full rounded border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 font-mono text-[10px] text-cyan-300 disabled:opacity-50"
              >
                {submitting ? "Creating..." : "Create Approval Chain"}
              </button>
            )}
          </CyberPanel>
          <CyberPanel title="Impact Snapshot" glow="amber" hover={false}>
            <div className="grid grid-cols-2 gap-2 font-mono text-[10px]">
              <div className="text-slate-500">Financial</div><div className="text-red-300">{formatMoney(decision?.financialImpact ?? 0)}</div>
              <div className="text-slate-500">Compliance</div><div className="text-violet-300">{decision?.complianceImpact ?? 0}%</div>
              <div className="text-slate-500">Legal</div><div className="text-amber-300">{decision?.legalExposure ?? 0}%</div>
              <div className="text-slate-500">Operational</div><div className="text-cyan-300">{decision?.operationalImpact ?? 0}%</div>
              <div className="text-slate-500">Reputation</div><div className="text-pink-300">{decision?.reputationImpact ?? 0}%</div>
            </div>
          </CyberPanel>
          <NeonButton href="/executive-report" size="sm" className="w-full font-mono text-[10px]">
            Generate Executive Report
          </NeonButton>
          <NeonButton href="/investigation" size="sm" variant="secondary" className="w-full font-mono text-[10px]">
            Return to Investigation
          </NeonButton>
          </div>
        </ScrollArea>
      </div>
    </AppShell>
  );
}
