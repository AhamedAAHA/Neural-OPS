"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AppShell } from "@/components/layout/AppShell";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { RISK_SCENARIOS } from "@/lib/mock-data";
import { Bot, TrendingDown, TrendingUp, DollarSign, Scale, Shield, Users, Clock, Star } from "lucide-react";

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

  return (
    <AppShell title="Risk Simulation" subtitle="Future Risk Simulation Agent · Outcome comparison">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Scenario Cards */}
        <div className="lg:col-span-1 space-y-2">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Response Scenarios</h3>
          {RISK_SCENARIOS.map((scenario) => (
            <motion.div key={scenario.id} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              <GlassCard
                glow={selected.id === scenario.id ? "cyan" : "none"}
                hover
                className="cursor-pointer p-4"
                onClick={() => setSelected(scenario)}
              >
                <div className="text-sm font-medium text-white">{scenario.title}</div>
                <div className="mt-1 text-xs text-slate-500">{scenario.description}</div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* Impact Analysis */}
        <div className="lg:col-span-2 space-y-4">
          <GlassCard glow="violet" className="p-6">
            <h3 className="mb-4 text-xl font-semibold text-white">{selected.title}</h3>
            <p className="mb-6 text-sm text-slate-400">{selected.description}</p>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {(Object.entries(selected.impacts) as [keyof typeof IMPACT_ICONS, number][]).map(([key, value]) => {
                const Icon = IMPACT_ICONS[key];
                const isFinancial = key === "financial";
                return (
                  <div key={key} className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Icon className="h-4 w-4 text-slate-500" />
                      <span className="text-xs capitalize text-slate-500">{key.replace("_", " ")}</span>
                    </div>
                    <div className={`text-lg font-bold ${value > 70 ? "text-red-400" : value > 40 ? "text-orange-400" : "text-emerald-400"}`}>
                      {isFinancial ? `$${(value / 1000).toFixed(0)}K` : `${value}%`}
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(value / (isFinancial ? 25000 : 1), 100)}%` }}
                        className={`h-full rounded-full ${value > 70 ? "bg-red-500" : value > 40 ? "bg-orange-500" : "bg-emerald-500"}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
                <div className="mb-1 text-xs text-emerald-400">Agent Recommendation</div>
                <div className="text-sm font-medium text-white">{selected.recommendation}</div>
              </div>
              <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-4">
                <div className="mb-1 flex items-center gap-1 text-xs text-cyan-400">
                  <Star className="h-3 w-3" /> Confidence Score
                </div>
                <div className="text-2xl font-bold text-cyan-400">{selected.confidence}%</div>
              </div>
            </div>
          </GlassCard>

          {/* Future Risk Simulation Agent Panel */}
          <GlassCard glow="cyan" className="p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/20">
                <Bot className="h-5 w-5 text-orange-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Future Risk Simulation Agent</h3>
                <p className="text-xs text-slate-500">Comparing outcomes before final human approval</p>
              </div>
            </div>
            <p className="mb-4 text-sm text-slate-300">{selected.agentNote}</p>

            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase text-slate-500">Recommended vs Selected</div>
              {[
                { action: "Freeze vendor payments", score: 96, recommended: true },
                { action: "Rotate compromised credentials", score: 93, recommended: true },
                { action: "Start forensic audit", score: 91, recommended: true },
                { action: "Ignore incident", score: 3, recommended: false },
              ].map((item) => (
                <div key={item.action} className="flex items-center justify-between rounded-lg bg-white/[0.02] px-3 py-2">
                  <span className="text-xs text-slate-300">{item.action}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${item.score > 80 ? "text-emerald-400" : "text-red-400"}`}>{item.score}%</span>
                    {item.recommended ? (
                      <TrendingUp className="h-3 w-3 text-emerald-400" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-2">
              <Badge label="Awaiting Human Approval" severity="high" dot />
            </div>
          </GlassCard>
        </div>
      </div>
    </AppShell>
  );
}
