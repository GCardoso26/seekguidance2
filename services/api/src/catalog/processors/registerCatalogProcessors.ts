import { QUEUE_NAMES } from "../../platform/bullmq/queues.js";
import type { JobQueue } from "../../platform/jobs/JobQueue.js";
import { PersistCatalogCardApplicationService } from "../application/PersistCatalogCardApplicationService.js";
import { PersistCatalogSetApplicationService } from "../application/PersistCatalogSetApplicationService.js";
import { PersistCatalogVariantApplicationService } from "../application/PersistCatalogVariantApplicationService.js";
import { createSyncCardProcessor } from "../processors/SyncCardProcessor.js";
import { createSyncSetProcessor } from "../processors/SyncSetProcessor.js";
import { createSyncVariantProcessor } from "../processors/SyncVariantProcessor.js";

/** Wire thin processors onto a JobQueue (InMemory smoke or later BullMQ workers). */
export function registerCatalogProcessors(
  jobs: JobQueue,
  deps: {
    persistSet: PersistCatalogSetApplicationService;
    persistCard: PersistCatalogCardApplicationService;
    persistVariant: PersistCatalogVariantApplicationService;
  },
): void {
  jobs.registerProcessor(QUEUE_NAMES.catalogSets, createSyncSetProcessor(deps.persistSet));
  jobs.registerProcessor(QUEUE_NAMES.catalogCards, createSyncCardProcessor(deps.persistCard));
  jobs.registerProcessor(
    QUEUE_NAMES.catalogVariants,
    createSyncVariantProcessor(deps.persistVariant),
  );
}
