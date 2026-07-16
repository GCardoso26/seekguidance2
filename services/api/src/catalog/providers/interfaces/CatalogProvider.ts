import type { ProviderCapabilities } from "../../registry/ProviderRegistry.js";

export interface SyncContext {
  requestId: string;
  mode: "OFF" | "SHADOW" | "CANARY" | "LIVE";
  full?: boolean;
  flags?: {
    enableImages?: boolean;
    enableVariants?: boolean;
    enableLegality?: boolean;
    enableRulings?: boolean;
  };
}

export interface SyncResult<T = unknown> {
  ok: boolean;
  count: number;
  items?: T[];
  errors?: string[];
  shadow?: boolean;
}

export interface SetDTO {
  providerSetId: string;
  code: string;
  name: string;
  releaseDate?: string;
}

export interface CardDTO {
  providerCardId: string;
  providerSetId?: string;
  name: string;
  normalizedName: string;
  cardNumber?: string;
  rarity?: string;
  language?: string;
  oracleText?: string;
  typeLine?: string;
  artist?: string;
  imageUrl?: string;
  legalities?: Record<string, string>;
  gameData?: Record<string, unknown>;
}

export interface VariantDTO {
  providerVariantId: string;
  finish?: string;
  language?: string;
  isFoil?: boolean;
  label?: string;
}

export interface RulingDTO {
  publishedAt?: string;
  text: string;
  source?: string;
}

export interface ImageJobDTO {
  ownerType: "catalog_card" | "catalog_variant";
  ownerRef: string;
  sourceUrl: string;
  provider: string;
}

/**
 * CatalogProvider — never fetches or writes prices.
 * syncImages only enqueues Media jobs.
 */
export interface CatalogProvider {
  readonly providerId: string;
  readonly gameCode: string;
  readonly capabilities: ProviderCapabilities;

  syncSets(ctx: SyncContext): Promise<SyncResult<SetDTO>>;
  syncCards(ctx: SyncContext, setRef: string): Promise<SyncResult<CardDTO>>;
  syncVariants(ctx: SyncContext, cardId: string): Promise<SyncResult<VariantDTO>>;
  syncImages(ctx: SyncContext, cardId: string): Promise<SyncResult<ImageJobDTO>>;
  syncLegality(ctx: SyncContext, cardId: string): Promise<SyncResult<{ format: string; status: string }>>;
  syncRulings(ctx: SyncContext, cardId: string): Promise<SyncResult<RulingDTO>>;
}
