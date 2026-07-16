import { getClock } from "../../shared/time/Clock.js";
import { getIdGenerator } from "../../shared/ids/IdGenerator.js";
import type { QueueName } from "../bullmq/queues.js";
import type { JobEnvelope, SyncJobState, SyncJobStatus } from "./JobEnvelope.js";
import type { JobHandler, JobQueue } from "./JobQueue.js";

interface QueuedJob {
  id: string;
  queue: QueueName;
  envelope: JobEnvelope;
}

/**
 * In-memory command queue for smoke E2E (no Redis).
 * Implements queued → running → completed | failed → retry → dead.
 */
export class InMemoryJobQueue implements JobQueue {
  private handlers = new Map<QueueName, JobHandler>();
  private pending: QueuedJob[] = [];
  private states = new Map<string, SyncJobState>();
  private readonly maxAttempts: number;

  constructor(opts?: { maxAttempts?: number }) {
    this.maxAttempts = opts?.maxAttempts ?? 5;
  }

  async enqueue(queue: QueueName, envelope: JobEnvelope): Promise<string> {
    const id = getIdGenerator().generate();
    this.pending.push({ id, queue, envelope: { ...envelope, attempt: envelope.attempt || 1 } });
    this.setState(id, envelope.jobType, "queued", envelope.attempt || 1);
    return id;
  }

  registerProcessor(queue: QueueName, handler: JobHandler): void {
    this.handlers.set(queue, handler);
  }

  async drain(queue?: QueueName): Promise<{ processed: number; failed: number }> {
    let processed = 0;
    let failed = 0;
    const batch = queue
      ? this.pending.filter((j) => j.queue === queue)
      : [...this.pending];

    // Remove claimed from pending
    const claimedIds = new Set(batch.map((j) => j.id));
    this.pending = this.pending.filter((j) => !claimedIds.has(j.id));

    for (const job of batch) {
      const handler = this.handlers.get(job.queue);
      if (!handler) {
        this.setState(job.id, job.envelope.jobType, "failed", job.envelope.attempt, "no_handler");
        failed += 1;
        continue;
      }

      this.setState(job.id, job.envelope.jobType, "running", job.envelope.attempt);
      try {
        await handler(job.envelope, { jobId: job.id });
        this.setState(job.id, job.envelope.jobType, "completed", job.envelope.attempt);
        processed += 1;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const nextAttempt = job.envelope.attempt + 1;
        if (nextAttempt > this.maxAttempts) {
          this.setState(job.id, job.envelope.jobType, "dead", job.envelope.attempt, message);
          failed += 1;
        } else {
          this.setState(job.id, job.envelope.jobType, "retry", job.envelope.attempt, message);
          this.pending.push({
            id: job.id,
            queue: job.queue,
            envelope: { ...job.envelope, attempt: nextAttempt },
          });
          this.setState(job.id, job.envelope.jobType, "queued", nextAttempt, message);
          failed += 1;
        }
      }
    }

    return { processed, failed };
  }

  getState(jobId: string): SyncJobState | undefined {
    return this.states.get(jobId);
  }

  listByStatus(status: SyncJobStatus): SyncJobState[] {
    return [...this.states.values()].filter((s) => s.status === status);
  }

  private setState(
    jobId: string,
    jobType: string,
    status: SyncJobStatus,
    attempt: number,
    lastError?: string,
  ): void {
    this.states.set(jobId, {
      jobId,
      jobType,
      status,
      attempt,
      lastError,
      updatedAt: getClock().nowIso(),
    });
  }
}
