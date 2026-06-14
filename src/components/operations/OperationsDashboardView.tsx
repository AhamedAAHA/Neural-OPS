"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { CyberPanel, CyberBadge } from "@/components/cyber/CyberPanel";
import { Toast } from "@/components/ui/Toast";
import { fetchJsonWithRetry } from "@/lib/http/retry";

interface ServiceMetric {
  total: number;
  errorRate: number;
  latency: number;
  status: "healthy" | "degraded" | "down";
  activeConnections?: number;
}

interface DashboardPayload {
  generatedAt: string;
  api: {
    health: "healthy" | "degraded" | "down";
    requests: number;
    errorRate: number;
    responseTimeMs: number;
  };
  services: {
    agent: ServiceMetric;
    database: ServiceMetric;
    brightData: ServiceMetric;
    band: ServiceMetric;
    speechmatics: ServiceMetric;
    realtime: ServiceMetric;
  };
  investigations: { active: number };
  users: { active: number };
  metrics: {
    errorRate: number;
    responseTimeMs: number;
    activeInvestigations: number;
    activeUsers: number;
    realtimeConnections: number;
  };
  latestEvents: Array<{
    id: string;
    source: string;
    level: string;
    operation: string;
    status: string;
    durationMs?: number;
    message?: string;
    createdAt: string;
  }>;
}

function healthVariant(status: "healthy" | "degraded" | "down") {
  if (status === "healthy") return "emerald" as const;
  if (status === "degraded") return "amber" as const;
  return "red" as const;
}

function formatLatency(value: number) {
  if (!value || Number.isNaN(value)) return "-";
  return `${Math.round(value)} ms`;
}

export function OperationsDashboardView() {
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ kind: "success" | "error" | "info"; message: string } | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchJsonWithRetry<{ dashboard: DashboardPayload }>("/api/operations/dashboard", { cache: "no-store" }, { retries: 2 });
      setDashboard(data.dashboard);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load operations dashboard";
      setError(message);
      setToast({ kind: "error", message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    const timer = setInterval(() => {
      void load();
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  const serviceRows = useMemo(() => {
    if (!dashboard) return [];
    return [
      { label: "API Health", metric: dashboard.api.health, latency: dashboard.api.responseTimeMs, errorRate: dashboard.api.errorRate, extra: `${dashboard.api.requests} requests` },
      { label: "Agent Health", metric: dashboard.services.agent.status, latency: dashboard.services.agent.latency, errorRate: dashboard.services.agent.errorRate, extra: `${dashboard.services.agent.total} runs` },
      { label: "Database Health", metric: dashboard.services.database.status, latency: dashboard.services.database.latency, errorRate: dashboard.services.database.errorRate, extra: `${dashboard.services.database.total} query events` },
      { label: "Realtime Connections", metric: dashboard.services.realtime.status, latency: dashboard.services.realtime.latency, errorRate: dashboard.services.realtime.errorRate, extra: `${dashboard.metrics.realtimeConnections} active` },
      { label: "Band Room", metric: dashboard.services.band.status, latency: dashboard.services.band.latency, errorRate: dashboard.services.band.errorRate, extra: `${dashboard.services.band.total} operations` },
      { label: "Bright Data", metric: dashboard.services.brightData.status, latency: dashboard.services.brightData.latency, errorRate: dashboard.services.brightData.errorRate, extra: `${dashboard.services.brightData.total} calls` },
      { label: "Speechmatics", metric: dashboard.services.speechmatics.status, latency: dashboard.services.speechmatics.latency, errorRate: dashboard.services.speechmatics.errorRate, extra: `${dashboard.services.speechmatics.total} jobs` },
    ];
  }, [dashboard]);

  return (
    <AppShell title="Operations Dashboard" subtitle="Sentry + OpenTelemetry + Runtime Metrics + Service Health">
      {toast && <Toast kind={toast.kind} message={toast.message} />}
      <div className="grid h-[calc(100vh-5.5rem)] grid-cols-12 gap-3 p-3">
        <div className="col-span-12 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <CyberPanel compact glow="cyan" hover={false}>
            <div className="font-mono text-[10px] text-slate-500">Error Rate</div>
            <div className="font-display text-2xl font-bold text-red-400">{dashboard?.metrics.errorRate ?? 0}%</div>
          </CyberPanel>
          <CyberPanel compact glow="amber" hover={false}>
            <div className="font-mono text-[10px] text-slate-500">Response Time</div>
            <div className="font-display text-2xl font-bold text-amber-300">{formatLatency(dashboard?.metrics.responseTimeMs ?? 0)}</div>
          </CyberPanel>
          <CyberPanel compact glow="violet" hover={false}>
            <div className="font-mono text-[10px] text-slate-500">Active Investigations</div>
            <div className="font-display text-2xl font-bold text-violet-300">{dashboard?.metrics.activeInvestigations ?? 0}</div>
          </CyberPanel>
          <CyberPanel compact glow="emerald" hover={false}>
            <div className="font-mono text-[10px] text-slate-500">Active Users</div>
            <div className="font-display text-2xl font-bold text-emerald-300">{dashboard?.metrics.activeUsers ?? 0}</div>
          </CyberPanel>
        </div>

        <div className="col-span-12 lg:col-span-7">
          <CyberPanel title="Live Health Indicators" glow="cyan" className="h-full" hover={false}>
            {loading && <div className="font-mono text-xs text-slate-500">Loading health metrics...</div>}
            {error && (
              <div className="space-y-2">
                <div className="font-mono text-xs text-red-400">{error}</div>
                <button
                  type="button"
                  onClick={() => void load()}
                  className="rounded border border-red-500/30 bg-red-500/10 px-2 py-1 font-mono text-[10px] text-red-300"
                >
                  Retry
                </button>
              </div>
            )}
            {!loading && !error && !serviceRows.length && (
              <div className="font-mono text-xs text-slate-500">No monitoring data yet. Trigger API/agent activity to populate metrics.</div>
            )}
            <div className="space-y-2">
              {serviceRows.map((row) => (
                <div key={row.label} className="rounded border border-white/5 p-2.5">
                  <div className="mb-1 flex items-center justify-between">
                    <div className="font-mono text-[11px] text-slate-200">{row.label}</div>
                    <CyberBadge label={row.metric.toUpperCase()} variant={healthVariant(row.metric)} pulse={row.metric !== "healthy"} />
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 font-mono text-[10px] text-slate-500">
                    <span>Latency: <span className="text-slate-300">{formatLatency(row.latency)}</span></span>
                    <span>Error: <span className="text-slate-300">{row.errorRate.toFixed(2)}%</span></span>
                    <span className="text-slate-400">{row.extra}</span>
                  </div>
                </div>
              ))}
            </div>
          </CyberPanel>
        </div>

        <div className="col-span-12 lg:col-span-5">
          <CyberPanel title="Monitoring Events" glow="amber" className="h-full" hover={false}>
            <div className="max-h-[calc(100vh-16rem)] space-y-2 overflow-y-auto">
              {(dashboard?.latestEvents ?? []).map((event) => (
                <div key={event.id} className="rounded border border-amber-500/20 bg-amber-500/[0.03] p-2.5">
                  <div className="mb-1 flex items-center gap-2">
                    <CyberBadge label={event.source} variant="amber" />
                    <CyberBadge label={event.level} variant={event.level === "error" ? "red" : event.level === "warning" ? "amber" : "default"} />
                    <span className="ml-auto font-mono text-[10px] text-slate-600">{new Date(event.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <div className="font-mono text-[11px] text-slate-300">{event.operation}</div>
                  <div className="font-mono text-[10px] text-slate-500">
                    status={event.status} {event.durationMs ? `· ${event.durationMs} ms` : ""}
                  </div>
                  {event.message ? <div className="mt-1 font-mono text-[10px] text-slate-500">{event.message}</div> : null}
                </div>
              ))}
              {!dashboard?.latestEvents?.length && !loading && !error && (
                <div className="font-mono text-xs text-slate-500">No monitoring events recorded yet.</div>
              )}
            </div>
          </CyberPanel>
        </div>
      </div>
    </AppShell>
  );
}
