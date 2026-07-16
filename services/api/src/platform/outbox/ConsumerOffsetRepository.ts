export type ConsumerResult = "success" | "skipped" | "failed";

export interface ConsumerOffsetRecord {
  consumerName: string;
  eventId: string;
  processedAt: Date;
  processingDurationMs: number | null;
  result: ConsumerResult;
  lastError: string | null;
}

export interface ConsumerOffsetRepository {
  hasProcessed(consumerName: string, eventId: string): Promise<boolean>;
  record(input: {
    consumerName: string;
    eventId: string;
    result: ConsumerResult;
    processingDurationMs?: number;
    lastError?: string;
  }): Promise<ConsumerOffsetRecord>;
}

export class InMemoryConsumerOffsetRepository implements ConsumerOffsetRepository {
  private rows = new Map<string, ConsumerOffsetRecord>();

  private key(consumer: string, eventId: string): string {
    return `${consumer}::${eventId}`;
  }

  async hasProcessed(consumerName: string, eventId: string): Promise<boolean> {
    return this.rows.has(this.key(consumerName, eventId));
  }

  async record(input: {
    consumerName: string;
    eventId: string;
    result: ConsumerResult;
    processingDurationMs?: number;
    lastError?: string;
  }): Promise<ConsumerOffsetRecord> {
    const k = this.key(input.consumerName, input.eventId);
    const existing = this.rows.get(k);
    if (existing) return existing; // idempotent
    const row: ConsumerOffsetRecord = {
      consumerName: input.consumerName,
      eventId: input.eventId,
      processedAt: new Date(),
      processingDurationMs: input.processingDurationMs ?? null,
      result: input.result,
      lastError: input.lastError ?? null,
    };
    this.rows.set(k, row);
    return row;
  }
}
