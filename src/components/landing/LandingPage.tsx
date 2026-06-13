"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { ArrowRight, Radio, Shield, Users, GitBranch, CheckCircle, FileText, Award } from "lucide-react";
import { NeonButton } from "@/components/ui/NeonButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { Scanlines } from "@/components/ui/Scanlines";
import { CRISIS_TYPES, APP_TAGLINE } from "@/lib/constants";

const CanvasWrapper = dynamic(() => import("@/components/3d/CanvasWrapper").then((m) => m.CanvasWrapper), { ssr: false });
const ThreatGlobeScene = dynamic(() => import("@/components/3d/ThreatGlobe").then((m) => m.ThreatGlobeScene), { ssr: false });

export function LandingHero() {
  return (
    <section className="relative flex min-h-screen flex-col overflow-hidden">
      <Scanlines />

      <div className="absolute inset-0 z-0">
        <CanvasWrapper className="h-full w-full" camera={{ position: [0, 1, 10], fov: 45 }}>
          <ThreatGlobeScene />
        </CanvasWrapper>
        <div className="absolute inset-0 bg-gradient-to-t from-neural-bg via-neural-bg/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-neural-bg/80 via-transparent to-neural-bg/80" />
      </div>

      <div className="relative z-20 flex flex-1 flex-col items-center justify-center px-6 pt-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs text-cyan-400">
            <Radio className="h-3 w-3 animate-pulse" />
            Band Multi-Agent Command Network · Track 3
          </div>

          <h1 className="mb-4 text-4xl font-bold leading-tight tracking-tight text-white md:text-6xl neon-text-cyan">
            Autonomous Enterprise Crisis Investigation Network
          </h1>

          <p className="mx-auto mb-8 max-w-2xl text-lg text-slate-400">{APP_TAGLINE}</p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <NeonButton href="/command-center" size="lg">
              Launch Command Center <ArrowRight className="h-4 w-4" />
            </NeonButton>
            <NeonButton href="/investigation" variant="secondary" size="lg">
              Start Investigation
            </NeonButton>
          </div>
        </motion.div>
      </div>

      <div className="relative z-20 border-t border-white/5 bg-neural-bg/80 backdrop-blur-sm">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 p-6 md:grid-cols-4">
          {[
            { label: "Active Agents", value: "12" },
            { label: "Incidents Today", value: "3" },
            { label: "Threats Contained", value: "847" },
            { label: "Compliance Score", value: "94%" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl font-bold text-cyan-400">{stat.value}</div>
              <div className="text-xs text-slate-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LandingSections() {
  return (
    <div className="relative z-10 bg-neural-bg">
      {/* Crisis Types */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <SectionHeader icon={Shield} title="Supported Crisis Types" subtitle="Enterprise-grade response for every threat category" />
        <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {CRISIS_TYPES.map((type, i) => (
            <motion.div
              key={type}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <GlassCard hover className="p-4 text-center">
                <div className="text-sm font-medium text-slate-300">{type}</div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Multi-agent Architecture */}
      <section className="border-y border-white/5 bg-neural-panel/30 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <SectionHeader icon={Users} title="Multi-Agent Architecture" subtitle="Five tiers of specialized autonomous agents" />
          <div className="mt-10 grid gap-4 md:grid-cols-5">
            {[
              { tier: "Detection", color: "cyan", count: 3 },
              { tier: "Investigation", color: "violet", count: 6 },
              { tier: "Intelligence", color: "emerald", count: 4 },
              { tier: "Governance", color: "red", count: 3 },
              { tier: "Response", color: "violet", count: 4 },
            ].map((t) => (
              <GlassCard key={t.tier} glow={t.color as "cyan" | "violet" | "red" | "emerald"} className="p-5 text-center">
                <div className="mb-2 text-3xl font-bold text-white">{t.count}</div>
                <div className="text-sm font-medium text-slate-300">{t.tier}</div>
                <div className="mt-1 text-xs text-slate-500">Agents</div>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* Band Workflow */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <SectionHeader icon={GitBranch} title="Band Collaboration Workflow" subtitle="Agents communicate, recruit, and coordinate autonomously" />
        <div className="mt-10 space-y-3">
          {[
            "Incident Commander creates investigation room",
            "Specialist agents recruited via Band",
            "Evidence shared through structured messages",
            "Compliance and legal agents review findings",
            "Risk simulation compares response options",
            "Human approval for critical actions",
            "Executive report generated with full audit trail",
          ].map((step, i) => (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-4"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-cyan-500/30 bg-cyan-500/10 text-xs font-bold text-cyan-400">
                {i + 1}
              </div>
              <GlassCard className="flex-1 px-4 py-3">
                <span className="text-sm text-slate-300">{step}</span>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Investigation Lifecycle */}
      <section className="border-y border-white/5 bg-neural-panel/30 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <SectionHeader icon={CheckCircle} title="Security Investigation Lifecycle" subtitle="End-to-end incident management" />
          <div className="mt-10 flex flex-wrap justify-center gap-2">
            {["Detect", "Investigate", "Correlate", "Simulate", "Govern", "Approve", "Respond", "Audit"].map((phase, i) => (
              <div key={phase} className="flex items-center gap-2">
                <span className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">{phase}</span>
                {i < 7 && <ArrowRight className="h-4 w-4 text-cyan-500/50" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Human Approval */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <SectionHeader icon={Shield} title="Human Approval Layer" subtitle="Critical decisions require executive authorization" />
        <GlassCard glow="red" className="mx-auto max-w-2xl p-6">
          <div className="mb-4 font-mono text-xs text-red-400">CRITICAL ACTION REQUIRES APPROVAL</div>
          <div className="space-y-2 text-sm">
            <div><span className="text-slate-500">Action:</span> <span className="text-white">Freeze vendor payments and notify stakeholders</span></div>
            <div><span className="text-slate-500">Risk:</span> <span className="text-red-400">HIGH</span></div>
            <div><span className="text-slate-500">Agent Recommendation:</span> <span className="text-emerald-400">Approve</span></div>
          </div>
          <div className="mt-4 flex gap-3">
            <NeonButton size="sm">Approve</NeonButton>
            <NeonButton variant="danger" size="sm">Reject</NeonButton>
            <NeonButton variant="secondary" size="sm">Escalate</NeonButton>
          </div>
        </GlassCard>
      </section>

      {/* Executive Report Preview */}
      <section className="border-y border-white/5 bg-neural-panel/30 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <SectionHeader icon={FileText} title="Executive Report Preview" subtitle="Polished decision-ready intelligence" />
          <GlassCard className="mt-10 p-6">
            <div className="grid gap-6 md:grid-cols-3">
              <div>
                <div className="mb-2 text-xs text-slate-500">Incident</div>
                <div className="font-semibold text-white">Vendor ABC Suspected Fraud</div>
                <div className="mt-1 text-sm text-red-400">Risk Score: 87/100</div>
              </div>
              <div>
                <div className="mb-2 text-xs text-slate-500">Financial Impact</div>
                <div className="font-semibold text-white">$2.4M exposure</div>
                <div className="mt-1 text-sm text-slate-400">Fraud probability: 91%</div>
              </div>
              <div>
                <div className="mb-2 text-xs text-slate-500">Recommendation</div>
                <div className="font-semibold text-emerald-400">Freeze payments + forensic audit</div>
                <NeonButton href="/executive-report" size="sm" className="mt-2">View Full Report</NeonButton>
              </div>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* Track 3 */}
      <section className="mx-auto max-w-6xl px-6 py-24 text-center">
        <Award className="mx-auto mb-4 h-12 w-12 text-violet-400" />
        <h2 className="mb-2 text-2xl font-bold text-white">Track 3: Regulated & High-Stakes Workflows</h2>
        <p className="mx-auto mb-8 max-w-xl text-slate-400">
          Built for enterprise security, compliance, and crisis management where human oversight and audit trails are mandatory.
        </p>
        <NeonButton href="/command-center" size="lg">
          Enter Command Center <ArrowRight className="h-4 w-4" />
        </NeonButton>
      </section>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle }: { icon: React.ComponentType<{ className?: string }>; title: string; subtitle: string }) {
  return (
    <div className="text-center">
      <Icon className="mx-auto mb-3 h-8 w-8 text-cyan-400" />
      <h2 className="text-2xl font-bold text-white md:text-3xl">{title}</h2>
      <p className="mt-2 text-slate-400">{subtitle}</p>
    </div>
  );
}
