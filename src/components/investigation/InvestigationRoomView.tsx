"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppShell } from "@/components/layout/AppShell";
import { CyberPanel, CyberBadge } from "@/components/cyber/CyberPanel";
import { JsonViewer } from "@/components/cyber/JsonViewer";
import { NeonButton } from "@/components/ui/NeonButton";
import { ApprovalModal } from "@/components/ui/ApprovalModal";
import { AGENTS, DEMO_INCIDENT, APPROVAL_REQUEST } from "@/lib/mock-data";
import { formatTimestamp, messageTypeColor } from "@/lib/utils";
import { useNeuralOpsStore } from "@/store/neural-ops";
import { useRealtime } from "@/hooks/useRealtime";
import {
  Bot, UserPlus, FileSearch, Scale, AlertTriangle, ArrowRight,
  CheckCircle, Clock, Mic, Cpu, ChevronRight,
} from "lucide-react";

const MESSAGE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  AGENT_RECRUITMENT: UserPlus,
  EVIDENCE_SUBMISSION: FileSearch,
  APPROVAL_REQUEST: Scale,
  RISK_UPDATE: AlertTriangle,
  DECISION: CheckCircle,
  TASK_HANDOFF: ArrowRight,
  VOICE_COMMAND: Mic,
};

const MODEL_BADGES: Record<string, string> = {
  CONTEXT_SHARE: "AIML",
  EVIDENCE_SUBMISSION: "AIML",
  AGENT_RECRUITMENT: "LOCAL",
  RISK_UPDATE: "FEATHERLESS",
  APPROVAL_REQUEST: "AIML",
  REVIEW_REQUEST: "FEATHERLESS",
};

export function InvestigationRoomView() {
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [expandedMsg, setExpandedMsg] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState("ic");
  const { liveStatus, bandMessages, activeAgentCount, evidenceCount, recruitedAgentIds } = useNeuralOpsStore();
  useRealtime(DEMO_INCIDENT.id);

  const roomAgents = AGENTS.filter((a) =>
    recruitedAgentIds.includes(a.id) || ["ic", "df", "id", "ff", "ca", "cp", "lg", "rs", "es", "au"].includes(a.id)
  );

  return (
    <AppShell title="Investigation Room" subtitle={`${DEMO_INCIDENT.roomId} · Vendor ABC Fraud · Band Live`} fullWidth>
      <div className="grid h-[calc(100vh-5.5rem)] grid-cols-12 gap-2 p-2">
        {/* Agents */}
        <div className="col-span-2 flex flex-col gap-2 overflow-hidden">
          <CyberPanel title="Room Agents" compact glow="cyan" className="flex-1 overflow-hidden">
            <div className="space-y-1.5 overflow-y-auto max-h-[calc(100vh-12rem)]">
              {roomAgents.map((agent) => (
                <motion.button
                  key={agent.id}
                  type="button"
                  whileHover={{ x: 2 }}
                  onClick={() => setSelectedAgent(agent.id)}
                  className={`w-full rounded border p-2 text-left transition-all ${
                    selectedAgent === agent.id
                      ? "glow-active border-cyan-500/40 bg-cyan-500/10"
                      : "border-white/5 bg-white/[0.02] hover:border-cyan-500/20"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: agent.color, boxShadow: `0 0 6px ${agent.color}` }} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-mono text-[10px] font-medium text-white">{agent.name}</div>
                      <div className="font-mono text-[9px] capitalize text-slate-600">{agent.status}</div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </CyberPanel>
          <CyberPanel compact glow="amber">
            <div className="flex items-center gap-2 font-mono text-[10px]">
              <Clock className="h-3 w-3 text-amber-400" />
              <span className="text-amber-400 uppercase">{liveStatus.replace(/_/g, " ")}</span>
            </div>
          </CyberPanel>
        </div>

        {/* Band Stream */}
        <div className="col-span-7 flex flex-col overflow-hidden">
          <CyberPanel title="Band Collaboration Stream" subtitle="Real-time agent-to-agent messaging" glow="cyan" className="flex h-full flex-col" noPadding>
            <div className="flex-1 space-y-2 overflow-y-auto p-3">
              <AnimatePresence>
                {bandMessages.map((msg, i) => {
                  const Icon = MESSAGE_ICONS[msg.type] ?? Bot;
                  const expanded = expandedMsg === msg.id;
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className={`glass-packet rounded-lg border p-3 ${messageTypeColor(msg.type)}`}
                    >
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Icon className="h-3.5 w-3.5 text-cyan-400" />
                        <span className="font-mono text-[10px] text-cyan-400">{msg.from}</span>
                        <ChevronRight className="h-3 w-3 text-slate-700" />
                        <span className="font-mono text-[10px] text-violet-400">{msg.to}</span>
                        <CyberBadge label={msg.type.replace(/_/g, " ")} variant="cyan" />
                        {MODEL_BADGES[msg.type] && (
                          <CyberBadge label={MODEL_BADGES[msg.type]} variant="violet" />
                        )}
                        {msg.metadata?.confidence && (
                          <CyberBadge label={`${msg.metadata.confidence}%`} variant="emerald" />
                        )}
                        <span className="ml-auto font-mono text-[9px] text-slate-600">{formatTimestamp(msg.timestamp)}</span>
                      </div>
                      <p className="font-mono text-xs leading-relaxed text-slate-300">{msg.content}</p>
                      {msg.type === "AGENT_RECRUITMENT" && (
                        <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} className="mt-2 h-0.5 bg-gradient-to-r from-cyan-500 to-violet-500" />
                      )}
                      <button
                        type="button"
                        onClick={() => setExpandedMsg(expanded ? null : msg.id)}
                        className="mt-2 font-mono text-[9px] text-cyan-500/70 hover:text-cyan-400"
                      >
                        {expanded ? "▲ hide context" : "▼ view structured context"}
                      </button>
                      {expanded && (
                        <div className="mt-2">
                          <JsonViewer data={{ messageType: msg.type, from: msg.from, to: msg.to, content: msg.content, metadata: msg.metadata }} height="120px" />
                        </div>
                      )}
                      {msg.type === "APPROVAL_REQUEST" && (
                        <NeonButton size="sm" className="mt-2" onClick={() => setApprovalOpen(true)}>Review Approval Terminal</NeonButton>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </CyberPanel>
        </div>

        {/* Evidence + Handoffs */}
        <div className="col-span-3 flex flex-col gap-2 overflow-hidden">
          <CyberPanel title="Task Handoffs" compact glow="violet">
            {[
              { from: "Incident Commander", to: "Digital Forensics", task: "Analyze login trail" },
              { from: "Financial Forensics", to: "Communication Analysis", task: "Build email timeline" },
              { from: "Compliance Agent", to: "Legal Agent", task: "Review violations" },
            ].map((h) => (
              <div key={h.task} className="glass-packet mb-2 rounded border border-violet-500/20 p-2 last:mb-0">
                <div className="font-mono text-[9px] text-violet-400">{h.from} → {h.to}</div>
                <div className="font-mono text-[10px] text-slate-400">{h.task}</div>
              </div>
            ))}
          </CyberPanel>

          <CyberPanel title="Evidence Queue" compact glow="emerald" className="flex-1 overflow-hidden">
            <div className="space-y-1.5 overflow-y-auto">
              {[
                { title: "Suspicious Invoice #INV-9847", conf: 92, agent: "Financial Forensics" },
                { title: "Privilege abuse confirmed", conf: 94, agent: "Identity Investigation" },
                { title: "Email coordination thread", conf: 89, agent: "Communication Analysis" },
                { title: "GDPR/SOC2 violations", conf: 98, agent: "Compliance Agent" },
              ].map((ev) => (
                <div key={ev.title} className="glass-packet rounded border border-emerald-500/20 p-2">
                  <div className="font-mono text-[10px] text-white">{ev.title}</div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="font-mono text-[9px] text-slate-500">{ev.agent}</span>
                    <CyberBadge label={`${ev.conf}%`} variant="emerald" />
                  </div>
                </div>
              ))}
            </div>
          </CyberPanel>

          <CyberPanel compact>
            <div className="flex items-center gap-2">
              <Cpu className="h-3 w-3 text-cyan-400" />
              <span className="font-mono text-[11px] text-slate-300">{activeAgentCount} agents · {bandMessages.length} Band messages · {evidenceCount} evidence items</span>
            </div>
            <NeonButton href="/evidence" size="sm" variant="secondary" className="mt-2 w-full">Open Evidence Graph</NeonButton>
          </CyberPanel>
        </div>
      </div>

      <ApprovalModal request={APPROVAL_REQUEST} open={approvalOpen} onClose={() => setApprovalOpen(false)} onAction={() => setApprovalOpen(false)} />
    </AppShell>
  );
}
