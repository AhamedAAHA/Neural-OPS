"use client";

import { Bell, Search, User, Activity, Play, Loader2 } from "lucide-react";
import { DEMO_INCIDENT } from "@/lib/mock-data";
import { CyberBadge } from "@/components/cyber/CyberPanel";
import { NeonButton } from "@/components/ui/NeonButton";
import { useNeuralOpsStore } from "@/store/neural-ops";
import { useRunLiveDemo } from "@/providers/DemoRealtimeProvider";
import { LIVE_STATUSES } from "@/lib/constants";

interface TopNavProps {
  title: string;
  subtitle?: string;
}

export function TopNav({ title, subtitle }: TopNavProps) {
  const { liveStatus, demoRunning, incidentCount } = useNeuralOpsStore();
  const runLiveDemo = useRunLiveDemo();
  const status = LIVE_STATUSES[liveStatus as keyof typeof LIVE_STATUSES];

  return (
    <header className="glass-premium flex h-11 shrink-0 items-center justify-between border-b border-cyan-500/15 px-4">
      <div className="flex min-w-0 items-center gap-4">
        <div className="min-w-0">
          <h1 className="font-display truncate text-sm font-semibold tracking-wide text-white">{title}</h1>
          {subtitle && <p className="truncate font-mono text-[11px] text-slate-400">{subtitle}</p>}
        </div>
        {status && (
          <CyberBadge
            label={status.label}
            variant={status.color as "red" | "amber" | "violet" | "cyan"}
            pulse
          />
        )}
      </div>

      <div className="flex items-center gap-2">
        <NeonButton
          size="sm"
          variant={demoRunning ? "secondary" : "primary"}
          onClick={runLiveDemo}
          disabled={demoRunning}
          className="hidden font-mono text-[10px] uppercase tracking-wider sm:flex"
        >
          {demoRunning ? (
            <>
              <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
              Demo Running
            </>
          ) : (
            <>
              <Play className="mr-1.5 h-3 w-3" />
              Run Live Demo
            </>
          )}
        </NeonButton>
        <CyberBadge label={DEMO_INCIDENT.id} variant="red" />
        <div className="hidden items-center gap-1 font-mono text-[11px] font-medium text-slate-400 md:flex">
          <Activity className="h-3 w-3 text-emerald-400" />
          LIVE · {incidentCount} incidents
        </div>
        <button type="button" className="rounded border border-transparent p-1.5 text-slate-500 transition hover:border-cyan-500/20 hover:text-cyan-400">
          <Search className="h-3.5 w-3.5" />
        </button>
        <button type="button" className="relative rounded border border-transparent p-1.5 text-slate-500 transition hover:border-cyan-500/20 hover:text-cyan-400">
          <Bell className="h-3.5 w-3.5" />
          <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-red-500" />
        </button>
        <div className="flex h-7 w-7 items-center justify-center rounded border border-cyan-500/20 bg-cyan-500/5">
          <User className="h-3.5 w-3.5 text-cyan-400" />
        </div>
      </div>
    </header>
  );
}
