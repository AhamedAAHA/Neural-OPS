"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { ArrowRight, Radio } from "lucide-react";
import { NeonButton } from "@/components/ui/NeonButton";
import { Scanlines } from "@/components/ui/Scanlines";
import { CyberPanel, CyberBadge } from "@/components/cyber/CyberPanel";
import { APP_TAGLINE, MODEL_PROVIDERS, CRISIS_TYPES } from "@/lib/constants";
import { Z } from "@/lib/layers";
import { useNeuralOpsStore } from "@/store/neural-ops";

const CanvasWrapper = dynamic(() => import("@/components/3d/CanvasWrapper").then((m) => m.CanvasWrapper), { ssr: false });
const ThreatGlobeScene = dynamic(() => import("@/components/3d/ThreatGlobe").then((m) => m.ThreatGlobeScene), { ssr: false });

export function LandingHero() {
  const { activeAgentCount, incidentCount, threatsBlocked, compliancePct } = useNeuralOpsStore();

  return (
    <section className="relative flex min-h-screen w-full flex-col overflow-hidden bg-neural-bg lg:h-screen">
      <Scanlines className={Z.canvasFx} />
      <div className={`pointer-events-none absolute inset-0 ${Z.canvasFx} bg-[radial-gradient(ellipse_80%_70%_at_65%_40%,rgba(34,211,238,0.08),transparent_55%)]`} />
      <div className={`pointer-events-none absolute inset-0 ${Z.canvasFx} bg-[radial-gradient(ellipse_50%_50%_at_20%_50%,rgba(139,92,246,0.05),transparent_60%)]`} />

      <div className={`relative ${Z.pageContent} mx-auto grid min-h-0 w-full max-w-[1280px] flex-1 grid-cols-1 items-center gap-8 px-6 pb-8 pt-24 lg:grid-cols-2 lg:gap-x-12 lg:px-10 lg:pt-8 xl:max-w-[1360px] xl:gap-x-14`}>
        <div className={`relative ${Z.pageContent} flex w-full items-center lg:justify-end lg:pr-2 xl:pr-4`}>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: "easeOut" }}
            className="w-full max-w-xl text-left"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-500/25 bg-cyan-500/[0.06] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-cyan-400">
              <Radio className="h-3 w-3 animate-pulse" />
              Enterprise Risk & Decision Operating System
            </div>

            <h1 className="font-display text-gradient-cyber mb-4 text-3xl font-bold leading-[1.12] tracking-wide md:text-4xl xl:text-[2.75rem]">
              Autonomous Enterprise Risk & Decision Operating System
            </h1>

            <p className="mb-7 max-w-md font-mono text-sm leading-relaxed text-slate-400">{APP_TAGLINE}</p>

            <div className="mb-7 flex flex-wrap gap-2">
              {MODEL_PROVIDERS.map((p) => (
                <CyberBadge key={p.name} label={p.name} variant={p.color as "cyan" | "violet" | "emerald" | "amber"} pulse={p.status === "online"} />
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <NeonButton href="/command-center" size="lg" className="font-mono uppercase tracking-wider">
                &gt; Enter Operations Center
              </NeonButton>
              <NeonButton href="/investigation" variant="secondary" size="lg" className="font-mono uppercase tracking-wider">
                Start Investigation <ArrowRight className="h-4 w-4" />
              </NeonButton>
            </div>
          </motion.div>
        </div>

        <div className="relative isolate min-h-[50vh] w-full overflow-hidden lg:min-h-0 lg:h-full lg:pl-2 xl:pl-4">
          <div className={`pointer-events-none absolute inset-0 ${Z.canvasFx} flex items-center justify-center`}>
            <div className="relative h-[74%] w-[74%] max-h-[560px] max-w-[560px] opacity-95">
              <div className="absolute inset-0 rounded-full border-2 border-cyan-300/70 bg-[radial-gradient(circle_at_34%_30%,rgba(103,232,249,0.45),rgba(2,6,23,0.06)_56%)] shadow-[0_0_180px_rgba(34,211,238,0.32)]" />
              <div className="absolute inset-[8%] rounded-full border border-cyan-300/50" />
              <div className="absolute inset-[16%] rounded-full border border-violet-300/35" />
            </div>
          </div>

          <CanvasWrapper
            transparent
            interactive={false}
            className={`absolute inset-0 ${Z.canvasFx} h-full w-full`}
            camera={{ position: [0, 1.6, 8.5], fov: 50 }}
            fallback={
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative h-[64%] w-[64%] max-h-[460px] max-w-[460px]">
                  <div className="absolute inset-0 rounded-full border border-cyan-400/35 bg-[radial-gradient(circle_at_32%_30%,rgba(56,189,248,0.4),rgba(2,6,23,0.08)_58%)] shadow-[0_0_80px_rgba(34,211,238,0.22)]" />
                </div>
              </div>
            }
          >
            <ThreatGlobeScene />
          </CanvasWrapper>
        </div>
      </div>

      <div className={`relative ${Z.pageContent} border-t border-cyan-500/10 bg-neural-bg/80 backdrop-blur-md`}>
        <div className="mx-auto grid max-w-5xl grid-cols-4 gap-2 p-3">
          {[
            { label: "Active Agents", value: String(activeAgentCount) },
            { label: "Open Incidents", value: String(incidentCount) },
            { label: "Service Alerts", value: String(threatsBlocked) },
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
    <div className="relative bg-neural-bg pb-16">
      <section className="mx-auto max-w-5xl px-4 py-16">
          <h2 className="font-display text-xl font-bold text-white">Enterprise Risk Domains</h2>
          <p className="mt-2 font-mono text-sm text-slate-500">Cybersecurity · Finance · Compliance · Supply Chain · Operations · Reputation</p>
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
          <h2 className="font-display text-xl font-bold text-white">Enterprise Decision Platform</h2>
          <p className="mt-2 font-mono text-sm text-slate-500">Where AI agents investigate, reason, collaborate, and execute enterprise decisions.</p>
          <NeonButton href="/command-center" size="lg" className="mt-6 font-mono">Enter Operations Center</NeonButton>
        </div>
      </section>
    </div>
  );
}
