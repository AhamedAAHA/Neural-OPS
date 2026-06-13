"use client";

import { Bell, Search, User } from "lucide-react";
import { DEMO_INCIDENT } from "@/lib/mock-data";
import { Badge } from "@/components/ui/Badge";

interface TopNavProps {
  title: string;
  subtitle?: string;
}

export function TopNav({ title, subtitle }: TopNavProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 bg-neural-panel/50 px-6 backdrop-blur-xl">
      <div>
        <h1 className="text-lg font-semibold text-white">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        <Badge label={DEMO_INCIDENT.id} severity={DEMO_INCIDENT.severity} dot />
        <button type="button" className="rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-white">
          <Search className="h-4 w-4" />
        </button>
        <button type="button" className="relative rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-white">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-cyan-500/30 bg-cyan-500/10">
          <User className="h-4 w-4 text-cyan-400" />
        </div>
      </div>
    </header>
  );
}
