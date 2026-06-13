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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_NAME, NAV_ITEMS } from "@/lib/constants";

const iconMap = {
  Home,
  LayoutDashboard,
  MessageSquare,
  GitBranch,
  FlaskConical,
  FileText,
  Shield,
  Network,
};

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-white/10 bg-neural-panel/80 backdrop-blur-xl">
      <div className="border-b border-white/10 p-5">
        <Link href="/" className="flex items-center gap-3">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/20">
            <Radio className="h-5 w-5 text-cyan-400" />
            <span className="absolute inset-0 animate-ping rounded-lg bg-cyan-500/10" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-wide text-white">{APP_NAME}</div>
            <div className="text-[10px] text-cyan-500/70">Band Command Network</div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV_ITEMS.map((item) => {
          const Icon = iconMap[item.icon as keyof typeof iconMap];
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
                active
                  ? "bg-cyan-500/15 text-cyan-300 shadow-[inset_3px_0_0_#22d3ee]"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
          <div className="mb-1 flex items-center gap-2 text-xs font-medium text-emerald-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            Band Connected
          </div>
          <div className="text-[10px] text-slate-500">12 agents active · Track 3</div>
        </div>
      </div>
    </aside>
  );
}
