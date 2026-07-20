/**
 * Observability context — OpenTelemetry / Prometheus ready interfaces.
 * All new platform components should attach these fields to logs/metrics.
 */
export interface ObservabilityContext {
  requestId: string;
  correlationId: string;
  causationId?: string;
  aggregateId?: string;
  durationMs?: number;
  retry?: number;
  status?: "ok" | "error" | "retry" | "dead";
}

export function obsFields(ctx: ObservabilityContext): Record<string, unknown> {
  return {
    requestId: ctx.requestId,
    correlationId: ctx.correlationId,
    causationId: ctx.causationId,
    aggregateId: ctx.aggregateId,
    durationMs: ctx.durationMs,
    retry: ctx.retry,
    status: ctx.status,
  };
}

/** Placeholder meter — wire OTel MeterProvider later. */
export interface MetricsPort {
  inc(name: string, labels?: Record<string, string>): void;
  observe(name: string, value: number, labels?: Record<string, string>): void;
}

export const noopMetrics: MetricsPort = {
  inc() {},
  observe() {},
};
