/**
 * Asset Version History — Product Catalog extension.
 * Does not alter Assets BC public API; stores history by asset_id.
 */

export interface AssetVersionRecord {
  id: string;
  assetId: string;
  entityType: string;
  entityId: string;
  versionNumber: number;
  source: string;
  sourceTrust: number;
  qualityScore: number;
  sha256: string;
  width?: number | null;
  height?: number | null;
  format?: string | null;
  sizeBytes?: number | null;
  cdnUrl?: string | null;
  pipelineVersion: string;
  derivatives: Record<string, unknown>;
  metadata: Record<string, unknown>;
  createdBy?: string | null;
  createdAt: string;
  isCurrent: boolean;
}

export interface AppendAssetVersionInput {
  assetId: string;
  entityType: string;
  entityId: string;
  source: string;
  sourceTrust: number;
  qualityScore: number;
  sha256: string;
  width?: number | null;
  height?: number | null;
  format?: string | null;
  sizeBytes?: number | null;
  cdnUrl?: string | null;
  pipelineVersion?: string;
  derivatives?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdBy?: string | null;
}

export interface AssetVersionDiff {
  fromVersion: number;
  toVersion: number;
  changed: string[];
  from: Partial<AssetVersionRecord>;
  to: Partial<AssetVersionRecord>;
}
