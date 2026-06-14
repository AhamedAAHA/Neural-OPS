"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowRight, Bot, CheckCircle, ChevronRight, Clock, Cpu, FileSearch, Mic, Scale, UserPlus } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { CyberBadge, CyberPanel } from "@/components/cyber/CyberPanel";
import { JsonViewer } from "@/components/cyber/JsonViewer";
import { NeonButton } from "@/components/ui/NeonButton";
import { fetchJsonWithRetry } from "@/lib/http/retry";
import { formatTimestamp, messageTypeColor } from "@/lib/utils";
import { useRealtime } from "@/hooks/useRealtime";
import { useNeuralOpsStore } from "@/store/neural-ops";
import type { MessageType } from "@/lib/types";

interface IncidentSummary {
  id: string;
  title: string;
}

interface IncidentDetails {
  id: string;
  title: string;
  rooms: Array<{
    id: string;
    name: string;
    agents: Array<{ id: string; name: string; status: string; role: string }>;
    messages: Array<{
      id: string;
      messageType: MessageType;
      createdAt: string;
      confidence: number | null;
      agent: { id: string; name: string } | null;
      recipient: { id: string; name: string } | null;
      contentJson: { summary?: string; payload?: Record<string, unknown> };
    }>;
    handoffs: Array<{
      id: string;
      taskTitle: string;
      fromAgent: { name: string };
      toAgent: { name: string };
      status: string;
    }>;
  }>;
  evidence: Array<{
    id: string;
    title: string;
    confidence: number;
    sourceAgent: { name: string } | null;
  }>;
}

const MESSAGE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  AGENT_RECRUITMENT: UserPlus,
  EVIDENCE_SUBMISSION: FileSearch,
  APPROVAL_REQUEST: Scale,
  RISK_UPDATE: AlertTriangle,
  DECISION: CheckCircle,
  TASK_HANDOFF: ArrowRight,
  VOICE_COMMAND: Mic,
};

export function InvestigationRoomView() {
  const [incidents, setIncidents] = useState<IncidentSummary[]>([]);
  const [incidentId, setIncidentId] = useState("");
  const [incident, setIncident] = useState<IncidentDetails | null>(null);
  const [expandedMsg, setExpandedMsg] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  useRealtime(incidentId || undefined);

  const activeAgentCount = useNeuralOpsStore((s) => s.activeAgentCount);
  const evidenceCount = useNeuralOpsStore((s) => s.evidenceCount);

  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        const data = await fetchJsonWithRetry<{ incidents: IncidentSummary[] }>("/api/incidents", { cache: "no-store" }, { retries: 2 });
        if (!active) return;
        setIncidents(data.incidents ?? []);
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
        const data = await fetchJsonWithRetry<{ incident: IncidentDetails }>(
          `/api/incidents/${encodeURIComponent(incidentId)}`,
          { cache: "no-store" },
          { retries: 2 }
        );
        if (!active) return;
        setIncident(data.incident);
        const firstAgent = data.incident.rooms[0]?.agents[0]?.id ?? "";
        setSelectedAgent((prev) => prev || firstAgent);
        useNeuralOpsStore.setState({
          selectedIncidentId: data.incident.id,
          activeAgentCount: data.incident.rooms[0]?.agents.length ?? 0,
          evidenceCount: data.incident.evidence.length,
        });
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load incident room");
      } finally {
        if (active) setLoading(false);
      }
    };
    void run();
    return () => {
      active = false;
    };
  }, [incidentId]);

  const room = incident?.rooms[0] ?? null;
  const roomMessages = room?.messages ?? [];
  const roomAgents = room?.agents ?? [];
  const handoffs = room?.handoffs ?? [];
  const evidence = incident?.evidence ?? [];

  const statusLabel = (() => {
    if (!room) return "idle";
    if (!roomMessages.length) return "awaiting_activity";
    const last = roomMessages[roomMessages.length - 1]?.messageType;
    if (last === "APPROVAL_REQUEST") return "awaiting_approval";
    if (last === "RISK_UPDATE") return "risk_review";
    return "investigating";
  })();

  return (
    <AppShell title="Investigation Room" subtitle={`${room?.name ?? "No room"} · Live collaboration`} fullWidth>
      <div className="grid h-[calc(100vh-5.5rem)] grid-cols-12 gap-2 p-2">
        <div className="col-span-2 flex flex-col gap-2 overflow-hidden">
          <CyberPanel title="Incident" compact glow="cyan">
            <select
              value={incidentId}
              onChange={(event) => setIncidentId(event.target.value)}
              className="w-full rounded border border-white/10 bg-slate-950 px-2 py-2 font-mono text-xs text-slate-200"
            >
              {incidents.map((item) => (
                <option key={item.id} value={item.id}>{item.title}</option>
              ))}
            </select>
          </CyberPanel>
          <CyberPanel title="Room Agents" compact glow="cyan" className="flex-1 overflow-hidden">
            <div className="max-h-[calc(100vh-16rem)] space-y-1.5 overflow-y-auto">
              {roomAgents.map((agent) => (
                <motion.button
                  key={agent.id}
                  type="button"
                  whileHover={{ x: 2 }}
                  onClick={() => setSelectedAgent(agent.id)}
                  className={`w-full rounded border p-2 text-left transition-all ${
                    selectedAgent === agent.id ? "glow-active border-cyan-500/40 bg-cyan-500/10" : "border-white/5 bg-white/[0.02] hover:border-cyan-500/20"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="truncate font-mono text-[10px] font-medium text-white">{agent.name}</div>
                    <div className="font-mono text-[9px] capitalize text-slate-600">{agent.status}</div>
                  </div>
                </motion.button>
              ))}
            </div>
          </CyberPanel>
          <CyberPanel compact glow="amber">
            <div className="flex items-center gap-2 font-mono text-[10px]">
              <Clock className="h-3 w-3 text-amber-400" />
              <span className="text-amber-400 uppercase">{statusLabel.replaceAll("_", " ")}</span>
            </div>
          </CyberPanel>
        </div>

        <div className="col-span-7 flex flex-col overflow-hidden">
          <CyberPanel title="Band Collaboration Stream" subtitle="Database-backed agent messages" glow="cyan" className="flex h-full flex-col" noPadding>
            <div className="flex-1 space-y-2 overflow-y-auto p-3">
              <AnimatePresence>
                {roomMessages.map((msg, index) => {
                  const Icon = MESSAGE_ICONS[msg.messageType] ?? Bot;
                  const expanded = expandedMsg === msg.id;
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className={`glass-packet rounded-lg border p-3 ${messageTypeColor(msg.messageType)}`}
                    >
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Icon className="h-3.5 w-3.5 text-cyan-400" />
                        <span className="font-mono text-[10px] text-cyan-400">{msg.agent?.name ?? "Unknown Agent"}</span>
                        <ChevronRight className="h-3 w-3 text-slate-700" />
                        <span className="font-mono text-[10px] text-violet-400">{msg.recipient?.name ?? "All"}</span>
                        <CyberBadge label={msg.messageType.replaceAll("_", " ")} variant="cyan" />
                        {typeof msg.confidence === "number" && <CyberBadge label={`${Math.round(msg.confidence * 100)}%`} variant="emerald" />}
                        <span className="ml-auto font-mono text-[9px] text-slate-600">{formatTimestamp(msg.createdAt)}</span>
                      </div>
                      <p className="font-mono text-xs leading-relaxed text-slate-300">{msg.contentJson?.summary ?? "Structured payload attached"}</p>
                      <button
                        type="button"
                        onClick={() => setExpandedMsg(expanded ? null : msg.id)}
                        className="mt-2 font-mono text-[9px] text-cyan-500/70 hover:text-cyan-400"
                      >
                        {expanded ? "Hide structured context" : "View structured context"}
                      </button>
                      {expanded && (
                        <div className="mt-2">
                          <JsonViewer data={msg.contentJson ?? {}} height="120px" />
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {!roomMessages.length && !loading && <p className="font-mono text-[11px] text-slate-500">No room messages yet.</p>}
            </div>
          </CyberPanel>
        </div>

        <div className="col-span-3 flex flex-col gap-2 overflow-hidden">
          <CyberPanel title="Task Handoffs" compact glow="violet">
            {handoffs.map((handoff) => (
              <div key={handoff.id} className="mb-2 rounded border border-violet-500/20 p-2 last:mb-0">
                <div className="font-mono text-[9px] text-violet-400">{handoff.fromAgent.name} → {handoff.toAgent.name}</div>
                <div className="font-mono text-[10px] text-slate-400">{handoff.taskTitle}</div>
              </div>
            ))}
            {!handoffs.length && <div className="font-mono text-[10px] text-slate-500">No handoffs recorded.</div>}
          </CyberPanel>

          <CyberPanel title="Evidence Queue" compact glow="emerald" className="flex-1 overflow-hidden">
            <div className="space-y-1.5 overflow-y-auto">
              {evidence.map((item) => (
                <div key={item.id} className="rounded border border-emerald-500/20 p-2">
                  <div className="font-mono text-[10px] text-white">{item.title}</div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="font-mono text-[9px] text-slate-500">{item.sourceAgent?.name ?? "Unknown Agent"}</span>
                    <CyberBadge label={`${Math.round(item.confidence * 100)}%`} variant="emerald" />
                  </div>
                </div>
              ))}
              {!evidence.length && <div className="font-mono text-[10px] text-slate-500">No evidence yet.</div>}
            </div>
          </CyberPanel>

          <CyberPanel compact>
            <div className="flex items-center gap-2">
              <Cpu className="h-3 w-3 text-cyan-400" />
              <span className="font-mono text-[11px] text-slate-300">{activeAgentCount} agents · {roomMessages.length} messages · {evidenceCount} evidence items</span>
            </div>
            <NeonButton href="/evidence" size="sm" variant="secondary" className="mt-2 w-full">Open Evidence Graph</NeonButton>
          </CyberPanel>
        </div>
      </div>
      {error && (
        <div className="pointer-events-none fixed bottom-12 right-4 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 font-mono text-[11px] text-red-200">
          {error}
        </div>
      )}
    </AppShell>
  );
}
