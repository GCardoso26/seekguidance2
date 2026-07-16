import type { JobEnvelope, SyncJobState, SyncJobStatus } from "./JobEnvelope.js";
import type { QueueName } from "../bullmq/queues.js";

export type JobHandler = (envelope: JobEnvelope, ctx: { jobId: string }) => Promise<void>;

/**
 * Port for command queues — BullMQ adapter or InMemory for smoke tests.
 * Processors register handlers; producers enqueue envelopes.
 */
export interface JobQueue {
  enqueue(queue: QueueName, envelope: JobEnvelope): Promise<string>;
  registerProcessor(queue: QueueName, handler: JobHandler): void;
  /** Process all queued jobs for a queue (InMemory / smoke). No-op on real BullMQ until workers poll. */
  drain(queue?: QueueName): Promise<{ processed: number; failed: number }>;
  getState(jobId: string): SyncJobState | undefined;
  listByStatus(status: SyncJobStatus): SyncJobState[];
}
