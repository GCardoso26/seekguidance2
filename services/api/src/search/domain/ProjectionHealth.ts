export type ProjectionHealthStatus = "healthy" | "degraded" | "down";

export interface ProjectionHealth {
  status: ProjectionHealthStatus;
  projection: string;
  reasons: string[];
  checkedAt: string;
}

export interface ProjectionLag {
  /** ms since last successfully applied event (null if never). */
  lagMs: number | null;
  lastEventAt: string | null;
  lastEventId: string | null;
  pendingApprox: number;
}

const DEGRADED_LAG_MS = 30_000;
const DOWN_LAG_MS = 120_000;

export function evaluateProjectionHealth(input: {
  projection: string;
  lag: ProjectionLag;
  indexReachable: boolean;
  checkedAt?: string;
}): ProjectionHealth {
  const reasons: string[] = [];
  const now = input.checkedAt ?? new Date().toISOString();

  if (!input.indexReachable) {
    return {
      status: "down",
      projection: input.projection,
      reasons: ["index_unreachable"],
      checkedAt: now,
    };
  }

  const lag = input.lag.lagMs;
  if (lag != null && lag >= DOWN_LAG_MS) {
    reasons.push(`lag_ms>=${DOWN_LAG_MS}`);
    return { status: "down", projection: input.projection, reasons, checkedAt: now };
  }
  if (lag != null && lag >= DEGRADED_LAG_MS) {
    reasons.push(`lag_ms>=${DEGRADED_LAG_MS}`);
    return { status: "degraded", projection: input.projection, reasons, checkedAt: now };
  }
  if (input.lag.pendingApprox > 1_000) {
    reasons.push("pending_backlog");
    return { status: "degraded", projection: input.projection, reasons, checkedAt: now };
  }

  return { status: "healthy", projection: input.projection, reasons: [], checkedAt: now };
}
