/**
 * Marketplace Read API process — Sprint 4.
 * GET /api/v1/marketplace/* → MarketplaceQueryService → Listing/Seller repos.
 * Read-only surface; references Catalog IDs only (ADR-007).
 */
import { createLogger } from "../platform/logging/logger.js";
import { createInMemoryMarketplaceStack } from "../marketplace/createInMemoryMarketplaceStack.js";
import { listenMarketplaceReadApi } from "../marketplace/http/createMarketplaceReadServer.js";

const log = createLogger("marketplace-api");

async function main(): Promise<void> {
  const stack = createInMemoryMarketplaceStack();
  const { port } = await listenMarketplaceReadApi({ queries: stack.queries });
  log.info(
    {
      port,
      routes: [
        "GET /api/v1/marketplace/listings?cardId=",
        "GET /api/v1/marketplace/listings/:id",
        "GET /api/v1/marketplace/cards/:cardId/offers",
        "GET /api/v1/marketplace/sellers/:id",
        "GET /api/v1/marketplace/sellers/:id/listings",
      ],
    },
    "marketplace_read_api_started",
  );
}

main().catch((err) => {
  log.error({ err: String(err) }, "marketplace_read_api_boot_failed");
  process.exit(1);
});
