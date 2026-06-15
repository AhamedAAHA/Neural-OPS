export async function initSentry() {
  // Client Sentry is initialized in Providers when NEXT_PUBLIC_SENTRY_DSN is set.
}

export function captureException(error: unknown, context?: Record<string, unknown>) {
  if (process.env.NODE_ENV === "development") {
    console.error("[captureException]", error, context);
  }
}
