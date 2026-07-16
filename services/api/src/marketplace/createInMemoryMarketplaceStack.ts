import { InMemoryTransactionManager } from "../platform/transaction/InMemoryTransactionManager.js";
import { InMemoryOutboxRepository } from "../platform/outbox/InMemoryOutboxRepository.js";
import { createMarketplaceApplicationServices } from "./application/createMarketplaceApplicationServices.js";
import { InMemoryInventoryRepository } from "./persistence/InMemoryInventoryRepository.js";
import { InMemoryListingRepository } from "./persistence/InMemoryListingRepository.js";
import { InMemorySellerRepository } from "./persistence/InMemorySellerRepository.js";
import { RepositoryMarketplaceQueryService } from "./read/MarketplaceQueryService.js";

/**
 * In-memory Marketplace stack (Seller → Inventory → Listing) for tests/local.
 * Owns an Outbox so Listing writes emit MarketplaceListingUpdated transactionally.
 */
export function createInMemoryMarketplaceStack() {
  const sellers = new InMemorySellerRepository();
  const inventory = new InMemoryInventoryRepository();
  const listings = new InMemoryListingRepository();
  const outbox = new InMemoryOutboxRepository();
  const tx = new InMemoryTransactionManager([sellers, inventory, listings, outbox]);
  const apps = createMarketplaceApplicationServices({ tx, sellers, inventory, listings, outbox });

  return {
    tx,
    sellers,
    inventory,
    listings,
    outbox,
    ...apps,
    queries: new RepositoryMarketplaceQueryService(tx, sellers, listings),
  };
}
