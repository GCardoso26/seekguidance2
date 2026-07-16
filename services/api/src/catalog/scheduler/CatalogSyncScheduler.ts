import type { CatalogQueueProducer, EnqueueContext } from "../producers/CatalogQueueProducer.js";
import type { SyncSetCommandPayload } from "../commands/SyncSetCommand.js";
import type { SyncCardCommandPayload } from "../commands/SyncCardCommand.js";
import type { SyncVariantCommandPayload } from "../commands/SyncVariantCommand.js";

export interface ScheduleSetInput extends EnqueueContext {
  set: SyncSetCommandPayload;
}

export interface ScheduleCardInput extends EnqueueContext {
  card: SyncCardCommandPayload;
}

export interface ScheduleVariantInput extends EnqueueContext {
  variant: SyncVariantCommandPayload;
}

/**
 * Scheduler boundary — decides WHAT/WHEN to sync; only enqueues via Producer.
 * Swap cron/trigger later without touching workers.
 */
export class CatalogSyncScheduler {
  constructor(private readonly producer: CatalogQueueProducer) {}

  scheduleSet(input: ScheduleSetInput): Promise<string> {
    const { set, ...ctx } = input;
    return this.producer.enqueueSyncSet(ctx, set);
  }

  scheduleCard(input: ScheduleCardInput): Promise<string> {
    const { card, ...ctx } = input;
    return this.producer.enqueueSyncCard(ctx, card);
  }

  scheduleVariant(input: ScheduleVariantInput): Promise<string> {
    const { variant, ...ctx } = input;
    return this.producer.enqueueSyncVariant(ctx, variant);
  }

  /**
   * Orchestrates a typical sync wave: set first, then cards (same correlationId).
   * Still only enqueues — does not call Application Services.
   */
  async scheduleSetWithCards(
    ctx: EnqueueContext,
    set: SyncSetCommandPayload,
    cards: SyncCardCommandPayload[],
  ): Promise<{ setJobId: string; cardJobIds: string[] }> {
    const setJobId = await this.scheduleSet({ ...ctx, set });
    const cardJobIds: string[] = [];
    for (const card of cards) {
      cardJobIds.push(
        await this.scheduleCard({
          ...ctx,
          correlationId: ctx.correlationId ?? ctx.requestId,
          card,
        }),
      );
    }
    return { setJobId, cardJobIds };
  }
}
