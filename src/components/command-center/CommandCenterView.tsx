"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Bot,
  CheckCircle,
  FileText,
  Search,
  Shield,
  UserPlus,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { CyberPanel, CyberBadge } from "@/components/cyber/CyberPanel";
import { NeonButton } from "@/components/ui/NeonButton";
import { ApprovalModal } from "@/components/ui/ApprovalModal";
import { INCIDENTS, AGENTS, DEMO_INCIDENT, APPROVAL_REQUEST } from "@/lib/mock-data";
import { messageTypeColor, severityColor } from "@/lib/utils";
import { useNeuralOpsStore } from "@/store/neural-ops";
import { useRealtime } from "@/hooks/useRealtime";
import type { MessageType, TimelineEvent } from "@/lib/types";

const CommandCenterCanvas = dynamic(
  () => import("@/components/command-center/CommandCenterCanvas").then((m) => m.CommandCenterCanvas),
  { ssr: false }
);
const EnterpriseNetworkTwinScene = dynamic(
  () => import("@/components/3d/EnterpriseNetworkTwin").then((m) => m.EnterpriseNetworkTwinScene),
  { ssr: false }
);

function messageTypeBadge(type: MessageType): { label: string; variant: "cyan" | "violet" | "red" | "amber" | "emerald" } {
  if (type === "EVIDENCE_SUBMISSION" || type === "CONTEXT_SHARE") return { label: "EVIDENCE", variant: "amber" };
  if (type === "REVIEW_REQUEST" || type === "RISK_UPDATE") return { label: "REVIEW", variant: "violet" };
  if (type === "TASK_HANDOFF" || type === "AGENT_RECRUITMENT") return { label: "HANDOFF", variant: "cyan" };
  if (type === "APPROVAL_REQUEST") return { label: "APPROVAL", variant: "red" };
  return { label: "DECISION", variant: "emerald" };
}

function modelBadge(from: string): string {
  if (from.includes("Commander") || from.includes("Financial") || from.includes("Risk")) return "AIML";
  if (from.includes("Forensics") || from.includes("Legal") || from.includes("Communication")) return "Featherless";
  if (from.includes("Compliance") || from.includes("Audit")) return "Band";
  return "AIML";
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

export function CommandCenterView() {
  const [approvalOpen, setApprovalOpen] = useState(false);
  const {
    riskScore,
    selectedNodeId,
    setSelectedNode,
    bandMessages,
    timelineEvents,
    activeAgentCount,
    recruitedAgentIds,
    approvalStatus,
    evidenceCount,
  } = useNeuralOpsStore();
  useRealtime(DEMO_INCIDENT.id);

  const activeAgents = AGENTS.filter(
    (a) => recruitedAgentIds.includes(a.id) || a.status === "active" || a.status === "waiting"
  );
  const recentMessages = bandMessages.slice(-6);

  return (
    <AppShell title="Command Center" subtitle="Enterprise Digital Twin · Band Live · Threat Heatmap" fullWidth>
      <div className="grid h-[calc(100vh-5.5rem)] grid-cols-12 grid-rows-[1fr_68px] gap-1.5 p-1.5">
        {/* Left: Incident Queue */}
        <div className="col-span-2 min-h-0 overflow-hidden">
          <CyberPanel title="Incident Queue" compact glow="red" className="flex h-full flex-col">
            <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
              {INCIDENTS.map((inc) => {
                const isActive = inc.id === DEMO_INCIDENT.id;
                return (
                  <button
                    key={inc.id}
                    type="button"
                    className={`w-full rounded border px-2 py-1.5 text-left transition-all ${
                      isActive
                        ? "glow-active border-cyan-500/40 bg-cyan-500/8 shadow-[0_0_12px_rgba(34,211,238,0.12)]"
                        : "border-white/5 hover:border-cyan-500/15"
                    } ${inc.severity === "critical" && isActive ? "animate-pulse border-red-500/30" : ""}`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-mono text-[10px] text-slate-500">{inc.id}</span>
                      <CyberBadge label={inc.severity} variant={inc.severity === "critical" ? "red" : "amber"} pulse={inc.severity === "critical"} />
                    </div>
                    <div className="mt-0.5 truncate font-mono text-[11px] font-medium text-white">{inc.title}</div>
                    <div className="mt-0.5 flex justify-between font-mono text-[10px]">
                      <span className="capitalize text-slate-500">{inc.status.replace("_", " ")}</span>
                      <span className={severityColor(inc.severity)}>{inc.riskScore}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </CyberPanel>
        </div>

        {/* Center: 3D Twin — main focus */}
        <div className="col-span-8 relative min-h-0 overflow-hidden rounded-lg border border-cyan-500/25 glass-premium shadow-[0_0_48px_rgba(34,211,238,0.1)]">
          <CommandCenterCanvas className="absolute inset-0 h-full w-full">
            <EnterpriseNetworkTwinScene onNodeSelect={setSelectedNode} />
          </CommandCenterCanvas>
          <div className="pointer-events-none absolute inset-0 rounded-lg border border-cyan-500/10" />
          <div className="absolute left-2 top-2 z-10">
            <CyberPanel compact glow="cyan">
              <div className="font-mono text-[8px] text-slate-500">DIGITAL TWIN</div>
              <div className="font-mono text-[10px] font-bold text-white">{DEMO_INCIDENT.title}</div>
            </CyberPanel>
          </div>
          {selectedNodeId && (
            <div className="absolute right-2 top-2 z-10">
              <CyberPanel compact glow="amber">
                <div className="font-mono text-[9px] text-amber-400">NODE: {selectedNodeId.toUpperCase()}</div>
              </CyberPanel>
            </div>
          )}
          <div className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-1.5">
            <span className="rounded border border-cyan-500/20 bg-[#020617]/80 px-2 py-0.5 font-mono text-[10px] text-slate-400">
              Scroll to zoom · Drag to rotate
            </span>
            <div className="flex gap-2">
            <NeonButton href="/investigation" size="sm">
              Investigation Room
            </NeonButton>
            <NeonButton href="/evidence" variant="secondary" size="sm">
              Evidence Graph
            </NeonButton>
            </div>
          </div>
        </div>

        {/* Right: Agents + Band — compact */}
        <div className="col-span-2 flex min-h-0 flex-col gap-1.5 overflow-hidden">
          <CyberPanel title="Active Agents" compact glow="cyan" className="shrink-0">
            <div className="mb-1 font-mono text-[10px] font-medium text-cyan-400">{activeAgentCount} online</div>
            <div className="flex flex-wrap gap-1">
              {activeAgents.slice(0, 10).map((agent) => (
                <span
                  key={agent.id}
                  className="inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 font-mono text-[10px] text-slate-200"
                  style={{
                    borderColor: `${agent.color}40`,
                    backgroundColor: `${agent.color}12`,
                    boxShadow: `0 0 8px ${agent.color}20`,
                  }}
                >
                  <span className="h-1 w-1 animate-pulse rounded-full" style={{ backgroundColor: agent.color }} />
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
                      <span className="font-medium text-cyan-300">{msg.from.split(" ")[0]}</span>
                      <span className="text-slate-600">→</span>
                      <span className="text-violet-300">{msg.to.split(" ")[0]}</span>
                      <CyberBadge label={badge.label} variant={badge.variant} />
                      <CyberBadge label={modelBadge(msg.from)} variant="default" />
                    </div>
                    <div className="mt-0.5 line-clamp-2 font-mono text-[10px] leading-snug text-slate-400">{msg.content}</div>
                  </div>
                );
              })}
            </div>
          </CyberPanel>

          <CyberPanel compact glow="red" className="shrink-0">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-medium text-slate-400">RISK</span>
              <span className="font-display text-lg font-bold text-red-400">{riskScore}</span>
            </div>
            <div className="mt-1 flex justify-between font-mono text-[10px]">
              <span className="text-slate-500">Evidence</span>
              <span className="font-medium text-emerald-400">{evidenceCount}</span>
            </div>
            <div className="mt-0.5 flex justify-between font-mono text-[10px]">
              <span className="text-slate-500">Approval</span>
              <span className="font-medium text-amber-400">{approvalStatus}</span>
            </div>
            <NeonButton size="sm" variant="danger" className="mt-1.5 w-full" onClick={() => setApprovalOpen(true)}>
              {approvalStatus}
            </NeonButton>
          </CyberPanel>
        </div>

        {/* Bottom Timeline — thin */}
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
                  <div
                    key={event.id}
                    className="flex shrink-0 items-start gap-1.5 rounded border border-cyan-500/10 bg-cyan-500/[0.04] px-2 py-1"
                  >
                    {timelineIcon(event.type)}
                    <div>
                      <div className="font-mono text-[10px] text-cyan-400">{event.time}</div>
                      <div className="max-w-[120px] truncate font-mono text-[10px] text-slate-300">{event.title}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CyberPanel>
        </div>
      </div>
      <ApprovalModal request={APPROVAL_REQUEST} open={approvalOpen} onClose={() => setApprovalOpen(false)} onAction={() => setApprovalOpen(false)} />
    </AppShell>
  );
}
