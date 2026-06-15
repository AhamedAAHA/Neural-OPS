"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Radio,
  Shield,
  Zap,
  Globe,
  Network,
  Brain,
  FileSearch,
  AlertTriangle,
  TrendingUp,
  Lock,
  Activity,
  ChevronRight,
} from "lucide-react";
import { NeonButton } from "@/components/ui/NeonButton";
import { Scanlines } from "@/components/ui/Scanlines";
import { CyberPanel, CyberBadge } from "@/components/cyber/CyberPanel";
import {
  APP_NAME,
  APP_TAGLINE,
  MODEL_PROVIDERS,
  CRISIS_TYPES,
  NAV_ITEMS,
} from "@/lib/constants";
import { Z } from "@/lib/layers";
import { useNeuralOpsStore } from "@/store/neural-ops";

const CanvasWrapper = dynamic(
  () => import("@/components/3d/CanvasWrapper").then((m) => m.CanvasWrapper),
  { ssr: false }
);
const ThreatGlobeScene = dynamic(
  () => import("@/components/3d/ThreatGlobe").then((m) => m.ThreatGlobeScene),
  { ssr: false }
);

// ─── Nav ────────────────────────────────────────────────────────────────────

function LandingNav() {
  const navLinks = [
    { href: "/command-center", label: "Command Center" },
    { href: "/investigation", label: "Investigation" },
    { href: "/voice", label: "Voice Ops" },
    { href: "/evidence", label: "Evidence" },
    { href: "/compliance", label: "Compliance" },
  ];

  return (
    <nav className={`glass-premium fixed left-0 right-0 top-0 ${Z.landingNav} border-b border-cyan-500/15`}>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded border border-cyan-500/40 bg-cyan-500/10">
            <Radio className="h-3.5 w-3.5 text-cyan-400" />
          </div>
          <span className="font-display text-sm font-bold tracking-wider text-white">
            {APP_NAME}
          </span>
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-mono text-[11px] uppercase tracking-wider text-slate-500 transition-colors hover:text-cyan-400"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <NeonButton
          href="/command-center"
          size="sm"
          className="font-mono text-[10px] uppercase tracking-wider"
        >
          &gt; Launch SOC
        </NeonButton>
      </div>
    </nav>
  );
}

// ─── Hero ────────────────────────────────────────────────────────────────────

function LandingHero() {
  const { activeAgentCount, incidentCount, threatsBlocked, compliancePct } =
    useNeuralOpsStore();

  const stats = [
    { label: "Active Agents", value: String(activeAgentCount) },
    { label: "Open Incidents", value: String(incidentCount) },
    { label: "Service Alerts", value: String(threatsBlocked) },
    { label: "Compliance", value: `${compliancePct}%` },
  ];

  return (
    <section className="relative flex min-h-screen w-full flex-col overflow-hidden">
      <Scanlines className={Z.canvasFx} />

      {/* Ambient glows */}
      <div
        className={`pointer-events-none absolute inset-0 ${Z.canvasFx}`}
        style={{
          background:
            "radial-gradient(ellipse 80% 70% at 65% 40%, rgba(34,211,238,0.07), transparent 55%)",
        }}
      />
      <div
        className={`pointer-events-none absolute inset-0 ${Z.canvasFx}`}
        style={{
          background:
            "radial-gradient(ellipse 50% 50% at 20% 50%, rgba(139,92,246,0.05), transparent 60%)",
        }}
      />

      {/* Hero grid */}
      <div
        className={`relative ${Z.pageContent} mx-auto grid min-h-0 w-full max-w-[1280px] flex-1 grid-cols-1 items-center gap-8 px-6 pb-8 pt-24 lg:grid-cols-2 lg:gap-x-12 lg:px-10 lg:pt-8 xl:max-w-[1360px] xl:gap-x-14`}
      >
        {/* Left copy */}
        <div className={`relative ${Z.pageContent} flex w-full items-center lg:justify-end lg:pr-2 xl:pr-4`}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="w-full max-w-xl text-left"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-500/25 bg-cyan-500/[0.06] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-cyan-400">
              <Radio className="h-3 w-3 animate-pulse" />
              Enterprise Risk &amp; Decision Operating System
            </div>

            <h1 className="font-display text-gradient-cyber mb-4 text-3xl font-bold leading-[1.12] tracking-wide md:text-4xl xl:text-[2.75rem]">
              Autonomous Enterprise Risk &amp; Decision Operating System
            </h1>

            <p className="mb-7 max-w-md font-mono text-sm leading-relaxed text-slate-400">
              {APP_TAGLINE}
            </p>

            <div className="mb-7 flex flex-wrap gap-2">
              {MODEL_PROVIDERS.map((p) => (
                <CyberBadge
                  key={p.name}
                  label={p.name}
                  variant={p.color as "cyan" | "violet" | "emerald" | "amber"}
                  pulse={p.status === "online"}
                />
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <NeonButton
                href="/command-center"
                size="lg"
                className="font-mono uppercase tracking-wider"
              >
                &gt; Enter Operations Center
              </NeonButton>
              <NeonButton
                href="/investigation"
                variant="secondary"
                size="lg"
                className="font-mono uppercase tracking-wider"
              >
                Start Investigation <ArrowRight className="h-4 w-4" />
              </NeonButton>
            </div>
          </motion.div>
        </div>

        {/* Right 3D globe */}
        <div className="relative isolate min-h-[50vh] w-full overflow-hidden lg:min-h-0 lg:h-full lg:pl-2 xl:pl-4">
          <div
            className={`pointer-events-none absolute inset-0 ${Z.canvasFx} flex items-center justify-center`}
          >
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

      {/* Stats bar */}
      <div
        className={`relative ${Z.pageContent} border-t border-cyan-500/10 bg-neural-bg/80 backdrop-blur-md`}
      >
        <div className="mx-auto grid max-w-5xl grid-cols-4 gap-2 p-3">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-display text-xl font-bold text-cyan-300">
                {stat.value}
              </div>
              <div className="font-mono text-[10px] font-medium uppercase tracking-wider text-slate-500">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Capabilities Section ────────────────────────────────────────────────────

const CAPABILITIES = [
  {
    icon: Brain,
    title: "Multi-Agent AI Orchestration",
    desc: "Coordinated AI agents investigate, reason, and execute across every risk domain simultaneously.",
    color: "cyan" as const,
  },
  {
    icon: Shield,
    title: "Real-Time Threat Detection",
    desc: "Live threat intelligence feeds power autonomous detection, triage, and response workflows.",
    color: "violet" as const,
  },
  {
    icon: FileSearch,
    title: "Evidence & Investigation",
    desc: "Graph-based evidence correlation connects digital artifacts across network, identity, and compliance layers.",
    color: "emerald" as const,
  },
  {
    icon: TrendingUp,
    title: "Executive Intelligence",
    desc: "Board-ready risk narratives generated from live data, surfaced to decision-makers in real time.",
    color: "amber" as const,
  },
  {
    icon: Globe,
    title: "Vendor Intelligence",
    desc: "Bright Data-powered OSINT automatically profiles vendors, monitors supply chains, and flags anomalies.",
    color: "cyan" as const,
  },
  {
    icon: Lock,
    title: "Compliance Automation",
    desc: "Continuous monitoring against SOC 2, ISO 27001, GDPR, and custom frameworks with zero manual effort.",
    color: "violet" as const,
  },
];

function CapabilitiesSection() {
  return (
    <section className="relative mx-auto max-w-6xl px-4 py-20">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.55 }}
        className="mb-10 text-center"
      >
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-500/25 bg-violet-500/[0.06] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-violet-400">
          <Zap className="h-3 w-3" />
          Platform Capabilities
        </div>
        <h2 className="font-display text-2xl font-bold text-white md:text-3xl">
          Every Risk Domain. One Platform.
        </h2>
        <p className="mx-auto mt-3 max-w-lg font-mono text-sm text-slate-500">
          Neural OPS unifies cybersecurity, compliance, finance, and supply chain risk into a single AI-native operating system.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {CAPABILITIES.map((cap, i) => (
          <motion.div
            key={cap.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.07, duration: 0.5 }}
          >
            <CyberPanel glow={cap.color} hover className="h-full">
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
                    cap.color === "cyan"
                      ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-400"
                      : cap.color === "violet"
                      ? "border-violet-500/30 bg-violet-500/10 text-violet-400"
                      : cap.color === "emerald"
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      : "border-amber-500/30 bg-amber-500/10 text-amber-400"
                  }`}
                >
                  <cap.icon className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-200">
                    {cap.title}
                  </h3>
                  <p className="mt-1.5 font-mono text-[11px] leading-relaxed text-slate-500">
                    {cap.desc}
                  </p>
                </div>
              </div>
            </CyberPanel>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ─── Risk Domains ────────────────────────────────────────────────────────────

function RiskDomainsSection() {
  return (
    <section className="border-y border-cyan-500/10 bg-neural-panel/30 py-16">
      <div className="mx-auto max-w-5xl px-4">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-8 text-center"
        >
          <h2 className="font-display text-xl font-bold text-white">
            Enterprise Risk Domains
          </h2>
          <p className="mt-2 font-mono text-sm text-slate-500">
            Cybersecurity · Finance · Compliance · Supply Chain · Operations · Reputation
          </p>
        </motion.div>

        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-5">
          {CRISIS_TYPES.map((type, i) => (
            <motion.div
              key={type}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
            >
              <CyberPanel compact className="group cursor-default text-center transition-all hover:border-cyan-400/30">
                <div className="flex items-center justify-center gap-1.5">
                  <AlertTriangle className="h-2.5 w-2.5 shrink-0 text-cyan-600 group-hover:text-cyan-400 transition-colors" />
                  <span className="font-mono text-[10px] text-slate-400 group-hover:text-slate-300 transition-colors">
                    {type}
                  </span>
                </div>
              </CyberPanel>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Module Grid ─────────────────────────────────────────────────────────────

const MODULE_HIGHLIGHTS = NAV_ITEMS.filter((n) =>
  [
    "/command-center",
    "/investigation",
    "/decision-war-room",
    "/intelligence",
    "/risk-simulation",
    "/compliance",
    "/agents",
    "/voice",
  ].includes(n.href)
);

function ModuleGridSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-10 text-center"
      >
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-500/25 bg-cyan-500/[0.06] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-cyan-400">
          <Network className="h-3 w-3" />
          Operations Modules
        </div>
        <h2 className="font-display text-2xl font-bold text-white">
          A Module for Every Mission
        </h2>
        <p className="mx-auto mt-3 max-w-lg font-mono text-sm text-slate-500">
          Navigate directly to any operational layer — from live incident command to long-range executive intelligence.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {MODULE_HIGHLIGHTS.map((mod, i) => (
          <motion.div
            key={mod.href}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
          >
            <Link href={mod.href} className="group block">
              <CyberPanel hover className="h-full transition-all group-hover:border-cyan-400/35 group-hover:shadow-[0_0_24px_rgba(34,211,238,0.12)]">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-cyan-500/70">
                      {mod.section}
                    </div>
                    <h3 className="font-mono text-xs font-semibold text-slate-200 group-hover:text-white transition-colors">
                      {mod.label}
                    </h3>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-600 transition-transform group-hover:translate-x-0.5 group-hover:text-cyan-400" />
                </div>
              </CyberPanel>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ─── Live Metrics Banner ──────────────────────────────────────────────────────

function LiveMetricsBanner() {
  const { riskScore, activeAgentCount, bandConnected, aimlLatency } =
    useNeuralOpsStore();

  const metrics = [
    {
      icon: Activity,
      label: "System Status",
      value: bandConnected ? "OPERATIONAL" : "DEGRADED",
      color: bandConnected ? "text-emerald-400" : "text-red-400",
    },
    {
      icon: Brain,
      label: "Active Agents",
      value: String(activeAgentCount),
      color: "text-cyan-400",
    },
    {
      icon: AlertTriangle,
      label: "Risk Score",
      value: `${riskScore}/100`,
      color: riskScore > 60 ? "text-red-400" : riskScore > 30 ? "text-amber-400" : "text-emerald-400",
    },
    {
      icon: Zap,
      label: "AI Latency",
      value: `${aimlLatency}ms`,
      color: "text-violet-400",
    },
  ];

  return (
    <section className="border-y border-cyan-500/10 bg-neural-bg/60 py-8 backdrop-blur-sm">
      <div className="mx-auto max-w-4xl px-4">
        <p className="mb-4 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-slate-600">
          Live System Telemetry
        </p>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {metrics.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <CyberPanel compact className="text-center">
                <m.icon className={`mx-auto mb-1.5 h-4 w-4 ${m.color}`} />
                <div className={`font-display text-lg font-bold ${m.color}`}>
                  {m.value}
                </div>
                <div className="font-mono text-[9px] uppercase tracking-wider text-slate-600">
                  {m.label}
                </div>
              </CyberPanel>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA Section ─────────────────────────────────────────────────────────────

function CTASection() {
  return (
    <section className="relative overflow-hidden py-24">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(34,211,238,0.07), transparent 65%)",
        }}
      />
      <div className="relative mx-auto max-w-3xl px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-600">
            Deployment Ready
          </div>
          <h2 className="font-display mb-4 text-3xl font-bold text-white md:text-4xl">
            Enterprise Decision Platform
          </h2>
          <p className="mx-auto mb-8 max-w-lg font-mono text-sm leading-relaxed text-slate-500">
            Where AI agents investigate, reason, collaborate, and execute enterprise decisions — with full auditability and human oversight.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <NeonButton
              href="/command-center"
              size="lg"
              className="font-mono uppercase tracking-wider"
            >
              Enter Operations Center
            </NeonButton>
            <NeonButton
              href="/overview"
              variant="ghost"
              size="lg"
              className="font-mono uppercase tracking-wider"
            >
              Platform Overview
            </NeonButton>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Footer ──────────────────────────────────────────────────────────────────

function LandingFooter() {
  return (
    <footer className="border-t border-cyan-500/10 bg-neural-bg/80 py-8 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 md:flex-row">
        <div className="flex items-center gap-2">
          <Radio className="h-3.5 w-3.5 text-cyan-500" />
          <span className="font-display text-sm font-bold tracking-wider text-slate-400">
            {APP_NAME}
          </span>
        </div>
        <p className="font-mono text-[10px] text-slate-700">
          Autonomous Enterprise Risk &amp; Decision Operating System
        </p>
        <div className="flex items-center gap-4">
          {["/audit", "/compliance", "/ai-ops"].map((href) => (
            <Link
              key={href}
              href={href}
              className="font-mono text-[10px] uppercase tracking-wider text-slate-700 transition hover:text-slate-400"
            >
              {href.replace("/", "")}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}

// ─── Page Export ─────────────────────────────────────────────────────────────

export function LandingPage() {
  return (
    <div className="relative min-h-screen w-full overflow-y-auto overflow-x-hidden">
      <LandingNav />
      <LandingHero />
      <CapabilitiesSection />
      <RiskDomainsSection />
      <LiveMetricsBanner />
      <ModuleGridSection />
      <CTASection />
      <LandingFooter />
    </div>
  );
}
