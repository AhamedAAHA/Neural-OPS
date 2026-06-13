"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { AppShell } from "@/components/layout/AppShell";
import { GlassCard } from "@/components/ui/GlassCard";
import { AGENT_TIERS } from "@/lib/mock-data";
import { Bot, Radio } from "lucide-react";

const CanvasWrapper = dynamic(() => import("@/components/3d/CanvasWrapper").then((m) => m.CanvasWrapper), { ssr: false });
const AgentOrbitScene = dynamic(() => import("@/components/3d/AgentOrbitSystem").then((m) => m.AgentOrbitScene), { ssr: false });

const TIER_COLORS = [
  { border: "border-cyan-500/30", bg: "bg-cyan-500/5", text: "text-cyan-400" },
  { border: "border-violet-500/30", bg: "bg-violet-500/5", text: "text-violet-400" },
  { border: "border-emerald-500/30", bg: "bg-emerald-500/5", text: "text-emerald-400" },
  { border: "border-red-500/30", bg: "bg-red-500/5", text: "text-red-400" },
  { border: "border-orange-500/30", bg: "bg-orange-500/5", text: "text-orange-400" },
];

export function AgentArchitectureView() {
  return (
    <AppShell title="Agent Architecture" subtitle="Five-tier autonomous agent network powered by Band">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 3D Orbit Visualization */}
        <GlassCard className="relative h-[400px] overflow-hidden lg:h-auto lg:min-h-[500px]">
          <CanvasWrapper className="h-full w-full" camera={{ position: [0, 2, 8], fov: 50 }}>
            <AgentOrbitScene activeIndices={[0, 1, 2, 3, 5, 6, 7]} />
          </CanvasWrapper>
          <div className="absolute bottom-4 left-4">
            <div className="flex items-center gap-2 rounded-lg border border-cyan-500/30 bg-black/60 px-3 py-2 backdrop-blur-sm">
              <Radio className="h-3 w-3 animate-pulse text-cyan-400" />
              <span className="text-xs text-cyan-400">7 agents active in orbit</span>
            </div>
          </div>
        </GlassCard>

        {/* Tier List */}
        <div className="space-y-4">
          {AGENT_TIERS.map((tier, i) => {
            const colors = TIER_COLORS[i];
            return (
              <motion.div
                key={tier.tier}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <GlassCard className={`p-4 ${colors.border}`}>
                  <div className={`mb-3 text-sm font-semibold ${colors.text}`}>{tier.tier}</div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {tier.agents.map((agent) => (
                      <div
                        key={agent}
                        className={`flex items-center gap-2 rounded-lg ${colors.bg} px-3 py-2`}
                      >
                        <Bot className={`h-3 w-3 ${colors.text}`} />
                        <span className="text-xs text-slate-300">{agent}</span>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Band Architecture Description */}
      <GlassCard glow="cyan" className="mt-6 p-6">
        <h3 className="mb-4 font-semibold text-white">Band Multi-Agent Collaboration</h3>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { title: "Agent Recruitment", desc: "Incident Commander dynamically recruits specialist agents based on incident type and evolving evidence." },
            { title: "Structured Messaging", desc: "8 message types enable context sharing, task handoffs, evidence submission, and approval requests." },
            { title: "Human-in-the-Loop", desc: "Governance layer agents escalate critical decisions to human executives with full audit trails." },
          ].map((item) => (
            <div key={item.title} className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
              <div className="mb-2 text-sm font-medium text-cyan-400">{item.title}</div>
              <p className="text-xs text-slate-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </GlassCard>
    </AppShell>
  );
}
