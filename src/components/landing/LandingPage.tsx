"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { ArrowRight, Radio, Award } from "lucide-react";
import { NeonButton } from "@/components/ui/NeonButton";
import { Scanlines } from "@/components/ui/Scanlines";
import { CyberPanel, CyberBadge } from "@/components/cyber/CyberPanel";
import { APP_TAGLINE, MODEL_PROVIDERS, CRISIS_TYPES } from "@/lib/constants";
import { useNeuralOpsStore } from "@/store/neural-ops";

const CanvasWrapper = dynamic(() => import("@/components/3d/CanvasWrapper").then((m) => m.CanvasWrapper), { ssr: false });
const ThreatGlobeScene = dynamic(() => import("@/components/3d/ThreatGlobe").then((m) => m.ThreatGlobeScene), { ssr: false });

const FLOATING_MESSAGES = [
  { from: "Incident Commander", to: "Digital Forensics", text: "Recruited Digital Forensics Agent" },
  { from: "Compliance Agent", to: "Legal Agent", text: "Requested Legal review" },
  { from: "Risk Agent", to: "Executive", text: "Calculated 87/100 severity" },
];

export function LandingHero() {
  const { activeAgentCount, incidentCount, threatsBlocked, compliancePct } = useNeuralOpsStore();

  return (
    <section className="relative flex h-screen w-full flex-col overflow-hidden bg-neural-bg">
      <Scanlines />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_70%_at_65%_40%,rgba(34,211,238,0.08),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_20%_50%,rgba(139,92,246,0.05),transparent_60%)]" />

      <div className="relative z-20 mx-auto grid min-h-0 w-full max-w-[1280px] flex-1 grid-cols-1 items-center gap-8 px-6 py-8 lg:grid-cols-2 lg:gap-x-12 lg:px-10 xl:max-w-[1360px] xl:gap-x-14">
        {/* Left: hero copy */}
        <div className="flex w-full items-center lg:justify-end lg:pr-2 xl:pr-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: "easeOut" }}
            className="w-full max-w-xl text-left"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-500/25 bg-cyan-500/[0.06] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-cyan-400">
              <Radio className="h-3 w-3 animate-pulse" />
              Band Multi-Agent · Track 3 · Regulated Ops
            </div>

            <h1 className="font-display text-gradient-cyber mb-4 text-3xl font-bold leading-[1.12] tracking-wide md:text-4xl xl:text-[2.75rem]">
              Autonomous Enterprise Crisis Investigation Network
            </h1>

            <p className="mb-7 max-w-md font-mono text-sm leading-relaxed text-slate-400">{APP_TAGLINE}</p>

            <div className="mb-7 flex flex-wrap gap-2">
              {MODEL_PROVIDERS.map((p) => (
                <CyberBadge key={p.name} label={p.name} variant={p.color as "cyan" | "violet" | "emerald" | "amber"} pulse={p.status === "online"} />
              ))}
            </div>

            <div className="mb-8 flex h-8 max-w-xs items-end gap-0.5">
              {Array.from({ length: 24 }).map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ height: [4, 8 + Math.sin(i) * 12, 4] }}
                  transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.05 }}
                  className="w-1 rounded-full bg-cyan-500/40"
                />
              ))}
              <span className="ml-2 font-mono text-[9px] uppercase tracking-wider text-slate-600">Speechmatics</span>
            </div>

            <div className="flex flex-wrap gap-3">
              <NeonButton href="/command-center" size="lg" className="font-mono uppercase tracking-wider">
                &gt; Launch Command Center
              </NeonButton>
              <NeonButton href="/investigation" variant="secondary" size="lg" className="font-mono uppercase tracking-wider">
                Start Investigation <ArrowRight className="h-4 w-4" />
              </NeonButton>
            </div>
          </motion.div>
        </div>

        {/* Right: 3D globe */}
        <div className="relative min-h-[44vh] w-full lg:min-h-0 lg:h-full lg:pl-2 xl:pl-4">
          <CanvasWrapper
            transparent
            className="absolute inset-0 h-full w-full"
            camera={{ position: [0, 2, 11], fov: 42 }}
          >
            <ThreatGlobeScene />
          </CanvasWrapper>

          <div className="pointer-events-none absolute inset-0 z-10 hidden md:block">
            {FLOATING_MESSAGES.map((msg, i) => (
              <motion.div
                key={msg.text}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + i * 0.45 }}
                className="glass-packet absolute rounded-lg px-3 py-2 font-mono text-[10px]"
                style={{ top: `${16 + i * 24}%`, right: `${8 + (i % 2) * 6}%` }}
              >
                <span className="text-cyan-400">{msg.from}</span>
                <span className="text-slate-600"> → </span>
                <span className="text-violet-400">{msg.to}</span>
                <div className="mt-1 text-slate-400">{msg.text}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative z-20 border-t border-cyan-500/10 bg-neural-bg/80 backdrop-blur-md">
        <div className="mx-auto grid max-w-5xl grid-cols-4 gap-2 p-3">
          {[
            { label: "Active Agents", value: String(activeAgentCount) },
            { label: "Incidents", value: String(incidentCount) },
            { label: "Threats Blocked", value: String(threatsBlocked) },
            { label: "Compliance", value: `${compliancePct}%` },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-display text-xl font-bold text-cyan-300">{stat.value}</div>
              <div className="font-mono text-[10px] font-medium uppercase tracking-wider text-slate-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LandingSections() {
  return (
    <div className="relative z-10 bg-neural-bg pb-16">
      <section className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="font-display mb-2 text-center text-xl font-bold text-white">Supported Crisis Types</h2>
        <div className="mt-6 grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-5">
          {CRISIS_TYPES.map((type, i) => (
            <motion.div key={type} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.03 }}>
              <CyberPanel compact className="text-center">
                <span className="font-mono text-[10px] text-slate-400">{type}</span>
              </CyberPanel>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="border-y border-cyan-500/10 bg-neural-panel/30 py-16">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <Award className="mx-auto mb-3 h-10 w-10 text-violet-400" />
          <h2 className="font-display text-xl font-bold text-white">Track 3: Regulated & High-Stakes Workflows</h2>
          <p className="mt-2 font-mono text-sm text-slate-500">Enterprise security where human oversight and audit trails are mandatory.</p>
          <NeonButton href="/command-center" size="lg" className="mt-6 font-mono">Enter Command Center</NeonButton>
        </div>
      </section>
    </div>
  );
}
