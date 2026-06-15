"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Radio,
  Shield,
  Zap,
  Network,
  Brain,
  FileSearch,
  AlertTriangle,
  TrendingUp,
  Lock,
  Activity,
  ChevronRight,
  LogIn,
  UserPlus,
  Terminal,
} from "lucide-react";
import { NeonButton } from "@/components/ui/NeonButton";
import { Scanlines } from "@/components/ui/Scanlines";
import { CyberPanel } from "@/components/cyber/CyberPanel";
import {
  APP_NAME,
  APP_TAGLINE,
  CRISIS_TYPES,
  NAV_ITEMS,
} from "@/lib/constants";
import { Z } from "@/lib/layers";
import { useEffect, useState } from "react";

// ─── Threat Terminal Visual (replaces globe) ─────────────────────────────────

const THREAT_FEED = [
  { tag: "DETECT", msg: "Lateral movement signature — 192.168.44.12", color: "text-red-400" },
  { tag: "AGENT", msg: "Forensic agent initialised on endpoint-07", color: "text-cyan-400" },
  { tag: "RISK", msg: "Compliance drift — SOC2 CC6.1 partial fail", color: "text-amber-400" },
  { tag: "INTEL", msg: "Vendor ThreatScore updated: +14 → HIGH", color: "text-violet-400" },
  { tag: "DETECT", msg: "API auth anomaly: 312 failed attempts / 5m", color: "text-red-400" },
  { tag: "AGENT", msg: "Evidence graph — 43 nodes correlated", color: "text-cyan-400" },
  { tag: "EXEC", msg: "Board-ready report generated: Q2 risk delta", color: "text-emerald-400" },
  { tag: "RISK", msg: "Financial exposure recalculated: $2.1M", color: "text-amber-400" },
  { tag: "DETECT", msg: "Credential spray blocked — 10.0.2.91", color: "text-red-400" },
  { tag: "AGENT", msg: "Workflow automation triggered: IR-2024-311", color: "text-cyan-400" },
  { tag: "INTEL", msg: "Supply chain alert: 2 vendors flagged OSINT", color: "text-violet-400" },
  { tag: "EXEC", msg: "Decision War Room consensus: escalate to legal", color: "text-emerald-400" },
];

const TAG_COLORS: Record<string, string> = {
  DETECT: "bg-red-500/15 text-red-400 border-red-500/25",
  AGENT: "bg-cyan-500/15 text-cyan-400 border-cyan-500/25",
  RISK: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  INTEL: "bg-violet-500/15 text-violet-400 border-violet-500/25",
  EXEC: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
};

function ThreatTerminal() {
  const [visibleLines, setVisibleLines] = useState<number>(0);
  const [cursor, setCursor] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setVisibleLines((v) => {
        if (v >= THREAT_FEED.length) {
          // Cycle: reset after showing all
          setTimeout(() => setVisibleLines(0), 2200);
          return v;
        }
        return v + 1;
      });
    }, 680);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const blink = setInterval(() => setCursor((c) => !c), 530);
    return () => clearInterval(blink);
  }, []);

  return (
    <div className="relative h-full w-full">
      {/* Terminal window chrome */}
      <div className="flex h-full flex-col rounded-xl border border-cyan-500/20 bg-slate-950/90 font-mono text-[11px] shadow-[0_0_60px_rgba(34,211,238,0.08)]">
        {/* Title bar */}
        <div className="flex items-center gap-2 border-b border-slate-800/80 px-4 py-2.5">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
            <div className="h-2.5 w-2.5 rounded-full bg-amber-500/60" />
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/60" />
          </div>
          <div className="mx-auto flex items-center gap-1.5 text-slate-500">
            <Terminal className="h-3 w-3" />
            <span className="tracking-wider">neural-ops://threat-stream</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="animate-pulse text-emerald-400">●</span>
            <span className="text-slate-600">LIVE</span>
          </div>
        </div>

        {/* Feed lines */}
        <div className="flex flex-1 flex-col gap-0 overflow-hidden p-4">
          <div className="mb-3 text-slate-600">
            <span className="text-cyan-600">root@neural-ops</span>
            <span className="text-slate-600">:</span>
            <span className="text-violet-500">~/soc</span>
            <span className="text-slate-400"> $ </span>
            <span className="text-slate-300">watch --live threat-stream</span>
          </div>

          <div className="flex flex-col gap-1.5">
            {THREAT_FEED.slice(0, visibleLines).map((line, i) => (
              <motion.div
                key={`${i}-${line.tag}`}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-start gap-2"
              >
                <span
                  className={`mt-px shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${TAG_COLORS[line.tag] ?? "bg-slate-800 text-slate-400 border-slate-700"}`}
                >
                  {line.tag}
                </span>
                <span className={`leading-relaxed ${line.color}`}>{line.msg}</span>
              </motion.div>
            ))}

            {/* Cursor line */}
            <div className="flex items-center gap-1 text-slate-600">
              <span className="text-cyan-600">$</span>
              <span
                className="inline-block h-[13px] w-[7px] bg-cyan-400"
                style={{ opacity: cursor ? 0.85 : 0, transition: "opacity 0.1s" }}
              />
            </div>
          </div>
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between border-t border-slate-800/80 px-4 py-2 text-[9px] text-slate-600">
          <span>12 agents active</span>
          <span className="text-emerald-500">SYSTEM NOMINAL</span>
          <span>uptime 99.98%</span>
        </div>
      </div>

      {/* Glow behind terminal */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 rounded-xl"
        style={{
          background: "radial-gradient(ellipse 80% 80% at 50% 50%, rgba(34,211,238,0.06), transparent 70%)",
        }}
      />
    </div>
  );
}

// ─── Nav ─────────────────────────────────────────────────────────────────────

function LandingNav() {
  const navLinks = [
    { href: "/command-center", label: "Command Center" },
    { href: "/investigation", label: "Investigation" },
    { href: "/voice", label: "Voice Ops" },
    { href: "/evidence", label: "Evidence" },
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

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="flex items-center gap-1.5 rounded-md border border-slate-700/70 bg-slate-900/60 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-slate-400 transition-colors hover:border-cyan-500/40 hover:text-cyan-400"
          >
            <LogIn className="h-3 w-3" />
            Sign In
          </Link>
          <NeonButton
            href="/signup"
            size="sm"
            className="font-mono text-[10px] uppercase tracking-wider"
          >
            <UserPlus className="h-3 w-3" />
            Sign Up
          </NeonButton>
        </div>
      </div>
    </nav>
  );
}

// ─── Hero ────────────────────────────────────────────────────────────────────

function LandingHero() {
  return (
    <section className="relative flex min-h-screen w-full flex-col overflow-hidden">
      <Scanlines className={Z.canvasFx} />

      <div
        className={`relative ${Z.pageContent} mx-auto grid min-h-0 w-full max-w-[1280px] flex-1 grid-cols-1 items-center gap-8 px-6 pb-8 pt-24 lg:grid-cols-2 lg:gap-x-12 lg:px-10 lg:pt-8 xl:max-w-[1360px] xl:gap-x-14`}
      >
        {/* Left copy */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="w-full max-w-xl"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-500/25 bg-cyan-500/[0.06] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-cyan-400">
            <Radio className="h-3 w-3 animate-pulse" />
            Enterprise Risk &amp; Decision Operating System
          </div>

          <h1 className="font-display text-gradient-cyber mb-4 text-3xl font-bold leading-[1.12] tracking-wide md:text-4xl xl:text-[2.75rem]">
            Autonomous Enterprise Risk &amp; Decision Operating System
          </h1>

          <p className="mb-8 max-w-md font-mono text-sm leading-relaxed text-slate-400">
            {APP_TAGLINE}
          </p>

          <div className="flex flex-wrap gap-3">
            <NeonButton
              href="/signup"
              size="lg"
              className="font-mono uppercase tracking-wider"
            >
              <UserPlus className="h-4 w-4" />
              Get Started Free
            </NeonButton>
            <NeonButton
              href="/login"
              variant="secondary"
              size="lg"
              className="font-mono uppercase tracking-wider"
            >
              Sign In <ArrowRight className="h-4 w-4" />
            </NeonButton>
          </div>

          <p className="mt-4 font-mono text-[10px] text-slate-600">
            No credit card required &middot; Enterprise SSO available on request
          </p>
        </motion.div>

        {/* Right: Threat Terminal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
          className="relative h-[480px] w-full lg:h-[520px]"
        >
          <ThreatTerminal />
        </motion.div>
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
    icon: Activity,
    title: "Vendor Intelligence",
    desc: "OSINT-powered profiling automatically monitors supply chains and flags anomalies at scale.",
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

// ─── Risk Domains ─────────────────────────────────────────────────────────────

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
                  <AlertTriangle className="h-2.5 w-2.5 shrink-0 text-cyan-600 transition-colors group-hover:text-cyan-400" />
                  <span className="font-mono text-[10px] text-slate-400 transition-colors group-hover:text-slate-300">
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

// ─── Module Grid ──────────────────────────────────────────────────────────────

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
                    <h3 className="font-mono text-xs font-semibold text-slate-200 transition-colors group-hover:text-white">
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

// ─── CTA ──────────────────────────────────────────────────────────────────────

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
            Start Your Free Account
          </h2>
          <p className="mx-auto mb-8 max-w-lg font-mono text-sm leading-relaxed text-slate-500">
            Where AI agents investigate, reason, collaborate, and execute enterprise decisions — with full auditability and human oversight.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <NeonButton href="/signup" size="lg" className="font-mono uppercase tracking-wider">
              <UserPlus className="h-4 w-4" />
              Create Free Account
            </NeonButton>
            <NeonButton href="/login" variant="secondary" size="lg" className="font-mono uppercase tracking-wider">
              Sign In <ArrowRight className="h-4 w-4" />
            </NeonButton>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function LandingFooter() {
  return (
    <footer className="border-t border-cyan-500/10 py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 md:flex-row">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded border border-cyan-500/30 bg-cyan-500/10">
            <Radio className="h-3 w-3 text-cyan-500" />
          </div>
          <span className="font-mono text-xs font-semibold text-slate-400">{APP_NAME}</span>
        </div>
        <p className="font-mono text-[10px] text-slate-600">
          Enterprise Risk &amp; Decision Operating System
        </p>
        <div className="flex gap-4">
          <Link href="/login" className="font-mono text-[10px] text-slate-600 transition-colors hover:text-cyan-400">Sign In</Link>
          <Link href="/signup" className="font-mono text-[10px] text-slate-600 transition-colors hover:text-cyan-400">Sign Up</Link>
        </div>
      </div>
    </footer>
  );
}

// ─── Root Export ──────────────────────────────────────────────────────────────

export function LandingPage() {
  return (
    <main className={`relative ${Z.pageContent} min-h-screen`}>
      <LandingNav />
      <LandingHero />
      <CapabilitiesSection />
      <RiskDomainsSection />
      <ModuleGridSection />
      <CTASection />
      <LandingFooter />
    </main>
  );
}
