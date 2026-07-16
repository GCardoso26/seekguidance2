import type { TransactionManager } from "../../platform/transaction/types.js";
import type { OutboxRepository } from "../../platform/outbox/types.js";
import type { CatalogCardRepository } from "../domain/CatalogCardRepository.js";
import type { CatalogSetRepository } from "../domain/CatalogSetRepository.js";
import type { CatalogVariantRepository } from "../domain/CatalogVariantRepository.js";
import type { ProviderMappingRepository } from "../domain/ProviderMappingRepository.js";
import { PersistCatalogCardApplicationService } from "./PersistCatalogCardApplicationService.js";
import { PersistCatalogSetApplicationService } from "./PersistCatalogSetApplicationService.js";
import { PersistCatalogVariantApplicationService } from "./PersistCatalogVariantApplicationService.js";

export function createCatalogApplicationServices(deps: {
  tx: TransactionManager;
  sets: CatalogSetRepository;
  cards: CatalogCardRepository;
  variants: CatalogVariantRepository;
  mappings: ProviderMappingRepository;
  outbox: OutboxRepository;
}) {
  return {
    persistSet: new PersistCatalogSetApplicationService(
      deps.tx,
      deps.sets,
      deps.mappings,
      deps.outbox,
    ),
    persistCard: new PersistCatalogCardApplicationService(
      deps.tx,
      deps.cards,
      deps.mappings,
      deps.outbox,
    ),
    persistVariant: new PersistCatalogVariantApplicationService(
      deps.tx,
      deps.variants,
      deps.mappings,
      deps.outbox,
    ),
  };
}
