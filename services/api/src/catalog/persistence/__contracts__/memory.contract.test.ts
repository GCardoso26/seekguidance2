import { describe } from "vitest";
import { getIdGenerator } from "../../../shared/ids/IdGenerator.js";
import { InMemoryTransactionManager } from "../../../platform/transaction/InMemoryTransactionManager.js";
import { InMemoryCatalogCardRepository } from "../InMemoryCatalogCardRepository.js";
import { InMemoryCatalogSetRepository } from "../InMemoryCatalogSetRepository.js";
import { InMemoryCatalogVariantRepository } from "../InMemoryCatalogVariantRepository.js";
import { InMemoryProviderMappingRepository } from "../InMemoryProviderMappingRepository.js";
import { registerCatalogCardRepositoryContract } from "./catalogCard.contract.js";
import { registerCatalogSetRepositoryContract } from "./catalogSet.contract.js";
import { registerCatalogVariantRepositoryContract } from "./catalogVariant.contract.js";
import { registerProviderMappingRepositoryContract } from "./providerMapping.contract.js";
import type { ContractFactory } from "./types.js";

const memoryFactory: ContractFactory = async () => {
  const cards = new InMemoryCatalogCardRepository();
  const sets = new InMemoryCatalogSetRepository();
  const variants = new InMemoryCatalogVariantRepository();
  const mappings = new InMemoryProviderMappingRepository();
  const tx = new InMemoryTransactionManager([cards, sets, variants, mappings]);
  return {
    label: "InMemory",
    tx,
    gameId: getIdGenerator().generate(),
    cards,
    sets,
    variants,
    mappings,
  };
};

describe("Persistence contracts [InMemory]", () => {
  registerCatalogCardRepositoryContract(memoryFactory);
  registerCatalogSetRepositoryContract(memoryFactory);
  registerCatalogVariantRepositoryContract(memoryFactory);
  registerProviderMappingRepositoryContract(memoryFactory);
});
