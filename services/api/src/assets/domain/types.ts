export type AssetEntityType =
  | "product_variant"
  | "catalog_card"
  | "catalog_variant"
  | "manufacturer"
  | "brand"
  | "collection"
  | "banner"
  | "store";

export type AssetRole = "primary" | "gallery" | "logo" | "thumbnail" | "hero";

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
}

export interface IngestAssetResult {
  asset: AssetRecord;
  reused: boolean;
  linkCreated: boolean;
}
