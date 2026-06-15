"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { LiveDataProvider } from "@/providers/LiveDataProvider";
import { MatrixRainCanvas } from "@/components/ui/MatrixRainCanvas";
import { installRuntimeErrorRecovery } from "@/lib/client/runtime-error-handler";

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

function useAuthenticatedSession() {
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/session", { cache: "no-store" })
      .then((res) => {
        if (!active) return;
        setAuthenticated(res.ok);
      })
      .catch(() => {
        if (!active) return;
        setAuthenticated(false);
      })
      .finally(() => {
        if (!active) return;
        setReady(true);
      });

    return () => {
      active = false;
    };
  }, []);

  return { ready, authenticated };
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
  const { ready, authenticated } = useAuthenticatedSession();

  useEffect(() => {
    initClientSentry();
    return installRuntimeErrorRecovery();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <MatrixRainCanvas />
      {ready && authenticated ? <LiveDataProvider>{children}</LiveDataProvider> : children}
    </QueryClientProvider>
  );
}
