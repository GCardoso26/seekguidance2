/**
 * PricingProvider — only catalog_card_id, variant_id, provider_mappings.
 */
export interface ProviderMapping {
  provider: string;
  providerObjectType: "CARD" | "SET" | "VARIANT" | "SEALED" | "DECK" | "TOKEN";
  providerCardId?: string;
  providerSetId?: string;
  providerVariantId?: string;
}

export interface PriceSyncContext {
  catalogCardId: string;
  variantId?: string;
  providerMappings: ProviderMapping[];
  requestId: string;
}

export interface PriceSnapshotDTO {
  minPrice?: number;
  avgPrice?: number;
  marketPrice?: number;
  maxPrice?: number;
  currency: "USD" | "EUR" | "JPY";
  condition?: string;
  printing?: string;
  language?: string;
  finish?: string;
  sellerCount?: number;
  lastSale?: number;
  lastSaleDate?: string;
}

export interface PricingProvider {
  readonly marketId: string;
  syncPrices(ctx: PriceSyncContext): Promise<{ ok: boolean; snapshots: PriceSnapshotDTO[] }>;
  syncMarket(ctx: PriceSyncContext): Promise<{ ok: boolean }>;
  syncHistory(ctx: PriceSyncContext): Promise<{ ok: boolean }>;
}
