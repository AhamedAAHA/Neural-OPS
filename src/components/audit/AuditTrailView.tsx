"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { CyberPanel, CyberBadge } from "@/components/cyber/CyberPanel";
import { Toast } from "@/components/ui/Toast";
import { fetchJsonWithRetry } from "@/lib/http/retry";

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

interface AuditEntry {
  id: string;
  createdAt: string;
  actorType: string;
  actorId: string;
  action: string;
}

export function AuditTrailView() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ kind: "success" | "error" | "info"; message: string } | null>(null);

  const loadLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchJsonWithRetry<{ logs?: AuditEntry[] }>("/api/audit-logs", undefined, { retries: 2 });
      setLogs(data.logs ?? []);
      setToast({ kind: "success", message: "Audit trail synchronized" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load audit logs";
      setError(msg);
      setToast({ kind: "error", message: msg });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    void loadLogs().catch(() => {});
    return undefined;
  }, []);

  return (
    <AppShell title="Audit Trail" subtitle="Immutable log · All agent actions · Band messages · Approvals · Model invocations">
      {toast && <Toast kind={toast.kind} message={toast.message} />}
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
              {loading && (
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-slate-500">
                    Loading audit logs...
                  </td>
                </tr>
              )}
              {error && (
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-red-400">
                    <div className="flex items-center justify-between gap-2">
                      <span>{error}</span>
                      <button
                        type="button"
                        onClick={() => void loadLogs()}
                        className="rounded border border-red-500/30 bg-red-500/10 px-2 py-1 font-mono text-[10px] text-red-300"
                      >
                        Retry
                      </button>
                    </div>
                  </td>
                </tr>
              )}
              {!loading && !error && !logs.length && (
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-slate-500">
                    No audit logs found.
                  </td>
                </tr>
              )}
              {logs.map((entry) => {
                const type = entry.action.includes("approval")
                  ? "approval"
                  : entry.action.includes("evidence")
                    ? "evidence"
                    : entry.action.includes("incident")
                      ? "investigation"
                      : "audit";
                return (
                  <tr key={entry.id} className="border-b border-white/[0.03] hover:bg-cyan-500/[0.03]">
                    <td className="px-4 py-2.5 text-cyan-400">{new Date(entry.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-2.5 font-medium text-white">
                      {entry.actorType}:{entry.actorId.slice(0, 8)}
                    </td>
                    <td className="px-4 py-2.5 text-slate-300">{entry.action}</td>
                    <td className="px-4 py-2.5">
                      <CyberBadge label={type.replace(/_/g, " ")} variant={TYPE_COLORS[type] ?? "default"} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CyberPanel>
    </AppShell>
  );
}
