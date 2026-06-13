"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface NeonButtonProps {
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

const variants = {
  primary: "bg-cyan-500/20 border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/30 hover:shadow-[0_0_20px_rgba(34,211,238,0.3)]",
  secondary: "bg-violet-500/15 border-violet-500/40 text-violet-300 hover:bg-violet-500/25",
  danger: "bg-red-500/15 border-red-500/40 text-red-300 hover:bg-red-500/25",
  ghost: "bg-transparent border-white/10 text-slate-300 hover:bg-white/5 hover:border-white/20",
};

const sizes = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-5 py-2.5 text-sm",
  lg: "px-8 py-3.5 text-base",
};

export function NeonButton({ href, onClick, variant = "primary", size = "md", children, className, disabled }: NeonButtonProps) {
  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-lg border font-medium transition-all duration-300",
    variants[variant],
    sizes[size],
    disabled && "pointer-events-none opacity-50",
    className
  );

  if (href && !disabled) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={classes}>
      {children}
    </button>
  );
}
