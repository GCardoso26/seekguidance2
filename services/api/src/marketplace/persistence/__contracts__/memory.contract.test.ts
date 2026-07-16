import { describe } from "vitest";
import { getIdGenerator } from "../../../shared/ids/IdGenerator.js";
import { InMemoryTransactionManager } from "../../../platform/transaction/InMemoryTransactionManager.js";
import { InMemoryInventoryRepository } from "../InMemoryInventoryRepository.js";
import { InMemoryListingRepository } from "../InMemoryListingRepository.js";
import { InMemorySellerRepository } from "../InMemorySellerRepository.js";
import { registerInventoryRepositoryContract } from "./inventory.contract.js";
import { registerListingRepositoryContract } from "./listing.contract.js";
import { registerSellerRepositoryContract } from "./seller.contract.js";
import type { MarketplaceContractFactory } from "./types.js";

const memoryFactory: MarketplaceContractFactory = async () => {
  const sellers = new InMemorySellerRepository();
  const inventory = new InMemoryInventoryRepository();
  const listings = new InMemoryListingRepository();
  const tx = new InMemoryTransactionManager([sellers, inventory, listings]);
  return {
    label: "InMemory",
    ns: `mem-${getIdGenerator().generate().slice(0, 8)}`,
    tx,
    sellers,
    inventory,
    listings,
  };
};

describe("Marketplace persistence contracts [InMemory]", () => {
  registerSellerRepositoryContract(memoryFactory);
  registerInventoryRepositoryContract(memoryFactory);
  registerListingRepositoryContract(memoryFactory);
});
