import type { CrisisType } from "./types";

export const APP_NAME = "Neural OPS";
export const APP_SUBTITLE =
  "Autonomous Enterprise Security, Investigation & Crisis Command Network";
export const APP_TAGLINE =
  "AI agents investigate threats, coordinate response, review compliance, and drive executive decisions through Band.";

export const CRISIS_TYPES: CrisisType[] = [
  "Data Breach",
  "Ransomware Attack",
  "Insider Threat",
  "Vendor Fraud",
  "Financial Irregularity",
  "Compliance Violation",
  "Service Outage",
  "Product Recall",
  "Brand Reputation Crisis",
  "Cloud Misconfiguration",
  "API Compromise",
  "Credential Leak",
  "Supply Chain Attack",
];

export const NAV_ITEMS = [
  { href: "/", label: "Home", icon: "Home", section: "main" },
  { href: "/command-center", label: "Command Center", icon: "LayoutDashboard", section: "ops" },
  { href: "/investigation", label: "Investigation Room", icon: "MessageSquare", section: "ops" },
  { href: "/evidence", label: "Evidence Graph", icon: "GitBranch", section: "ops" },
  { href: "/voice", label: "Voice Command", icon: "Mic", section: "ops" },
  { href: "/risk-simulation", label: "Risk Simulation", icon: "FlaskConical", section: "intel" },
  { href: "/executive-report", label: "Executive Report", icon: "FileText", section: "intel" },
  { href: "/compliance", label: "Compliance Center", icon: "Shield", section: "intel" },
  { href: "/agents", label: "Agent Architecture", icon: "Network", section: "intel" },
  { href: "/ai-ops", label: "AI Model Ops", icon: "Cpu", section: "system" },
  { href: "/audit", label: "Audit Trail", icon: "ScrollText", section: "system" },
] as const;

export const MODEL_PROVIDERS = [
  { name: "AIML API", color: "cyan", status: "online" },
  { name: "Featherless", color: "violet", status: "online" },
  { name: "Band", color: "emerald", status: "online" },
  { name: "Speechmatics", color: "amber", status: "online" },
] as const;

export const LIVE_STATUSES = {
  awaiting_approval: { label: "Awaiting Human Approval", color: "red" },
  legal_review: { label: "Legal Agent Reviewing", color: "amber" },
  executive_waiting: { label: "Executive Agent Waiting", color: "violet" },
  investigating: { label: "Investigation Active", color: "cyan" },
  risk_simulation: { label: "Risk Simulation Running", color: "amber" },
} as const;

export const EVIDENCE_FILTERS = ["Financial", "Identity", "Compliance", "Communication", "Network", "Legal"] as const;
