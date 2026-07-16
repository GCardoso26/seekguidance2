/**
 * End-to-end sync lead time:
 * Provider → Sync → Commit → Outbox → Publish → Redis → Search Consumer → Meili → searchable
 *
 * Operational north-star: P95 under target (e.g. minutes by volume).
 */
export interface SyncLeadTimeSample {
  eventId: string;
  eventType: string;
  /** ms from event.metadata.occurredAt (proxy for provider change) to searchable. */
  providerToSearchableMs: number;
  recordedAt: string;
}

export interface SyncLeadTimeStats {
  samples: number;
  p50Ms: number | null;
  p95Ms: number | null;
  maxMs: number | null;
  lastMs: number | null;
}

export class SyncLeadTimeTracker {
  private readonly samples: SyncLeadTimeSample[] = [];
  private readonly maxKeep: number;

  constructor(maxKeep = 500) {
    this.maxKeep = maxKeep;
  }

  record(sample: SyncLeadTimeSample): void {
    this.samples.push(sample);
    if (this.samples.length > this.maxKeep) this.samples.shift();
  }

  stats(): SyncLeadTimeStats {
    if (this.samples.length === 0) {
      return { samples: 0, p50Ms: null, p95Ms: null, maxMs: null, lastMs: null };
    }
    const sorted = [...this.samples.map((s) => s.providerToSearchableMs)].sort((a, b) => a - b);
    const p50 = sorted[Math.floor(sorted.length * 0.5)]!;
    const p95 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))]!;
    return {
      samples: sorted.length,
      p50Ms: p50,
      p95Ms: p95,
      maxMs: sorted[sorted.length - 1]!,
      lastMs: this.samples[this.samples.length - 1]!.providerToSearchableMs,
    };
  }
}
