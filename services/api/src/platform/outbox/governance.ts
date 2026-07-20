/**
 * Outbox facade — ADR-004 already mandates outbox.
 * This module re-exports and documents the governance path:
 * Transaction → Insert Outbox → Commit → Outbox Worker → BullMQ → Consumers
 */
export {
  type OutboxRepository,
  type OutboxRecord,
  type InsertOutboxInput,
  type OutboxStatus,
} from "../outbox/types.js";
export { PostgresOutboxRepository } from "../outbox/PostgresOutboxRepository.js";
export { OutboxPublisherWorker } from "../outbox/OutboxPublisherWorker.js";
export { processOnce } from "../outbox/processOnce.js";

export const OUTBOX_FLOW = [
  "Transaction",
  "InsertOutbox",
  "Commit",
  "OutboxWorker",
  "BullMQ",
  "Consumers",
] as const;
