"use client";

import { AppShell } from "@/components/layout/AppShell";
import { CyberPanel, CyberBadge } from "@/components/cyber/CyberPanel";
import { COMPLIANCE_FINDINGS, BAND_MESSAGES } from "@/lib/mock-data";
import { formatTimestamp, messageTypeColor } from "@/lib/utils";
import { Shield, AlertTriangle, CheckCircle, XCircle, Clock, Scale } from "lucide-react";

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

const POLICY_MAP = [
  { policy: "Vendor Due Diligence", framework: "Internal Policy", status: "violation", owner: "Compliance Agent" },
  { policy: "Art. 33 Breach Notification", framework: "GDPR", status: "at_risk", owner: "Legal Agent" },
  { policy: "CC6.1 Logical Access", framework: "SOC 2", status: "violation", owner: "Compliance Agent" },
  { policy: "A.12.4 Logging & Monitoring", framework: "ISO 27001", status: "at_risk", owner: "Audit Agent" },
  { policy: "Privileged Access Controls", framework: "Internal Policy", status: "violation", owner: "Compliance Agent" },
];

export function ComplianceCenterView() {
  const complianceMessages = BAND_MESSAGES.filter(
    (m) => m.from.includes("Compliance") || m.from.includes("Legal") || m.to.includes("Legal")
  );

  return (
    <AppShell title="Compliance Center" subtitle="Multi-framework regulatory review · Vendor ABC Fraud">
      <div className="mb-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
        {COMPLIANCE_FINDINGS.map((f) => {
          const Icon = STATUS_ICONS[f.status];
          return (
            <CyberPanel
              key={f.framework}
              glow={f.status === "violation" ? "red" : f.status === "at_risk" ? "amber" : "emerald"}
              compact
              title={f.framework}
            >
              <div className="text-center">
                <Icon className={`mx-auto mb-1.5 h-5 w-5 ${STATUS_COLORS[f.status]}`} />
                <CyberBadge
                  label={f.status.replace("_", " ")}
                  variant={f.status === "violation" ? "red" : f.status === "at_risk" ? "amber" : "emerald"}
                  pulse={f.status === "violation"}
                />
                {f.disclosureRequired && (
                  <div className="mt-2 flex items-center justify-center gap-1 font-mono text-[9px] text-red-400">
                    <Clock className="h-3 w-3" />
                    72h disclosure deadline
                  </div>
                )}
              </div>
            </CyberPanel>
          );
        })}
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {COMPLIANCE_FINDINGS.map((finding) => (
          <CyberPanel
            key={finding.framework}
            title={`${finding.framework} Review`}
            glow={finding.status === "violation" ? "red" : finding.status === "at_risk" ? "amber" : "cyan"}
          >
            <div className="mb-3 flex items-center justify-between">
              <Shield className="h-4 w-4 text-cyan-400" />
              {finding.disclosureRequired && (
                <CyberBadge label="Disclosure Required" variant="red" pulse />
              )}
            </div>

            <div className="mb-3">
              <div className="mb-1.5 font-mono text-[9px] uppercase tracking-wider text-slate-500">Findings</div>
              <ul className="space-y-1.5">
                {finding.findings.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-slate-400">
                    <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-amber-400" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="mb-1.5 font-mono text-[9px] uppercase tracking-wider text-slate-500">Required Actions</div>
              <ul className="space-y-1">
                {finding.requiredActions.map((a) => (
                  <li key={a} className="flex items-center gap-2 text-[11px] text-emerald-400">
                    <CheckCircle className="h-3 w-3" />
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          </CyberPanel>
        ))}
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <CyberPanel title="Legal Escalation Status" glow="violet" className="lg:col-span-1">
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded border border-violet-500/20 bg-violet-500/5 px-3 py-2">
              <span className="text-xs text-slate-400">Legal Agent Review</span>
              <CyberBadge label="Active" variant="violet" pulse />
            </div>
            <div className="flex items-center justify-between rounded border border-red-500/20 bg-red-500/5 px-3 py-2">
              <span className="text-xs text-slate-400">Human Approval</span>
              <CyberBadge label="Awaiting" variant="red" pulse />
            </div>
            <div className="flex items-center gap-2 font-mono text-[10px] text-slate-500">
              <Scale className="h-3 w-3 text-violet-400" />
              External counsel escalation recommended
            </div>
          </div>
        </CyberPanel>

        <CyberPanel title="Policy Mapping" glow="cyan" className="lg:col-span-2">
          <div className="overflow-x-auto">
            <table className="w-full font-mono text-[10px]">
              <thead>
                <tr className="border-b border-cyan-500/10 text-left text-slate-500">
                  <th className="pb-2 pr-4">Policy</th>
                  <th className="pb-2 pr-4">Framework</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2">Owner</th>
                </tr>
              </thead>
              <tbody>
                {POLICY_MAP.map((row) => (
                  <tr key={row.policy} className="border-b border-white/5">
                    <td className="py-2 pr-4 text-slate-300">{row.policy}</td>
                    <td className="py-2 pr-4 text-cyan-400/80">{row.framework}</td>
                    <td className="py-2 pr-4">
                      <CyberBadge
                        label={row.status.replace("_", " ")}
                        variant={row.status === "violation" ? "red" : "amber"}
                      />
                    </td>
                    <td className="py-2 text-violet-400/80">{row.owner}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CyberPanel>
      </div>

      <CyberPanel title="Compliance → Legal Band Stream" glow="violet" className="mt-3">
        <div className="space-y-2">
          {complianceMessages.map((msg) => (
            <div key={msg.id} className={`rounded border p-3 ${messageTypeColor(msg.type)}`}>
              <div className="mb-1.5 flex flex-wrap items-center gap-2 text-[10px]">
                <span className="font-medium text-cyan-400">{msg.from}</span>
                <span className="text-slate-600">→</span>
                <span className="font-medium text-violet-400">{msg.to}</span>
                <CyberBadge label={msg.type.replace("_", " ")} variant="violet" />
                <span className="ml-auto font-mono text-slate-600">{formatTimestamp(msg.timestamp)}</span>
              </div>
              <p className="text-xs leading-relaxed text-slate-300">{msg.content}</p>
            </div>
          ))}
        </div>
      </CyberPanel>
    </AppShell>
  );
}
