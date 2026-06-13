"use client";

import { cn } from "@/lib/utils";

interface CyberPanelProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  glow?: "cyan" | "red" | "violet" | "emerald" | "amber" | "none";
  compact?: boolean;
  noPadding?: boolean;
  hover?: boolean;
}

const glowStyles = {
  cyan: "border-cyan-500/25 shadow-[0_0_32px_rgba(34,211,238,0.1),inset_0_0_20px_rgba(34,211,238,0.04)]",
  red: "border-red-500/25 shadow-[0_0_32px_rgba(239,68,68,0.1),inset_0_0_20px_rgba(239,68,68,0.04)]",
  violet: "border-violet-500/25 shadow-[0_0_32px_rgba(139,92,246,0.1),inset_0_0_20px_rgba(139,92,246,0.04)]",
  emerald: "border-emerald-500/25 shadow-[0_0_32px_rgba(16,185,129,0.1),inset_0_0_20px_rgba(16,185,129,0.04)]",
  amber: "border-amber-500/25 shadow-[0_0_32px_rgba(245,158,11,0.1),inset_0_0_20px_rgba(245,158,11,0.04)]",
  none: "border-cyan-500/15",
};

export function CyberPanel({ children, className, title, subtitle, glow = "none", compact, noPadding, hover = true }: CyberPanelProps) {
  return (
    <div
      className={cn(
        "hud-panel relative",
        glowStyles[glow],
        hover && "transition-all duration-300 hover:border-cyan-400/35",
        className
      )}
    >
      {(title || subtitle) && (
        <div className={cn("relative z-[2] border-b border-cyan-500/10 bg-[rgba(5,12,28,0.35)] backdrop-blur-sm", compact ? "px-3 py-2" : "px-4 py-2.5")}>
          {title && (
            <h3 className="font-mono text-[11px] font-semibold uppercase tracking-[0.15em] text-cyan-400/90">
              {title}
            </h3>
          )}
          {subtitle && <p className="mt-0.5 font-mono text-[10px] text-slate-500">{subtitle}</p>}
        </div>
      )}
      <div className={cn("relative z-[2]", !noPadding && (compact ? "p-3" : "p-4"))}>{children}</div>
    </div>
  );
}

export function CyberBadge({
  label,
  variant = "default",
  pulse,
}: {
  label: string;
  variant?: "default" | "cyan" | "red" | "amber" | "emerald" | "violet";
  pulse?: boolean;
}) {
  const styles = {
    default: "glass-packet border-white/10 text-slate-400",
    cyan: "border-cyan-500/35 bg-cyan-500/10 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.15)]",
    red: "border-red-500/35 bg-red-500/10 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.15)]",
    amber: "border-amber-500/35 bg-amber-500/10 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.15)]",
    emerald: "border-emerald-500/35 bg-emerald-500/10 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.15)]",
    violet: "border-violet-500/35 bg-violet-500/10 text-violet-400 shadow-[0_0_10px_rgba(139,92,246,0.15)]",
  };

  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider backdrop-blur-sm", styles[variant])}>
      {pulse && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />}
      {label}
    </span>
  );
}

export function StatusBar({ items }: { items: { label: string; value: string; color?: string }[] }) {
  return (
    <div className="glass-premium flex items-center gap-4 border-t border-cyan-500/15 px-4 py-2 font-mono text-[10px]">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <span className="text-slate-600">{item.label}:</span>
          <span className={item.color ?? "text-cyan-400"}>{item.value}</span>
        </div>
      ))}
    </div>
  );
}

export function HudGrid({ className }: { className?: string }) {
  return <div className={cn("pointer-events-none absolute inset-0 opacity-30", className)} aria-hidden />;
}
