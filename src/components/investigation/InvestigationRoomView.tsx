"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppShell } from "@/components/layout/AppShell";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { NeonButton } from "@/components/ui/NeonButton";
import { ApprovalModal } from "@/components/ui/ApprovalModal";
import { AGENTS, BAND_MESSAGES, DEMO_INCIDENT, APPROVAL_REQUEST } from "@/lib/mock-data";
import { formatTimestamp, messageTypeColor } from "@/lib/utils";
import {
  Bot,
  UserPlus,
  FileSearch,
  Scale,
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Clock,
} from "lucide-react";

const MESSAGE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  AGENT_RECRUITMENT: UserPlus,
  EVIDENCE_SUBMISSION: FileSearch,
  APPROVAL_REQUEST: Scale,
  RISK_UPDATE: AlertTriangle,
  DECISION: CheckCircle,
  TASK_HANDOFF: ArrowRight,
};

export function InvestigationRoomView() {
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string | null>("ic");

  const roomAgents = AGENTS.filter((a) =>
    ["ic", "df", "id", "ff", "ca", "cp", "lg", "rs", "es", "au"].includes(a.id)
  );

  return (
    <AppShell title="Investigation Room" subtitle={`${DEMO_INCIDENT.roomId} · Vendor ABC Suspected Fraud`}>
      <div className="grid h-[calc(100vh-8rem)] grid-cols-12 gap-4">
        {/* Agent Panel */}
        <div className="col-span-3 space-y-3 overflow-y-auto">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Room Agents</h3>
          {roomAgents.map((agent) => (
            <motion.div
              key={agent.id}
              whileHover={{ scale: 1.02 }}
              onClick={() => setSelectedAgent(agent.id)}
            >
              <GlassCard
                glow={selectedAgent === agent.id ? "cyan" : "none"}
                className="cursor-pointer p-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${agent.color}20` }}
                  >
                    <Bot className="h-4 w-4" style={{ color: agent.color }} />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">{agent.name}</div>
                    <div className="text-[10px] text-slate-500">{agent.role}</div>
                  </div>
                  <Badge label={agent.status} severity={agent.status === "waiting" ? "high" : agent.status === "active" ? "low" : "medium"} />
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* Band Message Stream */}
        <div className="col-span-6 flex flex-col overflow-hidden">
          <GlassCard className="flex flex-1 flex-col overflow-hidden">
            <div className="border-b border-white/10 px-4 py-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Band Collaboration Stream</h3>
                <Badge label="Live" severity="low" dot />
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              <AnimatePresence>
                {BAND_MESSAGES.map((msg, i) => {
                  const Icon = MESSAGE_ICONS[msg.type] ?? Bot;
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className={`rounded-xl border p-4 ${messageTypeColor(msg.type)}`}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-cyan-400" />
                          <span className="text-xs font-medium text-cyan-400">{msg.from}</span>
                          <ArrowRight className="h-3 w-3 text-slate-600" />
                          <span className="text-xs font-medium text-violet-400">{msg.to}</span>
                        </div>
                        <span className="rounded bg-white/5 px-2 py-0.5 text-[10px] text-slate-500">{msg.type.replace(/_/g, " ")}</span>
                      </div>
                      <p className="text-sm text-slate-300">{msg.content}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[10px] text-slate-600">{formatTimestamp(msg.timestamp)}</span>
                        {msg.metadata?.confidence && (
                          <span className="text-[10px] text-emerald-400">Confidence: {msg.metadata.confidence}%</span>
                        )}
                      </div>

                      {msg.type === "APPROVAL_REQUEST" && (
                        <div className="mt-3 flex gap-2">
                          <NeonButton size="sm" onClick={() => setApprovalOpen(true)}>Review Approval</NeonButton>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </GlassCard>
        </div>

        {/* Evidence & Status */}
        <div className="col-span-3 space-y-3 overflow-y-auto">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Evidence & Status</h3>

          <GlassCard glow="violet" className="p-4">
            <div className="mb-2 text-xs text-slate-500">Investigation Progress</div>
            <div className="mb-2 h-2 overflow-hidden rounded-full bg-white/5">
              <div className="h-full w-[85%] rounded-full bg-gradient-to-r from-cyan-500 to-violet-500" />
            </div>
            <div className="text-xs text-slate-400">85% complete · Awaiting human approval</div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="mb-3 text-xs font-semibold text-slate-500">KEY EVIDENCE</div>
            {[
              { label: "Suspicious Invoice #INV-9847", risk: "critical" },
              { label: "Privilege abuse confirmed", risk: "high" },
              { label: "Email coordination thread", risk: "high" },
              { label: "GDPR/SOC2 violations", risk: "high" },
            ].map((ev) => (
              <div key={ev.label} className="mb-2 flex items-center justify-between rounded-lg bg-white/[0.02] p-2">
                <span className="text-xs text-slate-300">{ev.label}</span>
                <Badge label={ev.risk} severity={ev.risk} />
              </div>
            ))}
          </GlassCard>

          <GlassCard glow="red" className="p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-red-400">
              <Clock className="h-4 w-4" />
              Escalation Path
            </div>
            <div className="mt-2 space-y-1 text-xs text-slate-400">
              <div>→ Legal Agent review</div>
              <div>→ Human Executive approval</div>
              <div>→ Executive Strategy decision</div>
            </div>
          </GlassCard>

          <NeonButton href="/evidence" className="w-full" variant="secondary" size="sm">
            View Evidence Graph
          </NeonButton>
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
