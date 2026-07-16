import { QUEUE_NAMES, type JobPriority } from "../../platform/bullmq/queues.js";
import { createJobEnvelope } from "../../platform/jobs/JobEnvelope.js";
import type { JobQueue } from "../../platform/jobs/JobQueue.js";
import type { SyncSetCommandPayload } from "../commands/SyncSetCommand.js";
import type { SyncCardCommandPayload } from "../commands/SyncCardCommand.js";
import type { SyncVariantCommandPayload } from "../commands/SyncVariantCommand.js";

export interface EnqueueContext {
  requestId: string;
  correlationId?: string;
  providerId: string;
  gameCode: string;
  priority?: JobPriority;
}

/**
 * Queue Producer — builds JobEnvelope + enqueue.
 * No domain persistence; Scheduler calls this.
 */
export class CatalogQueueProducer {
  constructor(private readonly jobs: JobQueue) {}

  enqueueSyncSet(ctx: EnqueueContext, payload: SyncSetCommandPayload): Promise<string> {
    return this.jobs.enqueue(
      QUEUE_NAMES.catalogSets,
      createJobEnvelope("SyncSetCommand", payload, {
        ...ctx,
        priority: ctx.priority ?? "NORMAL",
      }),
    );
  }

  enqueueSyncCard(ctx: EnqueueContext, payload: SyncCardCommandPayload): Promise<string> {
    return this.jobs.enqueue(
      QUEUE_NAMES.catalogCards,
      createJobEnvelope("SyncCardCommand", payload, {
        ...ctx,
        priority: ctx.priority ?? "NORMAL",
      }),
    );
  }

  enqueueSyncVariant(ctx: EnqueueContext, payload: SyncVariantCommandPayload): Promise<string> {
    return this.jobs.enqueue(
      QUEUE_NAMES.catalogVariants,
      createJobEnvelope("SyncVariantCommand", payload, {
        ...ctx,
        priority: ctx.priority ?? "LOW",
      }),
    );
  }
}
