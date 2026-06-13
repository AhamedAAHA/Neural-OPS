import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function severityColor(severity: string): string {
  switch (severity) {
    case "critical":
      return "text-red-400";
    case "high":
      return "text-orange-400";
    case "medium":
      return "text-yellow-400";
    default:
      return "text-emerald-400";
  }
}

export function severityBg(severity: string): string {
  switch (severity) {
    case "critical":
      return "bg-red-500/20 border-red-500/40 text-red-300";
    case "high":
      return "bg-orange-500/20 border-orange-500/40 text-orange-300";
    case "medium":
      return "bg-yellow-500/20 border-yellow-500/40 text-yellow-300";
    default:
      return "bg-emerald-500/20 border-emerald-500/40 text-emerald-300";
  }
}

export function messageTypeColor(type: string): string {
  const base = "glass-packet ";
  switch (type) {
    case "EVIDENCE_SUBMISSION":
      return `${base}border-violet-500/40 shadow-[0_0_12px_rgba(139,92,246,0.08)]`;
    case "APPROVAL_REQUEST":
      return `${base}border-red-500/40 shadow-[0_0_12px_rgba(239,68,68,0.08)]`;
    case "AGENT_RECRUITMENT":
      return `${base}border-cyan-500/40 shadow-[0_0_12px_rgba(34,211,238,0.08)]`;
    case "RISK_UPDATE":
      return `${base}border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.08)]`;
    case "DECISION":
      return `${base}border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.08)]`;
    default:
      return `${base}border-cyan-500/25`;
  }
}
