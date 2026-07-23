# ASSET_INGESTION — Acceptance

**Date:** 2026-07-22  
**Scope:** Official image ingestion for Accessories + Sealed products (Product Catalog + Assets)  
**ADR:** 008 / 009 / 010 / 011 / 015 — no new BC; existing events only; public APIs

## Verdict

**PASS (architecture & code)** — Hybrid Central (manifest + Drive FF), Gamegenic manifest, sealed API providers (Scryfall/Pokémon/Lorcana), Liga public-image fallback (FF), ImageMatchScorer, AssetCreated/ProductImported/MediaUpdated emission, coverage metrics, seller official-vs-custom image UX.

## Criteria

| Criterion | Status |
|-----------|--------|
| No new Bounded Context | ✅ Extends product-catalog + assets |
| No new event contracts | ✅ `AssetCreated.v1`, `ProductImported.v1`, `MediaUpdated.v1` + `search.reindex` payload hint |
| Accessories never auto-link TCG | ✅ Central/Gamegenic `gameCodes: []` |
| Sealed require game/expansion | ✅ Scryfall/Pokémon/Lorcana set `game` + `collectionName` |
| Source priority API → official → Liga FF | ✅ Registry order + Liga behind `PRODUCT_CATALOG_LIGA_IMAGE_FALLBACK` |
| SHA-256 dedup | ✅ Existing `AssetService` / pipeline |
| Confidence matching | ✅ `ImageMatchScorer` threshold 0.85 |
| Seller override preserved | ✅ Master catalog official vs custom + ProductsPage upload |
| Coverage analytics | ✅ `/product-catalog/admin/asset-ingestion-coverage` |
| Reports | ✅ This suite |

## Key paths

- BE: `product-catalog/application/ImageMatchScorer.ts`, `AssetService.ts`, `sources/central/*`, `providers/accessories/Central*`, `GamegenicProviders.ts`, `providers/sealed/*`, `AssetIngestionCoverage.ts`
- FE: `MasterCatalogPublishPage.tsx`, `ProductsPage.tsx`, `media-catalog.ts` ACCESSORY_KINDS
- API: `product_catalog_api.py` coverage endpoint
