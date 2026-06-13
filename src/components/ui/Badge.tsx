import { cn, severityBg } from "@/lib/utils";

interface BadgeProps {
  label: string;
  severity?: string;
  className?: string;
  dot?: boolean;
}

export function Badge({ label, severity, className, dot = false }: BadgeProps) {
  if (severity) {
    return (
      <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium", severityBg(severity), className)}>
        {dot && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />}
        {label}
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-slate-400", className)}>
      {label}
    </span>
  );
}
