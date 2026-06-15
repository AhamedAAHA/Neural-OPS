"use client";

import { useEffect } from "react";
import { formatClientError } from "@/lib/client/runtime-error-handler";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const message = formatClientError(error);

  useEffect(() => {
    console.error("[Neural OPS] Route error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
      <div className="max-w-md rounded-xl border border-red-500/30 bg-slate-900/80 p-6 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-red-400">Runtime Error</p>
        <h2 className="mt-2 text-lg font-semibold">Something went wrong</h2>
        <p className="mt-2 text-sm text-slate-400">{message}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-md border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-md border border-slate-600 bg-slate-800 px-4 py-2 text-sm text-slate-200"
          >
            Reload page
          </button>
        </div>
      </div>
    </div>
  );
}
