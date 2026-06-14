"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { Bot, Radio, Terminal } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { CyberBadge, CyberPanel } from "@/components/cyber/CyberPanel";
import { MODEL_PROVIDERS } from "@/lib/constants";
import { fetchJsonWithRetry } from "@/lib/http/retry";
import { useNeuralOpsStore } from "@/store/neural-ops";

const AgentNetworkCanvas = dynamic(
  () => import("@/components/agents/AgentNetworkCanvas").then((m) => m.AgentNetworkCanvas),
  { ssr: false }
);
const AgentNetworkScene = dynamic(
  () => import("@/components/3d/AgentOrbitSystem").then((m) => m.AgentNetworkScene),
  { ssr: false }
);

interface ApiAgent {
  id: string;
  name: string;
  role: string;
  tier: "Detection" | "Investigation" | "Intelligence" | "Governance" | "Response";
  status: "idle" | "active" | "recruiting" | "waiting" | "completed" | "offline";
  provider: "AIML_API" | "FEATHERLESS" | "OPENAI" | "LOCAL";
}

interface ProviderEntry {
  name: string;
  configured: boolean;
  model: string;
}

const TIER_COLORS = {
  Detection: { border: "border-cyan-500/30", text: "text-cyan-400", glow: "cyan" as const },
  Investigation: { border: "border-violet-500/30", text: "text-violet-400", glow: "violet" as const },
  Intelligence: { border: "border-emerald-500/30", text: "text-emerald-400", glow: "emerald" as const },
  Governance: { border: "border-red-500/30", text: "text-red-400", glow: "red" as const },
  Response: { border: "border-amber-500/30", text: "text-amber-400", glow: "amber" as const },
};

function modelVariant(model: string): "cyan" | "violet" | "emerald" | "default" {
  if (model === "AIML_API" || model === "OPENAI") return "cyan";
  if (model === "FEATHERLESS") return "violet";
  if (model === "LOCAL") return "emerald";
  return "default";
}

export function AgentArchitectureView() {
  const [agents, setAgents] = useState<ApiAgent[]>([]);
  const [providers, setProviders] = useState<ProviderEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { aimlLatency, featherlessLatency } = useNeuralOpsStore();

  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        setError(null);
        const [agentsData, providersData] = await Promise.all([
          fetchJsonWithRetry<{ agents: ApiAgent[] }>("/api/agents", { cache: "no-store" }, { retries: 2 }),
          fetchJsonWithRetry<{ providers: ProviderEntry[] }>("/api/ai/providers", { cache: "no-store" }, { retries: 2 }),
        ]);
        if (!active) return;
        setAgents(agentsData.agents ?? []);
        setProviders(providersData.providers ?? []);
        useNeuralOpsStore.setState({
          activeAgentCount: (agentsData.agents ?? []).filter((agent) => agent.status === "active" || agent.status === "waiting").length,
        });
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load architecture data");
      }
    };
    void run();
    return () => {
      active = false;
    };
  }, []);

  const groupedByTier = useMemo(() => {
    const map = new Map<ApiAgent["tier"], ApiAgent[]>();
    for (const agent of agents) {
      const list = map.get(agent.tier) ?? [];
      list.push(agent);
      map.set(agent.tier, list);
    }
    return Array.from(map.entries());
  }, [agents]);

  const providerLatency = (name: string) => {
    if (name === "AIML_API") return `${aimlLatency}ms`;
    if (name === "FEATHERLESS") return `${featherlessLatency}ms`;
    if (name === "OPENAI") return "210ms";
    return "1ms";
  };

  const providerUsage = MODEL_PROVIDERS.map((provider) => ({
    name: provider.name,
    count: agents.filter((agent) => agent.provider === provider.name.replace(" ", "_")).length,
  }));

  return (
    <AppShell title="Agent Architecture" subtitle={`SYS://band.multi-agent.topology · ${agents.length} agents discovered`} fullWidth>
      <div className="flex h-[calc(100vh-5.5rem)] flex-col gap-3 p-3 font-mono">
        <div className="grid shrink-0 grid-cols-2 gap-3 lg:grid-cols-4">
          {providers.map((provider) => {
            const usage = providerUsage.find((item) => item.name === provider.name)?.count ?? 0;
            const load = Math.min(95, 25 + usage * 12);
            return (
              <CyberPanel key={provider.name} compact glow="cyan" hover={false}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-slate-200">{provider.name}</span>
                  <CyberBadge label={provider.configured ? "ONLINE" : "MISSING KEY"} variant={provider.configured ? "emerald" : "red"} />
                </div>
                <div className="mt-2 flex justify-between text-[10px] text-slate-400">
                  <span>lat {providerLatency(provider.name)}</span>
                  <span className="text-cyan-300">{usage} agents</span>
                </div>
                <div className="mt-1.5 h-1 overflow-hidden rounded-sm bg-white/5">
                  <div className="h-full rounded-sm bg-cyan-500/50" style={{ width: `${load}%` }} />
                </div>
              </CyberPanel>
            );
          })}
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-5">
          <div className="relative h-full min-h-0 overflow-hidden rounded-lg border border-cyan-500/25 glass-premium lg:col-span-2">
            <div className="absolute inset-x-0 top-0 z-10 border-b border-cyan-500/10 bg-[rgba(5,12,28,0.8)] px-3 py-2 backdrop-blur-sm">
              <h3 className="font-mono text-[11px] font-semibold uppercase tracking-[0.15em] text-cyan-400">Agent Network Map</h3>
            </div>
            <AgentNetworkCanvas className="absolute inset-0 h-full w-full">
              <AgentNetworkScene />
            </AgentNetworkCanvas>
            <div className="absolute bottom-2 left-2 z-10 flex flex-col gap-1">
              <div className="flex items-center gap-2 border border-cyan-500/20 bg-[#020617]/90 px-2 py-1 text-[10px] text-cyan-300">
                <Radio className="h-3 w-3 text-emerald-400" />
                <span className="font-medium">{agents.length}_AGENTS · TOPOLOGY_ONLINE</span>
              </div>
              <span className="rounded border border-cyan-500/15 bg-[#020617]/80 px-2 py-0.5 text-[10px] text-slate-400">Scroll to zoom · Drag to rotate</span>
            </div>
          </div>

          <div className="min-h-0 space-y-1.5 overflow-y-auto lg:col-span-3">
            {groupedByTier.map(([tier, tierAgents]) => {
              const colors = TIER_COLORS[tier];
              return (
                <CyberPanel key={tier} title={tier} glow={colors.glow} compact hover={false}>
                  <div className="mb-2 flex items-center gap-2 border-b border-white/5 pb-1.5 text-[9px] text-slate-600">
                    <Terminal className="h-3 w-3" />
                    <span>{tierAgents.length} units</span>
                  </div>
                  <div className="grid gap-1 sm:grid-cols-2 xl:grid-cols-3">
                    {tierAgents.map((agent) => {
                      const online = agent.status === "active" || agent.status === "waiting";
                      return (
                        <div key={agent.id} className={`flex items-center gap-2 border ${colors.border} bg-black/20 px-2 py-1.5 ${online ? "" : "opacity-50"}`}>
                          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${online ? "bg-emerald-400" : "bg-slate-600"}`} />
                          <Bot className={`h-3 w-3 shrink-0 ${colors.text}`} />
                          <span className="min-w-0 flex-1 truncate text-[10px] font-medium text-slate-200">{agent.name}</span>
                          <CyberBadge label={agent.provider} variant={modelVariant(agent.provider)} />
                        </div>
                      );
                    })}
                  </div>
                </CyberPanel>
              );
            })}
          </div>
        </div>
      </div>
      {error && (
        <div className="pointer-events-none fixed bottom-12 right-4 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 font-mono text-[11px] text-red-200">
          {error}
        </div>
      )}
    </AppShell>
  );
}
