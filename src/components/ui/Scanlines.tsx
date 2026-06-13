import { cn } from "@/lib/utils";

export function Scanlines({ className }: { className?: string }) {
  return <div className={cn("scanlines pointer-events-none absolute inset-0 z-10", className)} aria-hidden />;
}
