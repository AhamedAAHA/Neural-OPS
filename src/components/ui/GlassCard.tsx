"use client";

import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: "cyan" | "violet" | "red" | "emerald" | "none";
  hover?: boolean;
  onClick?: () => void;
}

const glowMap = {
  cyan: "border-cyan-500/25 shadow-[0_0_32px_rgba(34,211,238,0.1)]",
  violet: "border-violet-500/25 shadow-[0_0_32px_rgba(139,92,246,0.1)]",
  red: "border-red-500/25 shadow-[0_0_32px_rgba(239,68,68,0.1)]",
  emerald: "border-emerald-500/25 shadow-[0_0_32px_rgba(16,185,129,0.1)]",
  none: "",
};

export function GlassCard({ children, className, glow = "none", hover = true, onClick }: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
      className={cn(
        "glass-premium hud-panel scanlines relative overflow-hidden rounded-xl",
        glowMap[glow],
        hover && "transition-all duration-300 hover:border-cyan-400/35",
        className
      )}
    >
      {children}
    </div>
  );
}
