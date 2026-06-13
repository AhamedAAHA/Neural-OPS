"use client";

import { AppShell } from "@/components/layout/AppShell";
import { CyberPanel, CyberBadge } from "@/components/cyber/CyberPanel";
import { useNeuralOpsStore } from "@/store/neural-ops";

const TYPE_COLORS: Record<string, "cyan" | "violet" | "emerald" | "red" | "amber"> = {
  detection: "red",
  investigation: "cyan",
  evidence: "violet",
  approval: "amber",
  decision: "emerald",
  recruitment: "cyan",
  band_message: "violet",
  audit: "emerald",
  model: "amber",
  voice: "cyan",
};

export function AuditTrailView() {
  const auditLogs = useNeuralOpsStore((s) => s.auditLogs);

  return (
    <AppShell title="Audit Trail" subtitle="Immutable log · All agent actions · Band messages · Approvals · Model invocations">
      <CyberPanel title="Immutable Audit Log" glow="cyan" noPadding>
        <div className="max-h-[calc(100vh-8rem)] overflow-y-auto">
          <table className="w-full font-mono text-[11px]">
            <thead className="sticky top-0 bg-neural-surface">
              <tr className="border-b border-cyan-500/10 text-left text-slate-500">
                <th className="px-4 py-2 font-medium">TIME</th>
                <th className="px-4 py-2 font-medium">ACTOR</th>
                <th className="px-4 py-2 font-medium">ACTION</th>
                <th className="px-4 py-2 font-medium">TYPE</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((entry) => (
                <tr key={entry.id} className="border-b border-white/[0.03] hover:bg-cyan-500/[0.03]">
                  <td className="px-4 py-2.5 text-cyan-400">{entry.time}</td>
                  <td className="px-4 py-2.5 font-medium text-white">{entry.actor}</td>
                  <td className="px-4 py-2.5 text-slate-300">{entry.action}</td>
                  <td className="px-4 py-2.5">
                    <CyberBadge label={entry.type.replace(/_/g, " ")} variant={TYPE_COLORS[entry.type] ?? "default"} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CyberPanel>
    </AppShell>
  );
}
