"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AppShell } from "@/components/layout/AppShell";
import { CyberPanel, CyberBadge } from "@/components/cyber/CyberPanel";
import { RISK_SCENARIOS } from "@/lib/mock-data";
import { TrendingDown, TrendingUp, DollarSign, Scale, Shield, Users, Clock, Star } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from "recharts";

const IMPACT_ICONS = {
  financial: DollarSign,
  legal: Scale,
  compliance: Shield,
  reputation: TrendingDown,
  downtime: Clock,
  customer: Users,
};

export function RiskSimulationView() {
  const [selected, setSelected] = useState(RISK_SCENARIOS[4]);
  const [timeframe, setTimeframe] = useState<"24h" | "7d">("24h");

  const radarData = Object.entries(selected.impacts).map(([key, value]) => ({
    subject: key.slice(0, 6),
    value: key === "financial" ? Math.min(value / 50000, 100) : value,
  }));

  const compareData = RISK_SCENARIOS.slice(0, 5).map((s) => ({
    name: s.title.slice(0, 12),
    financial: s.impacts.financial / 10000,
    legal: s.impacts.legal,
  }));

  return (
    <AppShell title="Risk War-Game Simulator" subtitle="Future Risk Simulation Agent · Scenario Matrix · Agent Debate">
      <div className="grid h-[calc(100vh-5.5rem)] grid-cols-12 gap-2 overflow-hidden">
        <div className="col-span-3 space-y-2 overflow-y-auto">
          <CyberPanel title="Scenarios" compact glow="cyan">
            {RISK_SCENARIOS.map((scenario) => (
              <button
                key={scenario.id}
                type="button"
                onClick={() => setSelected(scenario)}
                className={`mb-1.5 w-full rounded border p-2 text-left transition-all last:mb-0 ${
                  selected.id === scenario.id ? "glow-active border-cyan-500/30 bg-cyan-500/5" : "border-white/5 hover:border-cyan-500/15"
                }`}
              >
                <div className="font-mono text-[10px] font-medium text-white">{scenario.title}</div>
                <div className="font-mono text-[9px] text-slate-600">{scenario.description.slice(0, 50)}...</div>
              </button>
            ))}
          </CyberPanel>
          <div className="flex gap-1">
            {(["24h", "7d"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTimeframe(t)}
                className={`flex-1 rounded border py-1.5 font-mono text-[9px] uppercase ${
                  timeframe === t ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-400" : "border-white/5 text-slate-600"
                }`}
              >
                {t === "24h" ? "Simulate 24h" : "Simulate 7d"}
              </button>
            ))}
          </div>
          <button type="button" className="w-full rounded border border-violet-500/30 bg-violet-500/10 py-2 font-mono text-[10px] text-violet-400 hover:glow-active">
            Ask Agents to Debate
          </button>
        </div>

        <div className="col-span-6 space-y-2 overflow-y-auto">
          <CyberPanel title={selected.title} glow="violet">
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(selected.impacts) as [keyof typeof IMPACT_ICONS, number][]).map(([key, value]) => {
                const Icon = IMPACT_ICONS[key];
                const isFinancial = key === "financial";
                return (
                  <div key={key} className="rounded border border-white/5 bg-white/[0.02] p-2">
                    <Icon className="mb-1 h-3.5 w-3.5 text-slate-600" />
                    <div className="font-mono text-[9px] uppercase text-slate-600">{key}</div>
                    <div className={`font-mono text-sm font-bold ${value > 70 ? "text-red-400" : "text-emerald-400"}`}>
                      {isFinancial ? `$${(value / 1000).toFixed(0)}K` : `${value}%`}
                    </div>
                    <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(isFinancial ? value / 25000 : value, 100)}%` }}
                        className={`h-full rounded-full ${value > 70 ? "bg-red-500" : "bg-emerald-500"}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CyberPanel>
          <CyberPanel title="Impact Radar" glow="cyan">
            <ResponsiveContainer width="100%" height={180}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(34,211,238,0.1)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "#64748b", fontSize: 9 }} />
                <Radar dataKey="value" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.2} />
              </RadarChart>
            </ResponsiveContainer>
          </CyberPanel>
          <CyberPanel title="Scenario Comparison" glow="amber">
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={compareData}>
                <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 8 }} />
                <YAxis tick={{ fill: "#64748b", fontSize: 8 }} />
                <Tooltip contentStyle={{ background: "#0c1222", border: "1px solid rgba(34,211,238,0.2)", fontSize: 10 }} />
                <Bar dataKey="legal" fill="#8b5cf6" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CyberPanel>
        </div>

        <div className="col-span-3 space-y-2">
          <CyberPanel title="Agent Recommendation" glow="emerald">
            <p className="font-mono text-xs text-emerald-400">{selected.recommendation}</p>
            <div className="mt-2 flex items-center gap-2">
              <Star className="h-4 w-4 text-cyan-400" />
              <span className="font-display text-2xl font-bold text-cyan-400">{selected.confidence}%</span>
            </div>
          </CyberPanel>
          <CyberPanel title="Future Risk Simulation Agent" glow="cyan" className="flex-1">
            <p className="font-mono text-[10px] leading-relaxed text-slate-400">{selected.agentNote}</p>
            <div className="mt-3 space-y-1">
              {[
                { action: "Freeze vendor payments", score: 96, up: true },
                { action: "Ignore incident", score: 3, up: false },
              ].map((item) => (
                <div key={item.action} className="flex items-center justify-between rounded border border-white/5 p-1.5">
                  <span className="font-mono text-[9px] text-slate-500">{item.action}</span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-[10px] font-bold text-emerald-400">{item.score}%</span>
                    {item.up ? <TrendingUp className="h-3 w-3 text-emerald-400" /> : <TrendingDown className="h-3 w-3 text-red-400" />}
                  </div>
                </div>
              ))}
            </div>
            <CyberBadge label="Awaiting Human Approval" variant="red" pulse />
          </CyberPanel>
          <CyberPanel title="Agent Debate" compact glow="violet">
            <div className="space-y-2 font-mono text-[10px]">
              <div><span className="text-cyan-400">Risk Agent:</span> <span className="text-slate-400">Freeze payments — 96% confidence</span></div>
              <div><span className="text-violet-400">Legal Agent:</span> <span className="text-slate-400">Approve after counsel review</span></div>
              <div><span className="text-amber-400">PR Agent:</span> <span className="text-slate-400">Defer public disclosure</span></div>
            </div>
          </CyberPanel>
        </div>
      </div>
    </AppShell>
  );
}
