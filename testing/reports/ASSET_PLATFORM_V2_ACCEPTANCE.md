# ASSET_PLATFORM_V2 — Acceptance

**Date:** 2026-07-22  
**Scope:** Incremental evolution of Universal Asset Ingestion (Product Catalog only; no new BC/events)  
**ADR:** 008 / 009 / 010 / 011 / 015

## Verdict

**PASS (architecture & code)** — Manufacturer kit (13 brands), publisher sealed+expansion (10 TCGs), Asset Quality Score (metadata), Explainable Matching, Source Trust replacement, BullMQ scheduler (daily/hourly), marketplace official auto-select, expanded coverage analytics.

## Criteria

| Criterion | Status |
|-----------|--------|
| No new BC / events / public contract changes | ✅ |
| Manufacturers with manifest/provider/matcher/mapping | ✅ `product-catalog/manufacturers/*` |
| Accessories never auto-link TCG | ✅ `gameCodes: []` |
| Publishers One Piece…Riftbound | ✅ sealed providers + expansion assets |
| Source priority API→site→manifest→Liga | ✅ registry order + SourceTrust |
| Asset Quality Score 0–100 in metadata | ✅ `AssetQualityScore` → ingest metadata |
| Explainable Matching | ✅ `ExplainableMatching` |
| Expansion assets via Asset Pipeline | ✅ `catalog_set` entity + existing roles |
| Scheduler BullMQ incremental | ✅ daily manufacturers / hourly sealed |
| Marketplace official auto-select + override | ✅ MasterCatalogPublishPage |
| Source trust never replaces seller upload | ✅ `store_product` guard |
| Reports | ✅ ASSET_PLATFORM_V2_* |

## Key paths

- `manufacturers/{brand}/{manifest.json,provider.ts,matcher.ts,mapping.ts}`
- `publishers/{game}/provider.ts` + `_shared/expansionAssets.ts`
- `application/{AssetQualityScore,ExplainableMatching,SourceTrust,ExpansionAssetSyncService}.ts`
- `providers/registry.ts`, `scheduler/ProviderScheduler.ts`, `workers/scheduler-tick.ts`
