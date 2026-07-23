# ASSET_VERSIONING_REPORT

**Date:** 2026-07-22  
**Scope:** Asset version history as Product Catalog extension (Asset BC public API untouched)

## Delivered

- Table `product_catalog.asset_version_history`
- `AssetVersioningService`: append, history, compare, restore (append restore copy), reprocess
- Sync path appends version after `AssetService.ingest` (never deletes prior versions)
- API `GET /runtime/judge/product-catalog/assets/{asset_id}/versions`

## Fields per version

source, sourceTrust, qualityScore, hash, width, height, format, size, createdAt, createdBy, pipelineVersion, derivatives, metadata
