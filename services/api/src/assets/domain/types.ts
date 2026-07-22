/**
 * Asset Pipeline V2 — domain types (extends existing Assets module).
 */
import type { MediaType } from "./mediaTypes.js";

export type AssetEntityType =
  | "product_variant"
  | "catalog_card"
  | "catalog_variant"
  | "catalog_set"
  | "manufacturer"
  | "brand"
  | "collection"
  | "banner"
  | "store"
  | "store_product"
  | "deck"
  | "profile"
  | "game"
  | "news"
  | "event";

export type AssetRole =
  | "primary"
  | "front"
  | "gallery"
  | "logo"
  | "thumbnail"
  | "hero"
  | "hero_mobile"
  | "hero_overlay"
  | "hero_fallback"
  | "banner"
  | "background"
  | "key_art"
  | "wallpaper"
  | "icon"
  | "lifestyle"
  | "transparent"
  | "cover"
  | "share";

export interface AssetMetadata {
  alt?: string;
  caption?: string;
  copyright?: string;
  provider?: string;
  source?: string;
  license?: string;
  hash?: string;
  width?: number;
  height?: number;
  mime?: string;
  checksum?: string;
  mediaType?: MediaType;
  dominantColor?: string;
  palette?: string[];
  aspectRatio?: number;
  lqip?: string;
}

export interface AssetRecord {
  id: string;
  sha256: string;
  storageKey?: string | null;
  width?: number | null;
  height?: number | null;
  mime?: string | null;
  sizeBytes?: number | null;
  blurhash?: string | null;
  cdnUrl?: string | null;
  derivatives?: Record<string, unknown>;
  metadata?: AssetMetadata | null;
}

export interface AssetLinkInput {
  assetId: string;
  entityType: AssetEntityType;
  entityId: string;
  role?: AssetRole;
  sortOrder?: number;
}

export interface IngestAssetInput {
  sourceUrl: string;
  requestId: string;
  entityType: AssetEntityType;
  entityId: string;
  role?: AssetRole;
  sortOrder?: number;
  providerId?: string;
  mediaType?: MediaType;
  metadata?: Partial<AssetMetadata>;
}

export interface IngestAssetResult {
  asset: AssetRecord;
  reused: boolean;
  linkCreated: boolean;
}
