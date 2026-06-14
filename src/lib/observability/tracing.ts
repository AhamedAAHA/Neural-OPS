import { trace, SpanStatusCode, type Attributes } from "@opentelemetry/api";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";
import { BatchSpanProcessor, ConsoleSpanExporter } from "@opentelemetry/sdk-trace-base";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";

let tracingInitialized = false;

export function initTracing() {
  if (tracingInitialized) return;
  if (process.env.OTEL_DISABLED === "true") return;

  const spanProcessors: BatchSpanProcessor[] = [];

  const exporterUrl = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  if (exporterUrl) {
    spanProcessors.push(
      new BatchSpanProcessor(
        new OTLPTraceExporter({
          url: exporterUrl,
          headers: process.env.OTEL_EXPORTER_OTLP_HEADERS
            ? Object.fromEntries(
                process.env.OTEL_EXPORTER_OTLP_HEADERS.split(",").map((pair) => {
                  const [key, ...rest] = pair.split("=");
                  return [key?.trim(), rest.join("=").trim()];
                })
              )
            : undefined,
        })
      )
    );
  }

  if (process.env.OTEL_CONSOLE_EXPORTER === "true") {
    spanProcessors.push(new BatchSpanProcessor(new ConsoleSpanExporter()));
  }

  const provider = new NodeTracerProvider({ spanProcessors });
  provider.register();
  tracingInitialized = true;
}

export async function withSpan<T>(name: string, attributes: Attributes, fn: () => Promise<T>): Promise<T> {
  initTracing();
  const tracer = trace.getTracer("neural-ops");
  const span = tracer.startSpan(name, { attributes });
  try {
    const result = await fn();
    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (error) {
    span.recordException(error as Error);
    span.setStatus({ code: SpanStatusCode.ERROR, message: error instanceof Error ? error.message : "Unknown error" });
    throw error;
  } finally {
    span.end();
  }
}
