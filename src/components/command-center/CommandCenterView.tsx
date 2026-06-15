"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Bot, CheckCircle, FileText, Plus, Search, Shield, UserPlus } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { CyberBadge, CyberPanel } from "@/components/cyber/CyberPanel";
import { CreateIncidentModal } from "@/components/command-center/CreateIncidentModal";
import { NeonButton } from "@/components/ui/NeonButton";
import { messageTypeColor, severityColor } from "@/lib/utils";
import { fetchJsonWithRetry } from "@/lib/http/retry";
import { useRealtime } from "@/hooks/useRealtime";
import { useNeuralOpsStore } from "@/store/neural-ops";
import type { MessageType, TimelineEvent } from "@/lib/types";

const CommandCenterCanvas = dynamic(
  () =>
    import("@/components/command-center/CommandCenterCanvas")
      .then((m) => m.CommandCenterCanvas)
      .catch(() => {
        return function CommandCenterCanvasFallback() {
          return (
            <div className="flex h-full w-full items-center justify-center bg-[#020617] font-mono text-xs text-slate-400">
              3D canvas unavailable
            </div>
          );
        };
      }),
  { ssr: false, loading: () => <div className="h-full w-full animate-pulse bg-[#020617]/80" /> }
);
const EnterpriseNetworkTwinScene = dynamic(
  () =>
    import("@/components/3d/EnterpriseNetworkTwin")
      .then((m) => m.EnterpriseNetworkTwinScene)
      .catch(() => {
        return function EnterpriseNetworkTwinFallback() {
          return null;
        };
      }),
  { ssr: false }
);

interface IncidentSummary {
  id: string;
  title: string;
  status: string;
  severity: "critical" | "high" | "medium" | "low";
  riskScore?: number;
}

interface IncidentDetails {
  id: string;
  title: string;
  status: string;
  severity: "critical" | "high" | "medium" | "low";
  rooms: Array<{
    id: string;
    name: string;
    agents: Array<{ id: string; name: string; status: string }>;
    messages: Array<{
      id: string;
      messageType: MessageType;
      createdAt: string;
      agent: { name: string } | null;
      recipient: { name: string } | null;
      contentJson: { summary?: string };
    }>;
  }>;
  evidence: Array<{ id: string }>;
  riskAssessments: Array<{ riskScore: number }>;
  approvals: Array<{
    id: string;
    actionTitle: string;
    requestedByAgent: { name: string };
    riskLevel: "critical" | "high" | "medium" | "low";
    status: "pending" | "approved" | "rejected" | "escalated";
  }>;
  auditLogs: Array<{
    id: string;
    action: string;
    createdAt: string;
    actorId: string;
  }>;
}

function messageTypeBadge(type: MessageType): { label: string; variant: "cyan" | "violet" | "red" | "amber" | "emerald" } {
  if (type === "EVIDENCE_SUBMISSION" || type === "CONTEXT_SHARE") return { label: "EVIDENCE", variant: "amber" };
  if (type === "REVIEW_REQUEST" || type === "RISK_UPDATE") return { label: "REVIEW", variant: "violet" };
  if (type === "TASK_HANDOFF" || type === "AGENT_RECRUITMENT") return { label: "HANDOFF", variant: "cyan" };
  if (type === "APPROVAL_REQUEST") return { label: "APPROVAL", variant: "red" };
  return { label: "DECISION", variant: "emerald" };
}

function timelineIcon(type: TimelineEvent["type"]) {
  const cls = "h-3 w-3 shrink-0";
  switch (type) {
    case "detection":
      return <AlertTriangle className={`${cls} text-red-400`} />;
    case "recruitment":
      return <UserPlus className={`${cls} text-cyan-400`} />;
    case "investigation":
      return <Search className={`${cls} text-violet-400`} />;
    case "evidence":
      return <FileText className={`${cls} text-amber-400`} />;
    case "approval":
      return <Shield className={`${cls} text-red-400`} />;
    case "decision":
      return <CheckCircle className={`${cls} text-emerald-400`} />;
    default:
      return <Bot className={`${cls} text-slate-500`} />;
  }
}

function toTimelineType(action: string): TimelineEvent["type"] {
  if (action.includes("approval")) return "approval";
  if (action.includes("evidence")) return "evidence";
  if (action.includes("recruit")) return "recruitment";
  if (action.includes("decision") || action.includes("report")) return "decision";
  if (action.includes("detect") || action.includes("alert")) return "detection";
  return "investigation";
}

export function CommandCenterView() {
  const [incidents, setIncidents] = useState<IncidentSummary[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>("");
  const [details, setDetails] = useState<IncidentDetails | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const refreshSeqRef = useRef(0);

  const handleIncidentCreated = useCallback(
    (incident: IncidentSummary) => {
      setIncidents((prev) => [incident, ...prev.filter((item) => item.id !== incident.id)]);
      setSelectedIncidentId(incident.id);
      useNeuralOpsStore.setState({
        selectedIncidentId: incident.id,
        incidentCount: incidents.length + 1,
        liveStatus: "investigating",
      });
    },
    [incidents.length]
  );

  const loadIncidentDetails = useCallback(async (incidentId: string, options?: { silent?: boolean }) => {
    if (!incidentId) return;
    if (!options?.silent) setLoading(true);
    try {
      setError(null);
      const data = await fetchJsonWithRetry<{ incident: IncidentDetails }>(
        `/api/incidents/${encodeURIComponent(incidentId)}`,
        { cache: "no-store" },
        { retries: 2 }
      );
      setDetails(data.incident);
      useNeuralOpsStore.setState({
        selectedIncidentId: data.incident.id,
        incidentCount: incidents.length || 1,
        activeAgentCount: data.incident.rooms[0]?.agents.length ?? 0,
        evidenceCount: data.incident.evidence.length,
        riskScore: Math.round(data.incident.riskAssessments[0]?.riskScore ?? 0),
        approvalStatus: data.incident.approvals.find((item) => item.status === "pending") ? "Pending Approval" : "Auto-approved",
        bandConnected: (data.incident.rooms[0]?.agents.length ?? 0) > 0,
        liveStatus:
          data.incident.status === "contained" || data.incident.status === "resolved"
            ? "idle"
            : data.incident.status === "investigating"
              ? "investigating"
              : "idle",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load incident details");
    } finally {
      if (!options?.silent) setLoading(false);
    }
  }, [incidents.length]);

  const handleRealtimeEvent = useCallback(() => {
    refreshSeqRef.current += 1;
    if (selectedIncidentId) {
      void loadIncidentDetails(selectedIncidentId, { silent: true });
    }
  }, [loadIncidentDetails, selectedIncidentId]);

  useRealtime(selectedIncidentId || undefined, { onEvent: handleRealtimeEvent });

  useEffect(() => {
    let active = true;
    const loadIncidents = async () => {
      try {
        setError(null);
        let data = await fetchJsonWithRetry<{ incidents: IncidentSummary[] }>("/api/incidents", { cache: "no-store" }, { retries: 2 });
        if (!active) return;

        if (!data.incidents?.length) {
          try {
            await fetchJsonWithRetry("/api/operations/bootstrap", { method: "POST" });
            data = await fetchJsonWithRetry<{ incidents: IncidentSummary[] }>("/api/incidents", { cache: "no-store" }, { retries: 2 });
          } catch {
            // bootstrap may have already run from LiveDataProvider
          }
        }

        if (!active) return;
        setIncidents(data.incidents ?? []);
        if (data.incidents?.[0]?.id) setSelectedIncidentId((curr) => curr || data.incidents[0].id);
        if (!data.incidents?.length) setLoading(false);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load incidents");
        setLoading(false);
      }
    };
    void loadIncidents();
    const timer = setInterval(() => void loadIncidents(), 30_000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!selectedIncidentId) return;
    let active = true;
    const loadDetails = async () => {
      if (!active) return;
      await loadIncidentDetails(selectedIncidentId);
    };
    void loadDetails();
    const timer = setInterval(() => {
      if (active) void loadIncidentDetails(selectedIncidentId, { silent: true });
    }, 15_000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [loadIncidentDetails, selectedIncidentId]);

  const activeAgents = details?.rooms[0]?.agents ?? [];
  const recentMessages = useMemo(() => {
    const roomMessages = details?.rooms[0]?.messages ?? [];
    return roomMessages.slice(-6).map((msg) => ({
      id: msg.id,
      from: msg.agent?.name ?? "Unknown Agent",
      to: msg.recipient?.name ?? "All",
      type: msg.messageType,
      content: msg.contentJson?.summary ?? "Message payload available",
      timestamp: msg.createdAt,
    }));
  }, [details]);
  const timelineEvents = (details?.auditLogs ?? []).slice(0, 10).map((event) => ({
    id: event.id,
    title: event.action.replaceAll("_", " "),
    time: new Date(event.createdAt).toLocaleTimeString(),
    type: toTimelineType(event.action),
  })) as TimelineEvent[];

  return (
    <AppShell title="Command Center" subtitle="Enterprise Digital Twin · Live incident telemetry" fullWidth>
      <div className="grid h-[calc(100vh-5.5rem)] grid-cols-12 grid-rows-[1fr_68px] gap-1.5 p-1.5">
        <div className="col-span-2 min-h-0 overflow-hidden">
          <CyberPanel title="Incident Queue" compact glow="red" className="flex h-full flex-col">
            <NeonButton size="sm" onClick={() => setCreateOpen(true)} className="mb-2 w-full">
              <Plus className="h-3.5 w-3.5" />
              New Incident
            </NeonButton>
            <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
              {incidents.map((incident) => {
                const isActive = incident.id === selectedIncidentId;
                return (
                  <button
                    key={incident.id}
                    type="button"
                    onClick={() => setSelectedIncidentId(incident.id)}
                    className={`w-full rounded border px-2 py-1.5 text-left transition-all ${
                      isActive ? "glow-active border-cyan-500/40 bg-cyan-500/8" : "border-white/5 hover:border-cyan-500/15"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-mono text-[10px] text-slate-500">{incident.id}</span>
                      <CyberBadge label={incident.severity} variant={incident.severity === "critical" ? "red" : "amber"} pulse={incident.severity === "critical"} />
                    </div>
                    <div className="mt-0.5 truncate font-mono text-[11px] font-medium text-white">{incident.title}</div>
                    <div className="mt-0.5 flex justify-between font-mono text-[10px]">
                      <span className="capitalize text-slate-500">{incident.status.replace("_", " ")}</span>
                      <span className={severityColor(incident.severity)}>{Math.round(incident.riskScore ?? 0)}</span>
                    </div>
                  </button>
                );
              })}
              {!incidents.length && !loading && (
                <div className="space-y-2 py-2 text-center">
                  <div className="font-mono text-[10px] text-slate-500">No incidents yet.</div>
                  <NeonButton size="sm" onClick={() => setCreateOpen(true)} className="w-full">
                    <Plus className="h-3.5 w-3.5" />
                    Create first incident
                  </NeonButton>
                </div>
              )}
            </div>
          </CyberPanel>
        </div>

        <div className="col-span-8 relative min-h-0 overflow-hidden rounded-lg border border-cyan-500/25 glass-premium">
          <CommandCenterCanvas className="absolute inset-0 h-full w-full">
            <EnterpriseNetworkTwinScene onNodeSelect={setSelectedNodeId} />
          </CommandCenterCanvas>
          {!selectedIncidentId && !loading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#020617]/55">
              <div className="rounded border border-cyan-500/25 bg-[#020617]/85 px-5 py-4 text-center">
                <div className="font-mono text-xs text-cyan-300">No active incident selected</div>
                <div className="mt-1 max-w-[320px] font-mono text-[11px] text-slate-400">
                  Create or open an incident to populate the digital twin, investigation stream, and timeline.
                </div>
                <NeonButton size="sm" onClick={() => setCreateOpen(true)} className="mt-3">
                  <Plus className="h-3.5 w-3.5" />
                  New Incident
                </NeonButton>
              </div>
            </div>
          )}
          {loading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#020617]/35">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500/30 border-t-cyan-400" />
            </div>
          )}
          <div className="absolute left-2 top-2 z-10">
            <CyberPanel compact glow="cyan">
              <div className="font-mono text-[8px] text-slate-500">DIGITAL TWIN</div>
              <div className="font-mono text-[10px] font-bold text-white">{details?.title ?? "Select an incident"}</div>
            </CyberPanel>
          </div>
          {selectedNodeId && (
            <div className="absolute right-2 top-2 z-10">
              <CyberPanel compact glow="amber">
                <div className="font-mono text-[9px] text-amber-400">NODE: {selectedNodeId.toUpperCase()}</div>
              </CyberPanel>
            </div>
          )}
          <div className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-2">
            <NeonButton size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
              New Incident
            </NeonButton>
            <NeonButton href="/investigation" size="sm">Investigation Room</NeonButton>
            <NeonButton href="/evidence" variant="secondary" size="sm">Evidence Graph</NeonButton>
          </div>
        </div>

        <div className="col-span-2 flex min-h-0 flex-col gap-1.5 overflow-hidden">
          <CyberPanel title="Active Agents" compact glow="cyan" className="shrink-0">
            <div className="mb-1 font-mono text-[10px] font-medium text-cyan-400">{activeAgents.length} online</div>
            <div className="flex flex-wrap gap-1">
              {activeAgents.slice(0, 10).map((agent) => (
                <span key={agent.id} className="inline-flex items-center gap-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-1.5 py-0.5 font-mono text-[10px] text-slate-200">
                  <span className="h-1 w-1 rounded-full bg-cyan-400" />
                  {agent.name.split(" ")[0]}
                </span>
              ))}
            </div>
          </CyberPanel>

          <CyberPanel title="Band Stream" compact glow="violet" className="min-h-0 flex-1 overflow-hidden">
            <div className="max-h-[calc(100vh-22rem)] space-y-1 overflow-y-auto">
              {recentMessages.map((msg) => {
                const badge = messageTypeBadge(msg.type);
                return (
                  <div key={msg.id} className={`rounded border px-1.5 py-1 ${messageTypeColor(msg.type)}`}>
                    <div className="flex flex-wrap items-center gap-1 font-mono text-[10px]">
                      <span className="font-medium text-cyan-300">{msg.from}</span>
                      <span className="text-slate-600">→</span>
                      <span className="text-violet-300">{msg.to}</span>
                      <CyberBadge label={badge.label} variant={badge.variant} />
                    </div>
                    <div className="mt-0.5 line-clamp-2 font-mono text-[10px] leading-snug text-slate-400">{msg.content}</div>
                  </div>
                );
              })}
              {!recentMessages.length && <div className="font-mono text-[10px] text-slate-500">No messages yet.</div>}
            </div>
          </CyberPanel>

          <CyberPanel compact glow="red" className="shrink-0">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-medium text-slate-400">RISK</span>
              <span className="font-display text-lg font-bold text-red-400">
                {Math.round(details?.riskAssessments[0]?.riskScore ?? 0)}
              </span>
            </div>
            <div className="mt-1 flex justify-between font-mono text-[10px]">
              <span className="text-slate-500">Evidence</span>
              <span className="font-medium text-emerald-400">{details?.evidence.length ?? 0}</span>
            </div>
            <div className="mt-0.5 flex justify-between font-mono text-[10px]">
              <span className="text-slate-500">Pending Approvals</span>
              <span className="font-medium text-amber-400">{details?.approvals.filter((a) => a.status === "pending").length ?? 0}</span>
            </div>
          </CyberPanel>
        </div>

        <div className="col-span-12 min-h-0">
          <CyberPanel title="Investigation Timeline" compact noPadding glow="cyan">
            <div className="relative px-2 py-1.5">
              <div className="absolute left-4 right-4 top-[22px] h-px bg-cyan-500/15" />
              <motion.div
                className="absolute left-4 top-[22px] h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
                style={{ width: "40%" }}
                animate={{ x: ["0%", "150%"] }}
                transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
              />
              <div className="relative flex gap-1.5 overflow-x-auto pb-0.5">
                {timelineEvents.map((event) => (
                  <div key={event.id} className="flex shrink-0 items-start gap-1.5 rounded border border-cyan-500/10 bg-cyan-500/[0.04] px-2 py-1">
                    {timelineIcon(event.type)}
                    <div>
                      <div className="font-mono text-[10px] text-cyan-400">{event.time}</div>
                      <div className="max-w-[160px] truncate font-mono text-[10px] text-slate-300">{event.title}</div>
                    </div>
                  </div>
                ))}
                {!timelineEvents.length && !loading && <div className="font-mono text-[10px] text-slate-500">No timeline events available.</div>}
              </div>
            </div>
          </CyberPanel>
        </div>
      </div>
      {error && (
        <div className="pointer-events-none fixed bottom-12 right-4 z-[120] rounded border border-red-500/30 bg-red-500/10 px-3 py-2 font-mono text-[11px] text-red-200">
          {error}
        </div>
      )}
      <CreateIncidentModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={handleIncidentCreated}
      />
    </AppShell>
  );
}
