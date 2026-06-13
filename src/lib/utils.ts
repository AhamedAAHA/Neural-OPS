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
  switch (type) {
    case "EVIDENCE_SUBMISSION":
      return "border-violet-500/50 bg-violet-500/10";
    case "APPROVAL_REQUEST":
      return "border-red-500/50 bg-red-500/10";
    case "AGENT_RECRUITMENT":
      return "border-cyan-500/50 bg-cyan-500/10";
    case "RISK_UPDATE":
      return "border-orange-500/50 bg-orange-500/10";
    case "DECISION":
      return "border-emerald-500/50 bg-emerald-500/10";
    default:
      return "border-cyan-500/30 bg-cyan-500/5";
  }
}
