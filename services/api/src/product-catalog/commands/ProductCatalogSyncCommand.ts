import type { JobEnvelope } from "../../platform/jobs/JobEnvelope.js";
import type { ProductCatalogJobKey } from "../providers/ProductCatalogProvider.js";

export interface ProductCatalogSyncCommandPayload {
  jobKey: ProductCatalogJobKey;
  mode: "full" | "incremental";
  dryRun?: boolean;
}

export type ProductCatalogSyncCommand = JobEnvelope<ProductCatalogSyncCommandPayload>;

export function isProductCatalogSyncCommand(env: JobEnvelope): env is ProductCatalogSyncCommand {
  return env.jobType === "ProductCatalogSyncCommand";
}

export const JOB_KEY_QUEUE_MAP: Record<
  ProductCatalogJobKey,
  import("../../platform/bullmq/queues.js").QueueName
> = {
  "catalog.sync.sealed": "catalog.sync.sealed",
  "catalog.sync.sleeves": "catalog.sync.sleeves",
  "catalog.sync.deckboxes": "catalog.sync.deckboxes",
  "catalog.sync.binders": "catalog.sync.binders",
  "catalog.sync.pages": "catalog.sync.pages",
  "catalog.sync.dice": "catalog.sync.dice",
  "catalog.sync.counters": "catalog.sync.counters",
  "catalog.sync.playmats": "catalog.sync.playmats",
};
