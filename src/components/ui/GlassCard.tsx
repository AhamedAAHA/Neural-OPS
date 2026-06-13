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
  cyan: "shadow-[0_0_30px_rgba(34,211,238,0.08)]",
  violet: "shadow-[0_0_30px_rgba(167,139,250,0.08)]",
  red: "shadow-[0_0_30px_rgba(248,113,113,0.08)]",
  emerald: "shadow-[0_0_30px_rgba(52,211,153,0.08)]",
  none: "",
};

export function GlassCard({ children, className, glow = "none", hover = false, onClick }: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
      className={cn(
        "glass gradient-border relative overflow-hidden rounded-xl",
        glowMap[glow],
        hover && "transition-all duration-300 hover:border-cyan-500/30 hover:bg-white/[0.05]",
        className
      )}
    >
      {children}
    </div>
  );
}
