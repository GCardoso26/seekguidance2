/**
 * Scryfall SHADOW sync metrics + report (Sprint 2).
 * No Domain Event publish outside Outbox path.
 */
export interface ShadowSyncCounters {
  setsEnqueued: number;
  cardsEnqueued: number;
  variantsEnqueued: number;
  jobsProcessed: number;
  jobsFailed: number;
  inserts: number;
  updates: number;
  unchanged: number;
  outboxPublished: number;
  outboxDead: number;
  providerHttpErrors: number;
  providerRateLimitHits: number;
}

export interface ShadowSyncTimings {
  providerLatencyMs: number;
  applicationTimeMs: number;
  processorTimeMs: number;
  repositoryTimeMs: number;
  publishTimeMs: number;
  totalMs: number;
}

export interface ShadowSyncReport {
  mode: "SHADOW";
  requestId: string;
  correlationId: string;
  setCode: string;
  gameId: string;
  counters: ShadowSyncCounters;
  timings: ShadowSyncTimings;
  cardsPerSecond: number;
  eventsPerCard: number;
  outboxEventsPerSync: number;
  consistencyPassed: boolean;
  consistencyViolations: number;
  shadowComparisonPassed: boolean;
  shadowComparisonFailures: string[];
  readyForCanary: boolean;
  notes: string[];
}

export function emptyCounters(): ShadowSyncCounters {
  return {
    setsEnqueued: 0,
    cardsEnqueued: 0,
    variantsEnqueued: 0,
    jobsProcessed: 0,
    jobsFailed: 0,
    inserts: 0,
    updates: 0,
    unchanged: 0,
    outboxPublished: 0,
    outboxDead: 0,
    providerHttpErrors: 0,
    providerRateLimitHits: 0,
  };
}

export function recordOutcome(
  counters: ShadowSyncCounters,
  outcome: "created" | "updated" | "unchanged",
): void {
  if (outcome === "created") counters.inserts += 1;
  else if (outcome === "updated") counters.updates += 1;
  else counters.unchanged += 1;
}
