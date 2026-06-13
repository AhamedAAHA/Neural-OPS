"use client";

import { AppShell } from "@/components/layout/AppShell";
import { CyberPanel, CyberBadge } from "@/components/cyber/CyberPanel";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { useNeuralOpsStore } from "@/store/neural-ops";

const AGENT_ROUTING = [
  { agent: "Incident Commander", provider: "AIML API", model: "gpt-4o-mini" },
  { agent: "Financial Forensics", provider: "AIML API", model: "gpt-4o-mini" },
  { agent: "Compliance Agent", provider: "Featherless", model: "llama-3.3-70b" },
  { agent: "Risk Simulation", provider: "Featherless", model: "llama-3.3-70b" },
  { agent: "Legal Agent", provider: "Featherless", model: "llama-3.3-70b" },
  { agent: "Audit Agent", provider: "Local", model: "deterministic" },
  { agent: "Executive Strategy", provider: "AIML API", model: "gpt-4o-mini" },
];

export function AIOpsView() {
  const { aimlLatency, featherlessLatency, tokenUsage } = useNeuralOpsStore();

  const usageData = [
    { provider: "AIML", tokens: Math.round(tokenUsage * 0.55), latency: aimlLatency, requests: 47 },
    { provider: "Featherless", tokens: Math.round(tokenUsage * 0.35), latency: featherlessLatency, requests: 23 },
    { provider: "OpenAI", tokens: Math.round(tokenUsage * 0.08), latency: 650, requests: 8 },
    { provider: "Local", tokens: 0, latency: 1, requests: 15 },
  ];

  const latencyTrend = [
    { t: "08:42", aiml: aimlLatency + 48, featherless: featherlessLatency + 22 },
    { t: "09:00", aiml: aimlLatency + 12, featherless: featherlessLatency },
    { t: "09:15", aiml: aimlLatency - 8, featherless: featherlessLatency - 18 },
    { t: "09:30", aiml: aimlLatency - 22, featherless: featherlessLatency - 35 },
    { t: "09:45", aiml: aimlLatency, featherless: featherlessLatency },
  ];

  return (
    <AppShell title="AI Model Operations" subtitle="AIML API · Featherless · Routing · Latency · Token Usage">
      <div className="grid gap-3 lg:grid-cols-2">
        <CyberPanel title="Provider Usage" glow="cyan">
          <div className="mb-2 flex justify-between font-mono text-[11px]">
            <span className="font-medium text-slate-400">Total tokens</span>
            <span className="font-medium text-cyan-300">{tokenUsage.toLocaleString()}</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={usageData}>
              <XAxis dataKey="provider" tick={{ fill: "#94a3b8", fontSize: 10 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "#0c1222", border: "1px solid rgba(34,211,238,0.2)", fontSize: 11 }} />
              <Bar dataKey="tokens" fill="#22d3ee" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CyberPanel>

        <CyberPanel title="Latency Trend (ms)" glow="violet">
          <div className="mb-2 flex gap-4 font-mono text-[11px]">
            <span className="text-cyan-300">AIML {aimlLatency}ms</span>
            <span className="text-violet-300">Featherless {featherlessLatency}ms</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={latencyTrend}>
              <XAxis dataKey="t" tick={{ fill: "#94a3b8", fontSize: 10 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "#0c1222", border: "1px solid rgba(139,92,246,0.2)", fontSize: 11 }} />
              <Line type="monotone" dataKey="aiml" stroke="#22d3ee" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="featherless" stroke="#8b5cf6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CyberPanel>

        <CyberPanel title="Agent Model Routing" glow="emerald" className="lg:col-span-2">
          <div className="overflow-x-auto">
            <table className="w-full font-mono text-[11px]">
              <thead>
                <tr className="border-b border-cyan-500/10 text-left text-slate-500">
                  <th className="pb-2 pr-4 font-medium">Agent</th>
                  <th className="pb-2 pr-4 font-medium">Provider</th>
                  <th className="pb-2 font-medium">Model</th>
                  <th className="pb-2 font-medium">Latency</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {AGENT_ROUTING.map((row) => (
                  <tr key={row.agent} className="border-b border-white/5">
                    <td className="py-2 pr-4 font-medium text-white">{row.agent}</td>
                    <td className="py-2 pr-4">
                      <CyberBadge label={row.provider} variant={row.provider.includes("Featherless") ? "violet" : row.provider === "Local" ? "emerald" : "cyan"} />
                    </td>
                    <td className="py-2 text-slate-300">{row.model}</td>
                    <td className="py-2 text-slate-400">
                      {row.provider.includes("Featherless") ? `${featherlessLatency}ms` : row.provider === "Local" ? "1ms" : `${aimlLatency}ms`}
                    </td>
                    <td className="py-2"><CyberBadge label="online" variant="emerald" pulse /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CyberPanel>
      </div>
    </AppShell>
  );
}
