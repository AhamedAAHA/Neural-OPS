"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { AppShell } from "@/components/layout/AppShell";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { NeonButton } from "@/components/ui/NeonButton";
import { ApprovalModal } from "@/components/ui/ApprovalModal";
import { INCIDENTS, AGENTS, BAND_MESSAGES, TIMELINE, DEMO_INCIDENT, APPROVAL_REQUEST } from "@/lib/mock-data";
import { formatTimestamp, messageTypeColor, severityColor } from "@/lib/utils";
import { useState } from "react";
import { Radio, UserPlus, MessageSquare } from "lucide-react";

const CanvasWrapper = dynamic(() => import("@/components/3d/CanvasWrapper").then((m) => m.CanvasWrapper), { ssr: false });
const EnterpriseNetworkTwinScene = dynamic(
  () => import("@/components/3d/EnterpriseNetworkTwin").then((m) => m.EnterpriseNetworkTwinScene),
  { ssr: false }
);

export function CommandCenterView() {
  const [approvalOpen, setApprovalOpen] = useState(false);
  const activeAgents = AGENTS.filter((a) => a.status === "active" || a.status === "waiting");
  const recentMessages = BAND_MESSAGES.slice(-5);

  return (
    <AppShell title="Command Center" subtitle="Enterprise Digital Twin · Live Incident Monitoring" fullWidth>
      <div className="flex h-[calc(100vh-4rem)] flex-col">
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar - Incidents */}
          <div className="w-72 shrink-0 overflow-y-auto border-r border-white/10 bg-neural-panel/50 p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Active Incidents</h3>
            <div className="space-y-2">
              {INCIDENTS.map((inc) => (
                <GlassCard
                  key={inc.id}
                  glow={inc.id === DEMO_INCIDENT.id ? "cyan" : "none"}
                  hover
                  className="cursor-pointer p-3"
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-500">{inc.id}</span>
                    <Badge label={inc.severity} severity={inc.severity} dot />
                  </div>
                  <div className="text-sm font-medium text-white">{inc.title}</div>
                  <div className="mt-1 text-xs text-slate-500">{inc.type}</div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs capitalize text-slate-400">{inc.status.replace("_", " ")}</span>
                    <span className={`text-xs font-bold ${severityColor(inc.severity)}`}>{inc.riskScore}</span>
                  </div>
                </GlassCard>
              ))}
            </div>

            <h3 className="mb-3 mt-6 text-xs font-semibold uppercase tracking-wider text-slate-500">Investigation Rooms</h3>
            <GlassCard className="p-3">
              <div className="text-sm font-medium text-cyan-400">ROOM-VABC-001</div>
              <div className="text-xs text-slate-500">Vendor ABC Fraud · 7 agents</div>
            </GlassCard>
          </div>

          {/* Center - 3D Digital Twin */}
          <div className="relative flex-1">
            <CanvasWrapper className="h-full w-full" camera={{ position: [0, 2, 10], fov: 50 }}>
              <EnterpriseNetworkTwinScene />
            </CanvasWrapper>
            <div className="absolute left-4 top-4">
              <GlassCard className="px-3 py-2">
                <div className="text-[10px] text-slate-500">LIVE DIGITAL TWIN</div>
                <div className="text-sm font-semibold text-white">{DEMO_INCIDENT.title}</div>
              </GlassCard>
            </div>
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-3">
              <NeonButton href="/investigation" size="sm">Open Investigation Room</NeonButton>
              <NeonButton href="/evidence" variant="secondary" size="sm">Evidence Graph</NeonButton>
            </div>
          </div>

          {/* Right - Agents & Band */}
          <div className="w-80 shrink-0 overflow-y-auto border-l border-white/10 bg-neural-panel/50 p-4">
            <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <Radio className="h-3 w-3 text-cyan-400" /> Active Agents
            </h3>
            <div className="space-y-2">
              {activeAgents.map((agent) => (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-2"
                >
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: agent.color, boxShadow: `0 0 8px ${agent.color}` }}
                  />
                  <div className="flex-1">
                    <div className="text-xs font-medium text-white">{agent.name}</div>
                    <div className="text-[10px] capitalize text-slate-500">{agent.status}</div>
                  </div>
                </motion.div>
              ))}
            </div>

            <h3 className="mb-3 mt-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <MessageSquare className="h-3 w-3 text-violet-400" /> Band Stream
            </h3>
            <div className="space-y-2">
              {recentMessages.map((msg) => (
                <div key={msg.id} className={`rounded-lg border p-2 ${messageTypeColor(msg.type)}`}>
                  <div className="mb-1 flex items-center gap-1 text-[10px]">
                    <span className="text-cyan-400">{msg.from}</span>
                    <span className="text-slate-600">→</span>
                    <span className="text-violet-400">{msg.to}</span>
                  </div>
                  <div className="text-xs text-slate-300">{msg.content.slice(0, 80)}...</div>
                  <div className="mt-1 text-[10px] text-slate-600">{formatTimestamp(msg.timestamp)}</div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-2">
              <UserPlus className="h-4 w-4 text-cyan-400" />
              <div className="text-xs text-cyan-300">Financial Forensics recruited Communication Analysis</div>
            </div>
          </div>
        </div>

        {/* Bottom Timeline */}
        <div className="shrink-0 border-t border-white/10 bg-neural-panel/80 p-4">
          <div className="flex items-center gap-6">
            <div className="shrink-0">
              <div className="text-[10px] text-slate-500">RISK SCORE</div>
              <div className="text-2xl font-bold text-red-400">{DEMO_INCIDENT.riskScore}</div>
            </div>
            <div className="shrink-0">
              <div className="text-[10px] text-slate-500">APPROVAL</div>
              <NeonButton size="sm" variant="danger" onClick={() => setApprovalOpen(true)}>
                Pending Review
              </NeonButton>
            </div>
            <div className="flex-1 overflow-x-auto">
              <div className="flex gap-3">
                {TIMELINE.map((event) => (
                  <div key={event.id} className="shrink-0 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
                    <div className="text-[10px] font-mono text-cyan-500">{event.time}</div>
                    <div className="max-w-[140px] truncate text-xs text-slate-300">{event.title}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ApprovalModal
        request={APPROVAL_REQUEST}
        open={approvalOpen}
        onClose={() => setApprovalOpen(false)}
        onAction={() => setApprovalOpen(false)}
      />
    </AppShell>
  );
}
