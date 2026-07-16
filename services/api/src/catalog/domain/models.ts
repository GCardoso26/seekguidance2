export type ProviderObjectType = "CARD" | "SET" | "VARIANT" | "SEALED" | "DECK" | "TOKEN";

export interface CatalogSet {
  id: string;
  gameId: string;
  code: string;
  name: string;
  releaseDate: string | null;
  rowVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CatalogSetUpsert {
  id?: string;
  gameId: string;
  code: string;
  name: string;
  releaseDate?: string | null;
  /** Optimistic lock — reject if DB version differs. */
  expectedVersion?: number;
}

export interface CatalogCard {
  id: string;
  gameId: string;
  setId: string | null;
  name: string;
  normalizedName: string;
  cardNumber: string | null;
  rarity: string | null;
  language: string;
  oracleText: string | null;
  typeLine: string | null;
  artist: string | null;
  gameData: Record<string, unknown>;
  rowVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CatalogCardUpsert {
  id?: string;
  gameId: string;
  setId?: string | null;
  name: string;
  normalizedName: string;
  cardNumber?: string | null;
  rarity?: string | null;
  language?: string;
  oracleText?: string | null;
  typeLine?: string | null;
  artist?: string | null;
  gameData?: Record<string, unknown>;
  expectedVersion?: number;
}

export interface CatalogVariant {
  id: string;
  cardId: string;
  finish: string | null;
  language: string | null;
  isFoil: boolean;
  label: string | null;
  metadata: Record<string, unknown>;
  rowVersion: number;
  createdAt: Date;
}

export interface CatalogVariantUpsert {
  id?: string;
  cardId: string;
  finish?: string | null;
  language?: string | null;
  isFoil?: boolean;
  label?: string | null;
  metadata?: Record<string, unknown>;
  expectedVersion?: number;
}

export interface ProviderMapping {
  id: string;
  provider: string;
  providerObjectType: ProviderObjectType;
  providerCardId: string | null;
  providerSetId: string | null;
  providerVariantId: string | null;
  catalogCardId: string | null;
  catalogSetId: string | null;
  catalogVariantId: string | null;
  metadata: Record<string, unknown>;
  rowVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProviderMappingUpsert {
  id?: string;
  provider: string;
  providerObjectType: ProviderObjectType;
  providerCardId?: string | null;
  providerSetId?: string | null;
  providerVariantId?: string | null;
  catalogCardId?: string | null;
  catalogSetId?: string | null;
  catalogVariantId?: string | null;
  metadata?: Record<string, unknown>;
  expectedVersion?: number;
}

export function normalizeCardName(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}
