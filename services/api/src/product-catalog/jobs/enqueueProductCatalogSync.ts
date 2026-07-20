import { randomUUID } from "node:crypto";
import { enqueue } from "../../platform/bullmq/client.js";
import { createJobEnvelope } from "../../platform/jobs/JobEnvelope.js";
import {
  JOB_KEY_QUEUE_MAP,
  type ProductCatalogSyncCommandPayload,
} from "../commands/ProductCatalogSyncCommand.js";
import type { ProductCatalogJobKey } from "../providers/ProductCatalogProvider.js";

export async function enqueueProductCatalogSync(
  jobKey: ProductCatalogJobKey,
  opts: { mode?: "full" | "incremental"; dryRun?: boolean; priority?: "HIGH" | "NORMAL" | "LOW" } = {},
): Promise<string> {
  const requestId = randomUUID();
  const payload: ProductCatalogSyncCommandPayload = {
    jobKey,
    mode: opts.mode ?? "incremental",
    dryRun: opts.dryRun,
  };
  const envelope = createJobEnvelope("ProductCatalogSyncCommand", payload, {
    requestId,
    providerId: "product-catalog",
    gameCode: "MASTER",
    priority: opts.priority,
  });
  const queue = JOB_KEY_QUEUE_MAP[jobKey];
  return enqueue(queue, "ProductCatalogSyncCommand", envelope as unknown as Record<string, unknown>, opts.priority);
}
