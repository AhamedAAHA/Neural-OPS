"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Search, User, Activity, Play, Loader2, LogOut } from "lucide-react";
import { DEMO_INCIDENT } from "@/lib/mock-data";
import { CyberBadge } from "@/components/cyber/CyberPanel";
import { NeonButton } from "@/components/ui/NeonButton";
import { useNeuralOpsStore } from "@/store/neural-ops";
import { useRunLiveDemo } from "@/providers/DemoRealtimeProvider";
import { LIVE_STATUSES, NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface TopNavProps {
  title: string;
  subtitle?: string;
}

export function TopNav({ title, subtitle }: TopNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { liveStatus, demoRunning, incidentCount, timelineEvents, auditLogs } = useNeuralOpsStore();
  const runLiveDemo = useRunLiveDemo();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [profile, setProfile] = useState({ name: "Incident Commander", email: "admin@neural-ops.ai" });
  const status = LIVE_STATUSES[liveStatus as keyof typeof LIVE_STATUSES];

  const quickLinks = useMemo(() => {
    const term = searchValue.trim().toLowerCase();
    return NAV_ITEMS.filter((item) => {
      if (item.href === "/") return false;
      if (!term) return true;
      return item.label.toLowerCase().includes(term) || item.href.toLowerCase().includes(term);
    }).slice(0, 7);
  }, [searchValue]);

  const notifications = useMemo(() => {
    const timeline = timelineEvents.slice(-3).map((t) => ({
      id: `timeline-${t.id}`,
      title: t.title,
      detail: `${t.agent} · ${t.time}`,
    }));
    const audits = auditLogs.slice(0, 3).map((a) => ({
      id: `audit-${a.id}`,
      title: a.action,
      detail: `${a.actor} · ${a.time}`,
    }));
    return [...timeline, ...audits].slice(0, 6);
  }, [timelineEvents, auditLogs]);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/session")
      .then(async (res) => {
        if (!active || !res.ok) return;
        const data = (await res.json()) as { user?: { name?: string; email?: string } };
        if (!data.user) return;
        setProfile({
          name: data.user.name ?? "Incident Commander",
          email: data.user.email ?? "admin@neural-ops.ai",
        });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } finally {
      setLoggingOut(false);
      setProfileOpen(false);
    }
  };

  return (
    <header className="glass-premium relative z-[80] flex h-11 shrink-0 items-center justify-between overflow-visible border-b border-cyan-500/15 px-4">
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
        <button
          type="button"
          onClick={() => {
            setSearchOpen((v) => !v);
            setNotificationsOpen(false);
            setProfileOpen(false);
          }}
          className={cn(
            "rounded border border-transparent p-1.5 text-slate-500 transition hover:border-cyan-500/20 hover:text-cyan-400",
            searchOpen && "border-cyan-500/30 text-cyan-300"
          )}
        >
          <Search className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => {
            setNotificationsOpen((v) => !v);
            setSearchOpen(false);
            setProfileOpen(false);
          }}
          className={cn(
            "relative rounded border border-transparent p-1.5 text-slate-500 transition hover:border-cyan-500/20 hover:text-cyan-400",
            notificationsOpen && "border-cyan-500/30 text-cyan-300"
          )}
        >
          <Bell className="h-3.5 w-3.5" />
          <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-red-500" />
        </button>
        <button
          type="button"
          onClick={() => {
            setProfileOpen((v) => !v);
            setSearchOpen(false);
            setNotificationsOpen(false);
          }}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded border border-cyan-500/20 bg-cyan-500/5 transition hover:border-cyan-400/40",
            profileOpen && "border-cyan-400/50"
          )}
        >
          <User className="h-3.5 w-3.5 text-cyan-400" />
        </button>
      </div>

      {searchOpen && (
        <div className="absolute right-36 top-12 z-[90] w-[320px] rounded-lg border border-cyan-500/25 bg-[#070b14]/95 p-2 shadow-[0_10px_35px_rgba(0,0,0,0.45)] backdrop-blur">
          <input
            autoFocus
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search pages..."
            className="mb-2 w-full rounded-md border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs text-white outline-none placeholder:text-slate-500 focus:border-cyan-500/40"
          />
          <div className="max-h-56 space-y-1 overflow-y-auto">
            {quickLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "block rounded-md px-2.5 py-2 text-xs transition hover:bg-cyan-500/10 hover:text-cyan-200",
                  pathname === item.href ? "bg-cyan-500/15 text-cyan-200" : "text-slate-300"
                )}
                onClick={() => setSearchOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            {!quickLinks.length && <p className="px-2 py-1.5 text-xs text-slate-500">No matching pages.</p>}
          </div>
        </div>
      )}

      {notificationsOpen && (
        <div className="absolute right-20 top-12 z-[90] w-[360px] rounded-lg border border-cyan-500/25 bg-[#070b14]/95 p-2 shadow-[0_10px_35px_rgba(0,0,0,0.45)] backdrop-blur">
          <p className="px-2 pb-1 text-[11px] uppercase tracking-widest text-slate-500">Recent Alerts</p>
          <div className="max-h-64 space-y-1 overflow-y-auto">
            {notifications.map((notice) => (
              <div key={notice.id} className="rounded-md border border-slate-800 bg-slate-900/50 px-2.5 py-2">
                <p className="text-xs text-slate-200">{notice.title}</p>
                <p className="mt-0.5 text-[11px] text-slate-500">{notice.detail}</p>
              </div>
            ))}
            {!notifications.length && <p className="px-2 py-2 text-xs text-slate-500">No notifications yet.</p>}
          </div>
        </div>
      )}

      {profileOpen && (
        <div className="absolute right-3 top-12 z-[90] w-56 rounded-lg border border-cyan-500/25 bg-[#070b14]/95 p-2 shadow-[0_10px_35px_rgba(0,0,0,0.45)] backdrop-blur">
          <p className="px-2 pt-1 text-xs text-slate-200">{profile.name}</p>
          <p className="px-2 pb-2 text-[11px] text-slate-500">{profile.email}</p>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex w-full items-center gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-2.5 py-2 text-xs text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
          >
            <LogOut className="h-3.5 w-3.5" />
            {loggingOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      )}
    </header>
  );
}
