"use client";

type ToastKind = "success" | "error" | "info";

interface ToastProps {
  message: string;
  kind?: ToastKind;
}

const kindClasses: Record<ToastKind, string> = {
  success: "border-emerald-500/40 bg-emerald-500/15 text-emerald-200",
  error: "border-red-500/40 bg-red-500/15 text-red-200",
  info: "border-cyan-500/40 bg-cyan-500/15 text-cyan-200",
};

export function Toast({ message, kind = "info" }: ToastProps) {
  return (
    <div className={`fixed right-4 top-16 z-[120] rounded-md border px-3 py-2 font-mono text-xs shadow-lg ${kindClasses[kind]}`}>
      {message}
    </div>
  );
}
