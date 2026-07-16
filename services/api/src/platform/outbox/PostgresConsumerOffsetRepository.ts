import type { Pool } from "pg";
import type {
  ConsumerOffsetRecord,
  ConsumerOffsetRepository,
  ConsumerResult,
} from "./ConsumerOffsetRepository.js";

export class PostgresConsumerOffsetRepository implements ConsumerOffsetRepository {
  constructor(private readonly db: Pool) {}

  async hasProcessed(consumerName: string, eventId: string): Promise<boolean> {
    const res = await this.db.query(
      `SELECT 1 FROM platform.consumer_offsets WHERE consumer_name = $1 AND event_id = $2`,
      [consumerName, eventId],
    );
    return res.rowCount !== null && res.rowCount > 0;
  }

  async record(input: {
    consumerName: string;
    eventId: string;
    result: ConsumerResult;
    processingDurationMs?: number;
    lastError?: string;
  }): Promise<ConsumerOffsetRecord> {
    const res = await this.db.query(
      `
      INSERT INTO platform.consumer_offsets (
        consumer_name, event_id, processing_duration_ms, result, last_error
      ) VALUES ($1,$2,$3,$4,$5)
      ON CONFLICT (consumer_name, event_id) DO UPDATE
        SET consumer_name = EXCLUDED.consumer_name
      RETURNING *
      `,
      [
        input.consumerName,
        input.eventId,
        input.processingDurationMs ?? null,
        input.result,
        input.lastError ?? null,
      ],
    );
    const row = res.rows[0];
    return {
      consumerName: String(row.consumer_name),
      eventId: String(row.event_id),
      processedAt: new Date(String(row.processed_at)),
      processingDurationMs:
        row.processing_duration_ms === null ? null : Number(row.processing_duration_ms),
      result: row.result as ConsumerResult,
      lastError: row.last_error ? String(row.last_error) : null,
    };
  }
}
