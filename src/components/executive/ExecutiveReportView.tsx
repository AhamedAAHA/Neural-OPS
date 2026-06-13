"use client";

import { AppShell } from "@/components/layout/AppShell";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { NeonButton } from "@/components/ui/NeonButton";
import { DEMO_INCIDENT, TIMELINE, BAND_MESSAGES, COMPLIANCE_FINDINGS } from "@/lib/mock-data";
import { formatTimestamp } from "@/lib/utils";
import { Download, FileText, Clock, Shield, Scale, DollarSign, TrendingDown, CheckCircle, Bot } from "lucide-react";

export function ExecutiveReportView() {
  return (
    <AppShell title="Executive Report" subtitle={`${DEMO_INCIDENT.id} · Vendor ABC Suspected Fraud`}>
      <div className="mb-6 flex items-center justify-between">
        <Badge label="CONFIDENTIAL" severity="critical" />
        <NeonButton size="sm">
          <Download className="h-4 w-4" /> Export Report
        </NeonButton>
      </div>

      <div className="space-y-6">
        {/* Summary */}
        <GlassCard glow="cyan" className="p-6">
          <div className="mb-4 flex items-center gap-3">
            <FileText className="h-6 w-6 text-cyan-400" />
            <h2 className="text-xl font-bold text-white">Incident Summary</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <div className="text-xs text-slate-500">Incident</div>
              <div className="font-semibold text-white">{DEMO_INCIDENT.title}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Type</div>
              <div className="text-slate-300">{DEMO_INCIDENT.type}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Risk Score</div>
              <div className="text-2xl font-bold text-red-400">{DEMO_INCIDENT.riskScore}/100</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Status</div>
              <Badge label="Pending Approval" severity="high" dot />
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-slate-400">
            Multi-agent investigation confirmed suspected vendor fraud involving Vendor ABC with $847,000 in suspicious payments.
            Finance Manager credentials were used for unauthorized approval. Fraud probability assessed at 91% with estimated
            total exposure of $2.4M. GDPR breach notification may be required.
          </p>
        </GlassCard>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Timeline */}
          <GlassCard className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-violet-400" />
              <h3 className="font-semibold text-white">Investigation Timeline</h3>
            </div>
            <div className="space-y-3">
              {TIMELINE.map((event) => (
                <div key={event.id} className="flex gap-3 border-l-2 border-cyan-500/30 pl-4">
                  <div>
                    <div className="text-xs font-mono text-cyan-500">{event.time}</div>
                    <div className="text-sm text-slate-300">{event.title}</div>
                    {event.agent && <div className="text-[10px] text-slate-500">{event.agent}</div>}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Impact Assessment */}
          <GlassCard className="p-6">
            <h3 className="mb-4 font-semibold text-white">Impact Assessment</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: DollarSign, label: "Financial Impact", value: "$2.4M", color: "text-red-400" },
                { icon: Scale, label: "Legal Risk", value: "High", color: "text-orange-400" },
                { icon: Shield, label: "Compliance", value: "3 Violations", color: "text-yellow-400" },
                { icon: TrendingDown, label: "Reputation", value: "High", color: "text-red-400" },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
                  <item.icon className="mb-2 h-5 w-5 text-slate-500" />
                  <div className="text-xs text-slate-500">{item.label}</div>
                  <div className={`text-lg font-bold ${item.color}`}>{item.value}</div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Compliance Findings */}
        <GlassCard className="p-6">
          <h3 className="mb-4 font-semibold text-white">Compliance Findings</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {COMPLIANCE_FINDINGS.map((finding) => (
              <div key={finding.framework} className="rounded-lg border border-white/5 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-medium text-white">{finding.framework}</span>
                  <Badge
                    label={finding.status.replace("_", " ")}
                    severity={finding.status === "violation" ? "critical" : finding.status === "at_risk" ? "high" : "low"}
                  />
                </div>
                <ul className="space-y-1">
                  {finding.findings.slice(0, 2).map((f) => (
                    <li key={f} className="text-xs text-slate-400">• {f}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Recommended Actions */}
        <GlassCard glow="emerald" className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-400" />
            <h3 className="font-semibold text-white">Recommended Actions</h3>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {[
              "Immediately freeze all payments to Vendor ABC",
              "Rotate Finance Manager and admin credentials",
              "Engage external forensic auditors",
              "Prepare GDPR breach notification draft",
              "Escalate to external legal counsel",
              "Implement enhanced privileged access monitoring",
            ].map((action) => (
              <div key={action} className="flex items-center gap-2 rounded-lg bg-emerald-500/5 px-3 py-2 text-sm text-slate-300">
                <CheckCircle className="h-3 w-3 shrink-0 text-emerald-400" />
                {action}
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Agent Collaboration History */}
        <GlassCard className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <Bot className="h-5 w-5 text-cyan-400" />
            <h3 className="font-semibold text-white">Agent Collaboration History</h3>
          </div>
          <div className="space-y-2">
            {BAND_MESSAGES.slice(0, 6).map((msg) => (
              <div key={msg.id} className="flex items-start gap-3 rounded-lg bg-white/[0.02] p-3 text-xs">
                <span className="shrink-0 text-cyan-400">{msg.from}</span>
                <span className="text-slate-600">→</span>
                <span className="shrink-0 text-violet-400">{msg.to}</span>
                <span className="flex-1 text-slate-400">{msg.content.slice(0, 60)}...</span>
                <span className="shrink-0 text-slate-600">{formatTimestamp(msg.timestamp)}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Approval History & Audit Trail */}
        <div className="grid gap-6 lg:grid-cols-2">
          <GlassCard className="p-6">
            <h3 className="mb-4 font-semibold text-white">Approval History</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between rounded-lg bg-white/[0.02] p-3">
                <span className="text-slate-400">Freeze vendor payments</span>
                <Badge label="Pending" severity="high" dot />
              </div>
              <div className="flex justify-between rounded-lg bg-white/[0.02] p-3">
                <span className="text-slate-400">Notify stakeholders</span>
                <Badge label="Pending" severity="high" dot />
              </div>
            </div>
          </GlassCard>
          <GlassCard className="p-6">
            <h3 className="mb-4 font-semibold text-white">Audit Trail</h3>
            <div className="space-y-1 font-mono text-xs text-slate-500">
              <div>[09:41:15] Audit Agent: 47 evidence items catalogued</div>
              <div>[09:40:00] Executive Strategy: Decision pending</div>
              <div>[09:35:41] Legal Agent: Approval requested</div>
              <div>[09:28:55] Risk Agent: Fraud probability 91%</div>
              <div>[08:42:12] Incident Commander: Room created</div>
            </div>
          </GlassCard>
        </div>
      </div>
    </AppShell>
  );
}
