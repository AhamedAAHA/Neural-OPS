import { initSentry } from "@/lib/observability/sentry";
import { initTracing } from "@/lib/observability/tracing";

export async function register() {
  initSentry();
  initTracing();
}
