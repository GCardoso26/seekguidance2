import type { Pool } from "pg";
import { createIdempotentHandler } from "../../platform/idempotency/IdempotentCommandHandler.js";
import {
  createMarketplaceOrchestrator,
  type PublishProductListingCommand,
  type PublishProductListingResult,
} from "./MarketplaceOrchestrator.js";

/**
 * Idempotent publish (ADR-009) — key = seller+variant+condition+price+stock hash or client key.
 */
export async function publishProductListingIdempotent(
  pool: Pool,
  cmd: PublishProductListingCommand & { idempotencyKey: string },
): Promise<PublishProductListingResult> {
  const handler = createIdempotentHandler(pool);
  const orch = createMarketplaceOrchestrator(pool);
  return handler.handle(
    {
      name: "PublishProductListing",
      execute: (input) => orch.publishProductListing(input),
    },
    cmd,
    cmd.idempotencyKey,
  );
}
