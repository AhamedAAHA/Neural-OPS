"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  LayoutDashboard,
  MessageSquare,
  GitBranch,
  FlaskConical,
  FileText,
  Shield,
  Network,
  Radio,
  Mic,
  Cpu,
  ScrollText,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_NAME, NAV_ITEMS } from "@/lib/constants";
import { useNeuralOpsStore } from "@/store/neural-ops";

const iconMap = {
  Home,
  LayoutDashboard,
  MessageSquare,
  GitBranch,
  FlaskConical,
  FileText,
  Shield,
  Network,
  Mic,
  Cpu,
  ScrollText,
};

const sections = [
  { key: "main", label: null },
  { key: "ops", label: "Operations" },
  { key: "intel", label: "Intelligence" },
  { key: "system", label: "System" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { bandConnected, activeAgentCount, riskScore, demoFeatures } = useNeuralOpsStore();
  const doneCount = demoFeatures.filter((f) => f.done).length;

  return (
    <aside className="glass-premium flex h-full w-[220px] shrink-0 flex-col border-r border-cyan-500/15">
      <div className="border-b border-cyan-500/10 px-4 py-3">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="relative flex h-8 w-8 items-center justify-center rounded border border-cyan-500/30 bg-cyan-500/10">
            <Radio className="h-4 w-4 text-cyan-400" />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          </div>
          <div className="min-w-0">
            <div className="font-display truncate text-xs font-bold tracking-wider text-white">{APP_NAME}</div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-cyan-400/80">SOC · Track 3</div>
          </div>
        </Link>
      </div>

      <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto px-2 py-2">
        {sections.map((section) => {
          const items = NAV_ITEMS.filter((i) => i.section === section.key);
          if (!items.length) return null;
          return (
            <div key={section.key} className="mb-3">
              {section.label && (
                <div className="mb-1 px-2 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500">
                  {section.label}
                </div>
              )}
              <div className="space-y-0.5">
                {items.map((item) => {
                  const Icon = iconMap[item.icon as keyof typeof iconMap];
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "group flex items-center gap-2.5 rounded-md px-2.5 py-2 font-mono text-[11px] transition-all",
                        active
                          ? "glow-active bg-cyan-500/10 text-cyan-300"
                          : "text-slate-400 hover:bg-white/[0.03] hover:text-slate-200"
                      )}
                    >
                      <Icon className={cn("h-3.5 w-3.5 shrink-0", active && "text-cyan-400")} />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div className="mt-2 flex min-h-0 flex-1 flex-col border-t border-cyan-500/10 pt-2">
          <div className="mb-1.5 flex items-center justify-between px-2">
            <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-slate-500">Demo Features</span>
            <span className="font-mono text-[10px] text-cyan-400">{doneCount}/{demoFeatures.length}</span>
          </div>
          <div className="flex-1 space-y-1 overflow-y-auto px-1">
            {demoFeatures.map((f) => (
              <div
                key={f.id}
                className={cn(
                  "flex items-center gap-1.5 rounded px-1.5 py-1 font-mono text-[10px]",
                  f.done ? "text-emerald-400" : "text-slate-500"
                )}
              >
                <CheckCircle2 className={cn("h-2.5 w-2.5 shrink-0", f.done ? "text-emerald-400" : "text-slate-600")} />
                <span className="truncate">{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </nav>

      <div className="space-y-2 border-t border-cyan-500/10 p-3">
        <div className="glass-packet rounded border border-emerald-500/25 px-2.5 py-2">
          <div className="flex items-center justify-between font-mono text-[11px] font-medium">
            <span className="text-emerald-400">{bandConnected ? "BAND ONLINE" : "BAND OFFLINE"}</span>
            <span className="text-slate-400">{activeAgentCount} agents</span>
          </div>
        </div>
        <div className="flex items-center justify-between px-1 font-mono text-[11px]">
          <span className="font-medium text-slate-500">RISK</span>
          <span className="font-bold text-red-400">{riskScore}/100</span>
        </div>
      </div>
    </aside>
  );
}
