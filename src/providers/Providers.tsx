"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { LiveDataProvider } from "@/providers/LiveDataProvider";

function initClientSentry() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();
  if (!dsn) return;

  void import("@sentry/react").then((Sentry) => {
    if (Sentry.getClient()) return;
    Sentry.init({
      dsn,
      tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? "0.2"),
      environment: process.env.NODE_ENV,
    });
  });
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, refetchOnWindowFocus: false },
        },
      })
  );

  useEffect(() => {
    initClientSentry();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <LiveDataProvider>{children}</LiveDataProvider>
    </QueryClientProvider>
  );
}
