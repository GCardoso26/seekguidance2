import type { TransactionManager } from "../../platform/transaction/types.js";
import type { OutboxRepository } from "../../platform/outbox/types.js";
import type { InventoryRepository } from "../domain/InventoryRepository.js";
import type { ListingRepository } from "../domain/ListingRepository.js";
import type { SellerRepository } from "../domain/SellerRepository.js";
import { AdjustInventoryApplicationService } from "./AdjustInventoryApplicationService.js";
import { PublishListingApplicationService } from "./PublishListingApplicationService.js";
import { RegisterSellerApplicationService } from "./RegisterSellerApplicationService.js";

/** Composition root — wires Marketplace Application Services over any adapters. */
export function createMarketplaceApplicationServices(deps: {
  tx: TransactionManager;
  sellers: SellerRepository;
  inventory: InventoryRepository;
  listings: ListingRepository;
  outbox: OutboxRepository;
}) {
  return {
    registerSeller: new RegisterSellerApplicationService(deps.tx, deps.sellers),
    adjustInventory: new AdjustInventoryApplicationService(deps.tx, deps.inventory),
    publishListing: new PublishListingApplicationService(deps.tx, deps.listings, deps.outbox),
  };
}
