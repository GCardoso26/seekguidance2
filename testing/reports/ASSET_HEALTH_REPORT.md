# ASSET_HEALTH_REPORT

**Date:** 2026-07-22  
**Scope:** Asset Health Engine + admin endpoint (no Analytics BC / no full dashboard)

## Delivered

- `computeAssetHealthScore` (weighted components)
- `AssetHealthService.computeReport` + snapshot table
- `GET /runtime/judge/product-catalog/admin/asset-health`
- FE BFF `/api/product-catalog/admin/asset-health`
- Scheduler `--health` / `PRODUCT_CATALOG_ASSET_HEALTH_REFRESH=1`

## DTO

overall, perPublisher, perManufacturer, perGame, perExpansion, perAssetType, orphans, duplicates, missingHero/Gallery/Derivatives/Metadata, qualityDistribution, trustDistribution
