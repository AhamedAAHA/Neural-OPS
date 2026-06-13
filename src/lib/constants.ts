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
  { href: "/", label: "Home", icon: "Home" },
  { href: "/command-center", label: "Command Center", icon: "LayoutDashboard" },
  { href: "/investigation", label: "Investigation Room", icon: "MessageSquare" },
  { href: "/evidence", label: "Evidence Graph", icon: "GitBranch" },
  { href: "/risk-simulation", label: "Risk Simulation", icon: "FlaskConical" },
  { href: "/executive-report", label: "Executive Report", icon: "FileText" },
  { href: "/compliance", label: "Compliance Center", icon: "Shield" },
  { href: "/agents", label: "Agent Architecture", icon: "Network" },
] as const;
