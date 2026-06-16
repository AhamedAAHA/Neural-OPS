"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle, Scale, Shield, XCircle } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { CyberBadge, CyberPanel } from "@/components/cyber/CyberPanel";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { fetchJsonWithRetry } from "@/lib/http/retry";
import { messageTypeColor } from "@/lib/utils";

type FindingStatus = "compliant" | "at_risk" | "violation";

interface IncidentSummary {
  id: string;
  title: string;
}

interface IncidentCompliance {
  id: string;
  title: string;
  complianceFindings: Array<{
    id: string;
    regulation: string;
    finding: string;
    requiredAction: string;
    severity: "critical" | "high" | "medium" | "low";
    createdAt: string;
    generatedByAgent: { name: string };
  }>;
  legalFindings: Array<{
    id: string;
    disclosureRequirement: string;
    recommendedAction: string;
    legalExposure: number;
    createdAt: string;
  }>;
  rooms: Array<{
    messages: Array<{
      id: string;
      messageType: string;
      createdAt: string;
      agent: { name: string };
      recipient: { name: string } | null;
      contentJson: { summary?: string };
    }>;
  }>;
}

const STATUS_ICONS = {
  compliant: CheckCircle,
  at_risk: AlertTriangle,
  violation: XCircle,
};

const STATUS_COLORS = {
  compliant: "text-emerald-400",
  at_risk: "text-amber-400",
  violation: "text-red-400",
};

function statusFromSeverity(severity: "critical" | "high" | "medium" | "low"): FindingStatus {
  if (severity === "critical" || severity === "high") return "violation";
  if (severity === "medium") return "at_risk";
  return "compliant";
}

export function ComplianceCenterView() {
  const [incidentId, setIncidentId] = useState<string>("");
  const [incident, setIncident] = useState<IncidentCompliance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        const data = await fetchJsonWithRetry<{ incidents: IncidentSummary[] }>("/api/incidents", { cache: "no-store" }, { retries: 2 });
        if (!active) return;
        if (data.incidents?.[0]?.id) setIncidentId((curr) => curr || data.incidents[0].id);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load incidents");
      }
    };
    void run();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!incidentId) return;
    let active = true;
    const run = async () => {
      setLoading(true);
      try {
        setError(null);
        const data = await fetchJsonWithRetry<{ incident: IncidentCompliance }>(
          `/api/incidents/${encodeURIComponent(incidentId)}`,
          { cache: "no-store" },
          { retries: 2 }
        );
        if (!active) return;
        setIncident(data.incident);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load compliance data");
      } finally {
        if (active) setLoading(false);
      }
    };
    void run();
    return () => {
      active = false;
    };
  }, [incidentId]);

  const grouped = useMemo(() => {
    const groups = new Map<string, IncidentCompliance["complianceFindings"]>();
    for (const item of incident?.complianceFindings ?? []) {
      const existing = groups.get(item.regulation) ?? [];
      existing.push(item);
      groups.set(item.regulation, existing);
    }
    return Array.from(groups.entries());
  }, [incident]);

  const legalMessages = (incident?.rooms[0]?.messages ?? []).filter((msg) =>
    msg.agent.name.toLowerCase().includes("legal") ||
    msg.agent.name.toLowerCase().includes("compliance") ||
    (msg.recipient?.name ?? "").toLowerCase().includes("legal")
  );

  return (
    <AppShell title="Compliance Center" subtitle="Regulatory and legal posture from live investigation data">
      <div className="mb-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
        {grouped.map(([framework, findings]) => {
          const mostSevere = findings.sort((a, b) => {
            const score = { low: 1, medium: 2, high: 3, critical: 4 };
            return score[b.severity] - score[a.severity];
          })[0];
          const status = statusFromSeverity(mostSevere?.severity ?? "low");
          const Icon = STATUS_ICONS[status];
          return (
            <CyberPanel key={framework} glow={status === "violation" ? "red" : status === "at_risk" ? "amber" : "emerald"} compact title={framework}>
              <div className="text-center">
                <Icon className={`mx-auto mb-1.5 h-5 w-5 ${STATUS_COLORS[status]}`} />
                <CyberBadge label={status.replaceAll("_", " ")} variant={status === "violation" ? "red" : status === "at_risk" ? "amber" : "emerald"} pulse={status === "violation"} />
                <div className="mt-2 font-mono text-[9px] text-slate-500">{findings.length} findings</div>
              </div>
            </CyberPanel>
          );
        })}
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {grouped.map(([framework, findings]) => (
          <CyberPanel key={framework} title={`${framework} Review`} glow="cyan">
            <div className="mb-3 flex items-center justify-between">
              <Shield className="h-4 w-4 text-cyan-400" />
              <CyberBadge label={`${findings.length} findings`} variant="amber" />
            </div>
            <ScrollArea className="max-h-64">
              <div className="space-y-2 pr-1">
              {findings.map((finding) => (
                <div key={finding.id} className="rounded border border-white/10 p-2">
                  <div className="mb-1 font-mono text-[11px] text-slate-200">{finding.finding}</div>
                  <div className="font-mono text-[10px] text-emerald-400">Action: {finding.requiredAction}</div>
                  <div className="mt-1 font-mono text-[9px] text-slate-500">{finding.generatedByAgent.name} · {new Date(finding.createdAt).toLocaleString()}</div>
                </div>
              ))}
              </div>
            </ScrollArea>
          </CyberPanel>
        ))}
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <CyberPanel title="Legal Escalation Status" glow="violet" className="lg:col-span-1">
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded border border-violet-500/20 bg-violet-500/5 px-3 py-2">
              <span className="text-xs text-slate-400">Legal Findings</span>
              <CyberBadge label={String(incident?.legalFindings.length ?? 0)} variant="violet" />
            </div>
            <ScrollArea className="max-h-48">
              <div className="space-y-2 pr-1">
              {(incident?.legalFindings ?? []).slice(0, 3).map((finding) => (
                <div key={finding.id} className="rounded border border-red-500/20 bg-red-500/5 px-3 py-2">
                  <div className="font-mono text-[10px] text-red-200">{finding.disclosureRequirement}</div>
                  <div className="mt-1 font-mono text-[9px] text-slate-400">{finding.recommendedAction}</div>
                  <div className="mt-1 font-mono text-[9px] text-amber-300">Exposure {Math.round(finding.legalExposure)}%</div>
                </div>
              ))}
              </div>
            </ScrollArea>
            <div className="mt-2 flex items-center gap-2 font-mono text-[10px] text-slate-500">
              <Scale className="h-3 w-3 text-violet-400" />
              Legal timeline updates from database events
            </div>
          </div>
        </CyberPanel>

        <CyberPanel title="Policy Mapping" glow="cyan" className="lg:col-span-2">
          <ScrollArea className="max-h-72">
          <div className="overflow-x-auto pr-1">
            <table className="w-full font-mono text-[10px]">
              <thead>
                <tr className="border-b border-cyan-500/10 text-left text-slate-500">
                  <th className="pb-2 pr-4">Framework</th>
                  <th className="pb-2 pr-4">Severity</th>
                  <th className="pb-2 pr-4">Owner</th>
                  <th className="pb-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {(incident?.complianceFindings ?? []).map((finding) => (
                  <tr key={finding.id} className="border-b border-white/5">
                    <td className="py-2 pr-4 text-slate-300">{finding.regulation}</td>
                    <td className="py-2 pr-4">
                      <CyberBadge label={finding.severity} variant={finding.severity === "critical" || finding.severity === "high" ? "red" : "amber"} />
                    </td>
                    <td className="py-2 pr-4 text-violet-400/80">{finding.generatedByAgent.name}</td>
                    <td className="py-2 text-slate-400">{new Date(finding.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </ScrollArea>
        </CyberPanel>
      </div>

      <CyberPanel title="Compliance and Legal Message Stream" glow="violet" className="mt-3">
        <ScrollArea className="max-h-96">
        <div className="space-y-2 pr-1">
          {legalMessages.map((msg) => (
            <div key={msg.id} className={`rounded border p-3 ${messageTypeColor(msg.messageType as never)}`}>
              <div className="mb-1.5 flex flex-wrap items-center gap-2 text-[10px]">
                <span className="font-medium text-cyan-400">{msg.agent.name}</span>
                <span className="text-slate-600">→</span>
                <span className="font-medium text-violet-400">{msg.recipient?.name ?? "All"}</span>
                <CyberBadge label={msg.messageType.replaceAll("_", " ")} variant="violet" />
                <span className="ml-auto font-mono text-slate-600">{new Date(msg.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-xs leading-relaxed text-slate-300">{msg.contentJson?.summary ?? "Structured message payload"}</p>
            </div>
          ))}
          {!legalMessages.length && !loading && (
            <div className="rounded border border-white/10 px-3 py-2 font-mono text-[10px] text-slate-500">
              No compliance/legal room messages found for this incident.
            </div>
          )}
        </div>
        </ScrollArea>
      </CyberPanel>
      {loading && <div className="mt-2 font-mono text-[10px] text-slate-500">Loading compliance data...</div>}
      {error && <div className="mt-2 font-mono text-[10px] text-red-400">{error}</div>}
    </AppShell>
  );
}
