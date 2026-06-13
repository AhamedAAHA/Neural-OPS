"use client";

import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";
import { StatusBar } from "@/components/cyber/CyberPanel";
import { useNeuralOpsStore } from "@/store/neural-ops";

interface AppShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  fullWidth?: boolean;
  statusItems?: { label: string; value: string; color?: string }[];
}

export function AppShell({ title, subtitle, children, fullWidth, statusItems }: AppShellProps) {
  const { riskScore, activeAgentCount, bandConnected, tokenUsage, aimlLatency } = useNeuralOpsStore();

  const defaultStatus = [
    { label: "BAND", value: bandConnected ? "CONNECTED" : "OFFLINE", color: "text-emerald-400" },
    { label: "AGENTS", value: String(activeAgentCount), color: "text-cyan-300" },
    { label: "RISK", value: `${riskScore}/100`, color: "text-red-400" },
    { label: "AIML", value: `${aimlLatency}ms`, color: "text-violet-300" },
    { label: "TOKENS", value: tokenUsage.toLocaleString(), color: "text-slate-300" },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-neural-bg">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopNav title={title} subtitle={subtitle} />
        <main className={fullWidth ? "min-h-0 flex-1 overflow-hidden" : "min-h-0 flex-1 overflow-y-auto p-3"}>
          {children}
        </main>
        <StatusBar items={statusItems ?? defaultStatus} />
      </div>
    </div>
  );
}
