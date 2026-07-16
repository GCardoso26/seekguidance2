import type { Redis } from "ioredis";
import { createLogger } from "../../platform/logging/logger.js";
import { DOMAIN_EVENTS_STREAM } from "../../platform/event-publisher/RedisEventPublisher.js";
import type { DomainEvent } from "../../shared/events/types.js";
import { SearchEventConsumer } from "./SearchEventConsumer.js";
import { isSearchProjectionEvent } from "../application/ApplySearchEventApplicationService.js";

const log = createLogger("redis-search-consumer");

export interface RedisSearchStreamConsumerOpts {
  redis: Redis;
  consumer: SearchEventConsumer;
  stream?: string;
  group?: string;
  consumerName?: string;
  batchSize?: number;
  blockMs?: number;
}

/**
 * Redis Streams XREADGROUP → SearchEventConsumer.
 * Supports replay from a stream id (default "0-0" for full replay).
 */
export class RedisSearchStreamConsumer {
  private readonly stream: string;
  private readonly group: string;
  private readonly consumerName: string;
  private readonly batchSize: number;
  private readonly blockMs: number;
  private running = false;

  constructor(private readonly opts: RedisSearchStreamConsumerOpts) {
    this.stream = opts.stream ?? DOMAIN_EVENTS_STREAM;
    this.group = opts.group ?? "search-projection";
    this.consumerName = opts.consumerName ?? `search-${process.pid}`;
    this.batchSize = opts.batchSize ?? 20;
    this.blockMs = opts.blockMs ?? 2_000;
  }

  async ensureGroup(): Promise<void> {
    try {
      await this.opts.redis.xgroup("CREATE", this.stream, this.group, "0", "MKSTREAM");
      log.info({ stream: this.stream, group: this.group }, "search_consumer_group_created");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.includes("BUSYGROUP")) throw err;
    }
  }

  async start(): Promise<void> {
    await this.ensureGroup();
    this.running = true;
    log.info(
      { stream: this.stream, group: this.group, consumer: this.consumerName },
      "redis_search_consumer_started",
    );
    while (this.running) {
      await this.readOnce(">");
    }
  }

  stop(): void {
    this.running = false;
  }

  /** Replay historical messages from `fromId` (inclusive cursor style via XREADGROUP). */
  async replay(fromId = "0"): Promise<{ read: number; applied: number }> {
    await this.ensureGroup();
    let read = 0;
    let applied = 0;
    let cursor = fromId;
    for (;;) {
      const rows = await this.xreadgroup(cursor === "0" ? "0" : cursor, false);
      if (!rows.length) break;
      for (const row of rows) {
        read += 1;
        const result = await this.dispatch(row.id, row.fields);
        if (result === "applied") applied += 1;
        cursor = row.id;
      }
      // After first batch from "0", continue with ">" for pending — for full replay use "0" repeatedly
      // until empty on non-blocking read of pending in group. Simpler: non-block read from "0" once per loop.
      if (fromId === "0" && rows.length < this.batchSize) break;
      if (fromId !== "0") break;
    }
    log.info({ read, applied, fromId }, "search_stream_replay_done");
    return { read, applied };
  }

  async readOnce(id: ">" | "0" | string = ">"): Promise<number> {
    const rows = await this.xreadgroup(id, id === ">");
    for (const row of rows) {
      await this.dispatch(row.id, row.fields);
    }
    return rows.length;
  }

  private async xreadgroup(
    id: string,
    block: boolean,
  ): Promise<Array<{ id: string; fields: Record<string, string> }>> {
    const redis = this.opts.redis;
    const raw = block
      ? ((await redis.xreadgroup(
          "GROUP",
          this.group,
          this.consumerName,
          "COUNT",
          this.batchSize,
          "BLOCK",
          this.blockMs,
          "STREAMS",
          this.stream,
          id,
        )) as null | Array<[string, Array<[string, string[]]>]>)
      : ((await redis.xreadgroup(
          "GROUP",
          this.group,
          this.consumerName,
          "COUNT",
          this.batchSize,
          "STREAMS",
          this.stream,
          id,
        )) as null | Array<[string, Array<[string, string[]]>]>);

    if (!raw?.length) return [];
    const out: Array<{ id: string; fields: Record<string, string> }> = [];
    for (const [, messages] of raw) {
      for (const [msgId, flat] of messages) {
        const fields: Record<string, string> = {};
        for (let i = 0; i < flat.length; i += 2) {
          fields[flat[i]!] = flat[i + 1]!;
        }
        out.push({ id: msgId, fields });
      }
    }
    return out;
  }

  private async dispatch(
    streamId: string,
    fields: Record<string, string>,
  ): Promise<"applied" | "skipped" | "ignored" | "failed"> {
    const body = fields.body;
    if (!body) {
      await this.opts.redis.xack(this.stream, this.group, streamId);
      return "ignored";
    }
    let event: DomainEvent;
    try {
      event = JSON.parse(body) as DomainEvent;
    } catch {
      log.warn({ streamId }, "search_stream_bad_json");
      await this.opts.redis.xack(this.stream, this.group, streamId);
      return "failed";
    }

    if (!isSearchProjectionEvent(event.eventType)) {
      await this.opts.redis.xack(this.stream, this.group, streamId);
      return "ignored";
    }

    // Prefer stream event_id field when envelope lacks id
    if (!event.id && fields.event_id) event = { ...event, id: fields.event_id };

    const result = await this.opts.consumer.handle(event);
    await this.opts.redis.xack(this.stream, this.group, streamId);
    return result;
  }
}
