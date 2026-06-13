"use client";

import dynamic from "next/dynamic";
import { AppShell } from "@/components/layout/AppShell";
import { CyberPanel, CyberBadge } from "@/components/cyber/CyberPanel";
import { AGENT_TIERS, AGENTS } from "@/lib/mock-data";
import { MODEL_PROVIDERS } from "@/lib/constants";
import { Bot, Radio, Terminal } from "lucide-react";
import { useNeuralOpsStore } from "@/store/neural-ops";

const AgentNetworkCanvas = dynamic(
  () => import("@/components/agents/AgentNetworkCanvas").then((m) => m.AgentNetworkCanvas),
  { ssr: false }
);
const AgentNetworkScene = dynamic(
  () => import("@/components/3d/AgentOrbitSystem").then((m) => m.AgentNetworkScene),
  { ssr: false }
);

const TIER_COLORS = [
  { border: "border-cyan-500/30", text: "text-cyan-400", glow: "cyan" as const, label: "DET" },
  { border: "border-violet-500/30", text: "text-violet-400", glow: "violet" as const, label: "INV" },
  { border: "border-emerald-500/30", text: "text-emerald-400", glow: "emerald" as const, label: "INT" },
  { border: "border-red-500/30", text: "text-red-400", glow: "red" as const, label: "GOV" },
  { border: "border-amber-500/30", text: "text-amber-400", glow: "amber" as const, label: "RSP" },
];

const AGENT_MODELS: Record<string, string> = {
  "Security Monitoring Agent": "AIML",
  "Threat Intelligence Agent": "AIML",
  "Social Intelligence Agent": "Band",
  "Incident Commander Agent": "AIML",
  "Digital Forensics Agent": "FLT",
  "Communication Analysis Agent": "FLT",
  "Financial Forensics Agent": "AIML",
  "Identity Investigation Agent": "AIML",
  "Timeline Reconstruction Agent": "LOC",
  "Correlation Agent": "AIML",
  "Root Cause Agent": "FLT",
  "Impact Analysis Agent": "Band",
  "Future Risk Simulation Agent": "AIML",
  "Compliance Agent": "Band",
  "Legal Agent": "FLT",
  "Audit Agent": "LOC",
  "PR Agent": "Band",
  "Customer Communication Agent": "FLT",
  "Remediation Agent": "LOC",
  "Executive Strategy Agent": "AIML",
};

const ONLINE_AGENTS = new Set([
  "Incident Commander Agent",
  "Digital Forensics Agent",
  "Financial Forensics Agent",
  "Communication Analysis Agent",
  "Identity Investigation Agent",
  "Compliance Agent",
  "Legal Agent",
  "Future Risk Simulation Agent",
  "Executive Strategy Agent",
  "Audit Agent",
  "Security Monitoring Agent",
  "Correlation Agent",
]);

const PROVIDER_STATS: Record<string, { load: number }> = {
  "AIML API": { load: 68 },
  Featherless: { load: 52 },
  Band: { load: 81 },
  Speechmatics: { load: 44 },
};

function modelVariant(model: string): "cyan" | "violet" | "emerald" | "default" {
  if (model === "AIML") return "cyan";
  if (model === "FLT") return "violet";
  if (model === "Band") return "emerald";
  return "default";
}

export function AgentArchitectureView() {
  const { aimlLatency, featherlessLatency, recruitedAgentIds, activeAgentCount } = useNeuralOpsStore();

  const providerLatency = (name: string) => {
    if (name === "AIML API") return `${aimlLatency}ms`;
    if (name === "Featherless") return `${featherlessLatency}ms`;
    if (name === "Band") return "24ms";
    return "89ms";
  };

  const recruitedNames = new Set(
    AGENTS.filter((a) => recruitedAgentIds.includes(a.id)).map((a) =>
      a.name.endsWith(" Agent") ? a.name : `${a.name} Agent`
    )
  );
  const onlineAgents = new Set([...ONLINE_AGENTS, ...recruitedNames]);

  return (
    <AppShell title="Agent Architecture" subtitle={`SYS://band.multi-agent.topology · ${activeAgentCount} agents online`} fullWidth>
      <div className="flex h-[calc(100vh-5.5rem)] flex-col gap-3 p-3 font-mono">
        {/* Provider strip */}
        <div className="grid shrink-0 grid-cols-2 gap-3 lg:grid-cols-4">
          {MODEL_PROVIDERS.map((p) => {
            const stats = PROVIDER_STATS[p.name] ?? { load: 0 };
            return (
              <CyberPanel key={p.name} compact glow="cyan" hover={false}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-slate-200">{p.name}</span>
                  <CyberBadge label="ONLINE" variant="emerald" />
                </div>
                <div className="mt-2 flex justify-between text-[10px] text-slate-400">
                  <span>lat {providerLatency(p.name)}</span>
                  <span className="text-cyan-300">load {stats.load}%</span>
                </div>
                <div className="mt-1.5 h-1 overflow-hidden rounded-sm bg-white/5">
                  <div className="h-full rounded-sm bg-cyan-500/50" style={{ width: `${stats.load}%` }} />
                </div>
              </CyberPanel>
            );
          })}
        </div>

        {/* Main */}
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-5">
          <div className="relative h-full min-h-0 overflow-hidden rounded-lg border border-cyan-500/25 glass-premium lg:col-span-2">
            <div className="absolute inset-x-0 top-0 z-10 border-b border-cyan-500/10 bg-[rgba(5,12,28,0.8)] px-3 py-2 backdrop-blur-sm">
              <h3 className="font-mono text-[11px] font-semibold uppercase tracking-[0.15em] text-cyan-400">
                Agent Network Map
              </h3>
            </div>
            <AgentNetworkCanvas className="absolute inset-0 h-full w-full">
              <AgentNetworkScene />
            </AgentNetworkCanvas>
            <div className="pointer-events-none absolute inset-0 rounded-lg border border-cyan-500/10" />
            <div className="absolute bottom-2 left-2 z-10 flex flex-col gap-1">
              <div className="flex items-center gap-2 border border-cyan-500/20 bg-[#020617]/90 px-2 py-1 text-[10px] text-cyan-300">
                <Radio className="h-3 w-3 text-emerald-400" />
                <span className="font-medium">17_AGENTS · BAND_ROOM_ACTIVE</span>
              </div>
              <span className="rounded border border-cyan-500/15 bg-[#020617]/80 px-2 py-0.5 text-[10px] text-slate-400">
                Scroll to zoom · Drag to rotate
              </span>
            </div>
          </div>

          <div className="min-h-0 space-y-1.5 overflow-y-auto lg:col-span-3">
            {AGENT_TIERS.map((tier, i) => {
              const colors = TIER_COLORS[i];
              return (
                <CyberPanel key={tier.tier} title={tier.tier} glow={colors.glow} compact hover={false}>
                  <div className="mb-2 flex items-center gap-2 border-b border-white/5 pb-1.5 text-[9px] text-slate-600">
                    <Terminal className="h-3 w-3" />
                    <span>TIER_{colors.label} · {tier.agents.length} units</span>
                  </div>
                  <div className="grid gap-1 sm:grid-cols-2 xl:grid-cols-3">
                    {tier.agents.map((agent) => {
                      const online = onlineAgents.has(agent);
                      const model = AGENT_MODELS[agent] ?? "LOC";
                      return (
                        <div
                          key={agent}
                          className={`flex items-center gap-2 border ${colors.border} bg-black/20 px-2 py-1.5 ${online ? "" : "opacity-50"}`}
                        >
                          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${online ? "bg-emerald-400" : "bg-slate-600"}`} />
                          <Bot className={`h-3 w-3 shrink-0 ${colors.text}`} />
                          <span className="min-w-0 flex-1 truncate text-[10px] font-medium text-slate-200">{agent.replace(" Agent", "")}</span>
                          <CyberBadge label={model} variant={modelVariant(model)} />
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
    </AppShell>
  );
}
