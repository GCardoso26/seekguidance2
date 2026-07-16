import type { TxContext } from "../../platform/transaction/types.js";
import type { RepositoryResult } from "../../shared/persistence/RepositoryResult.js";
import type { ProviderMapping, ProviderMappingUpsert, ProviderObjectType } from "./models.js";

/** Aggregate Root: ProviderMapping (bridge provider ↔ catalog). */
export interface ProviderMappingRepository {
  upsert(tx: TxContext, input: ProviderMappingUpsert): Promise<RepositoryResult<ProviderMapping>>;
  findById(tx: TxContext, id: string): Promise<ProviderMapping | null>;
  findByProviderObject(
    tx: TxContext,
    provider: string,
    providerObjectType: ProviderObjectType,
    keys: {
      providerCardId?: string | null;
      providerSetId?: string | null;
      providerVariantId?: string | null;
    },
  ): Promise<ProviderMapping | null>;
  /** CARD identity: Scryfall card id is globally unique — ignore set key drift. */
  findByProviderCardId(
    tx: TxContext,
    provider: string,
    providerCardId: string,
  ): Promise<ProviderMapping | null>;
}
