"use client";

import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell } from "@/components/layout/AppShell";
import { CyberBadge, CyberPanel } from "@/components/cyber/CyberPanel";
import { fetchJsonWithRetry } from "@/lib/http/retry";

interface DashboardPayload {
  api: { responseTimeMs: number; errorRate: number };
  services: {
    brightData: { latency: number; status: string };
    speechmatics: { latency: number; status: string };
    band: { latency: number; status: string };
    realtime: { latency: number; status: string; activeConnections: number };
  };
  metrics: { activeInvestigations: number; activeUsers: number };
  latestEvents: Array<{ source: string; createdAt: string; durationMs: number | null }>;
}

interface ProviderPayload {
  name: string;
  configured: boolean;
  model: string;
}

export function AIOpsView() {
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [providers, setProviders] = useState<ProviderPayload[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        setError(null);
        const [dashboardData, providerData] = await Promise.all([
          fetchJsonWithRetry<{ dashboard: DashboardPayload }>("/api/operations/dashboard", { cache: "no-store" }, { retries: 2 }),
          fetchJsonWithRetry<{ providers: ProviderPayload[] }>("/api/ai/providers", { cache: "no-store" }, { retries: 2 }),
        ]);
        if (!active) return;
        setDashboard(dashboardData.dashboard);
        setProviders(providerData.providers ?? []);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load AI orchestration metrics");
      }
    };
    void run();
    const timer = window.setInterval(() => void run(), 10000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  const usageData = useMemo(() => {
    if (!dashboard) return [];
    return [
      { provider: "API", latency: dashboard.api.responseTimeMs, errorRate: dashboard.api.errorRate },
      { provider: "Bright Data", latency: dashboard.services.brightData.latency, errorRate: 0 },
      { provider: "Band", latency: dashboard.services.band.latency, errorRate: 0 },
      { provider: "Speechmatics", latency: dashboard.services.speechmatics.latency, errorRate: 0 },
      { provider: "Realtime", latency: dashboard.services.realtime.latency, errorRate: 0 },
    ];
  }, [dashboard]);

  const latencyTrend = useMemo(() => {
    if (!dashboard) return [];
    return dashboard.latestEvents
      .slice(0, 10)
      .reverse()
      .map((event) => ({
        t: new Date(event.createdAt).toLocaleTimeString(),
        latency: event.durationMs ?? 0,
      }));
  }, [dashboard]);

  return (
    <AppShell title="AI Orchestration Center" subtitle="Live provider routing, latency, and service telemetry">
      <div className="grid gap-3 lg:grid-cols-2">
        <CyberPanel title="Provider Latency" glow="cyan">
          <div className="mb-2 flex justify-between font-mono text-[11px]">
            <span className="font-medium text-slate-400">Active investigations</span>
            <span className="font-medium text-cyan-300">{dashboard?.metrics.activeInvestigations ?? 0}</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={usageData}>
              <XAxis dataKey="provider" tick={{ fill: "#94a3b8", fontSize: 10 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "#0c1222", border: "1px solid rgba(34,211,238,0.2)", fontSize: 11 }} />
              <Bar dataKey="latency" fill="#22d3ee" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CyberPanel>

        <CyberPanel title="Latency Trend (ms)" glow="violet">
          <div className="mb-2 flex gap-4 font-mono text-[11px]">
            <span className="text-cyan-300">API {Math.round(dashboard?.api.responseTimeMs ?? 0)}ms</span>
            <span className="text-violet-300">Realtime {Math.round(dashboard?.services.realtime.latency ?? 0)}ms</span>
            <span className="text-amber-300">Active users {dashboard?.metrics.activeUsers ?? 0}</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={latencyTrend}>
              <XAxis dataKey="t" tick={{ fill: "#94a3b8", fontSize: 10 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "#0c1222", border: "1px solid rgba(139,92,246,0.2)", fontSize: 11 }} />
              <Line type="monotone" dataKey="latency" stroke="#8b5cf6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CyberPanel>

        <CyberPanel title="Agent Model Routing" glow="emerald" className="lg:col-span-2">
          <div className="overflow-x-auto">
            <table className="w-full font-mono text-[11px]">
              <thead>
                <tr className="border-b border-cyan-500/10 text-left text-slate-500">
                  <th className="pb-2 pr-4 font-medium">Provider</th>
                  <th className="pb-2 pr-4 font-medium">Model</th>
                  <th className="pb-2 font-medium">Configured</th>
                </tr>
              </thead>
              <tbody>
                {providers.map((provider) => (
                  <tr key={provider.name} className="border-b border-white/5">
                    <td className="py-2 pr-4 font-medium text-white">{provider.name}</td>
                    <td className="py-2 text-slate-300">{provider.model}</td>
                    <td className="py-2">
                      <CyberBadge label={provider.configured ? "configured" : "missing key"} variant={provider.configured ? "emerald" : "red"} pulse={!provider.configured} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CyberPanel>
      </div>
      {error && <div className="mt-2 font-mono text-[11px] text-red-300">{error}</div>}
    </AppShell>
  );
}
