"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    void import("@sentry/react").then((Sentry) => {
      Sentry.captureException(error, { extra: { digest: error.digest } });
    });
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="max-w-md rounded-xl border border-red-500/30 bg-slate-900/80 p-6 text-center">
          <h2 className="text-lg font-semibold">Something went wrong</h2>
          <p className="mt-2 text-sm text-slate-400">An unexpected error occurred. You can retry or return to the dashboard.</p>
          <button
            type="button"
            onClick={() => reset()}
            className="mt-4 rounded-md border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
