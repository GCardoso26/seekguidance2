/**
 * Universal official metadata schema — all providers map into this shape.
 * No free-form provider bags as SoT.
 */

import type { ProductLifecycle } from "./knowledge.js";

export interface UniversalProductMetadata {
  publisher?: string | null;
  manufacturer?: string | null;
  game?: string | null;
  expansion?: string | null;
  collection?: string | null;
  series?: string | null;
  releaseDate?: string | null;
  language?: string | null;
  country?: string | null;
  msrpCents?: number | null;
  sku?: string | null;
  upc?: string | null;
  ean?: string | null;
  isbn?: string | null;
  weightGrams?: number | null;
  dimensions?: {
    widthMm?: number;
    heightMm?: number;
    depthMm?: number;
  };
  contents?: string | null;
  materials?: string | null;
  finish?: string | null;
  rarity?: string | null;
  productLine?: string | null;
  productFamily?: string | null;
  edition?: string | null;
  legalStatus?: string | null;
  lifecycle?: ProductLifecycle | null;
  assetTrust?: number | null;
  assetScore?: number | null;
}

export const UNIVERSAL_METADATA_KEYS = [
  "publisher",
  "manufacturer",
  "game",
  "expansion",
  "collection",
  "series",
  "releaseDate",
  "language",
  "country",
  "msrpCents",
  "sku",
  "upc",
  "ean",
  "isbn",
  "weightGrams",
  "dimensions",
  "contents",
  "materials",
  "finish",
  "rarity",
  "productLine",
  "productFamily",
  "edition",
  "legalStatus",
  "lifecycle",
  "assetTrust",
  "assetScore",
] as const;

export function metadataCompleteness(meta: UniversalProductMetadata): number {
  let filled = 0;
  for (const k of UNIVERSAL_METADATA_KEYS) {
    const v = meta[k as keyof UniversalProductMetadata];
    if (v == null || v === "") continue;
    if (typeof v === "object" && !Object.keys(v as object).length) continue;
    filled++;
  }
  return Math.round((filled / UNIVERSAL_METADATA_KEYS.length) * 1000) / 10;
}
