"use client";

import { AppShell } from "@/components/layout/AppShell";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { COMPLIANCE_FINDINGS, BAND_MESSAGES } from "@/lib/mock-data";
import { formatTimestamp, messageTypeColor } from "@/lib/utils";
import { Shield, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

const STATUS_ICONS = {
  compliant: CheckCircle,
  at_risk: AlertTriangle,
  violation: XCircle,
};

const STATUS_COLORS = {
  compliant: "text-emerald-400",
  at_risk: "text-yellow-400",
  violation: "text-red-400",
};

export function ComplianceCenterView() {
  const complianceMessages = BAND_MESSAGES.filter(
    (m) => m.from.includes("Compliance") || m.from.includes("Legal") || m.to.includes("Legal")
  );

  return (
    <AppShell title="Compliance Center" subtitle="Multi-framework regulatory review · Vendor ABC Fraud">
      <div className="mb-6 grid grid-cols-4 gap-4">
        {COMPLIANCE_FINDINGS.map((f) => {
          const Icon = STATUS_ICONS[f.status];
          return (
            <GlassCard key={f.framework} glow={f.status === "violation" ? "red" : f.status === "at_risk" ? "cyan" : "emerald"} className="p-4 text-center">
              <Icon className={`mx-auto mb-2 h-6 w-6 ${STATUS_COLORS[f.status]}`} />
              <div className="text-sm font-semibold text-white">{f.framework}</div>
              <Badge label={f.status.replace("_", " ")} severity={f.status === "violation" ? "critical" : f.status === "at_risk" ? "high" : "low"} />
            </GlassCard>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {COMPLIANCE_FINDINGS.map((finding) => (
          <GlassCard key={finding.framework} className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-cyan-400" />
                <h3 className="font-semibold text-white">{finding.framework} Review</h3>
              </div>
              {finding.disclosureRequired && (
                <Badge label="Disclosure Required" severity="critical" dot />
              )}
            </div>

            <div className="mb-4">
              <div className="mb-2 text-xs font-semibold uppercase text-slate-500">Findings</div>
              <ul className="space-y-2">
                {finding.findings.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-400">
                    <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-orange-400" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="mb-2 text-xs font-semibold uppercase text-slate-500">Required Actions</div>
              <ul className="space-y-1">
                {finding.requiredActions.map((a) => (
                  <li key={a} className="flex items-center gap-2 text-xs text-emerald-400">
                    <CheckCircle className="h-3 w-3" />
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          </GlassCard>
        ))}
      </div>

      <GlassCard className="mt-6 p-6">
        <h3 className="mb-4 font-semibold text-white">Compliance & Legal Agent Messages</h3>
        <div className="space-y-3">
          {complianceMessages.map((msg) => (
            <div key={msg.id} className={`rounded-lg border p-4 ${messageTypeColor(msg.type)}`}>
              <div className="mb-2 flex items-center gap-2 text-xs">
                <span className="font-medium text-cyan-400">{msg.from}</span>
                <span className="text-slate-600">→</span>
                <span className="font-medium text-violet-400">{msg.to}</span>
                <span className="ml-auto text-slate-600">{formatTimestamp(msg.timestamp)}</span>
              </div>
              <p className="text-sm text-slate-300">{msg.content}</p>
            </div>
          ))}
        </div>
      </GlassCard>
    </AppShell>
  );
}
