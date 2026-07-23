# ASSET_INGESTION — Integration

**Date:** 2026-07-22  
**Scope:** Unit/integration coverage for ingest matching, Central sources, Liga parser, mediaType mapping

## Tests

| Suite | Path | Focus |
|-------|------|-------|
| ImageMatchScorer | `services/api/src/product-catalog/application/__tests__/ImageMatchScorer.test.ts` | Name-only rejection; accessory/sealed auto-link |
| mediaTypeForCategory | `.../__tests__/mediaTypeForCategory.test.ts` | SEALED_* vs ACCESSORY_* |
| Central sources | `.../sources/central/__tests__/CentralSources.test.ts` | Manifest load; Drive mapping; no game |
| Liga fallback | `.../providers/sealed/__tests__/LigaPublicImageFallback.test.ts` | og:image only; no price/description |

## Runtime jobs

| Job | Providers |
|-----|-----------|
| `catalog.sync.sealed` | Scryfall, Pokémon TCG API, Lorcana JSON, Liga FF |
| `catalog.sync.sleeves` | Central, Gamegenic, Dragon Shield, UG, Ultra PRO |
| `catalog.sync.deckboxes` | Central, Gamegenic, UG, Ultra PRO |
| `catalog.sync.binders` | Central, UG, Vault X |
| `catalog.sync.counters` | Central |
| `catalog.sync.playmats` | Central, Ultra PRO |

## Feature flags (env)

- `PRODUCT_CATALOG_CENTRAL_DRIVE_API` + `GOOGLE_DRIVE_API_KEY`
- `PRODUCT_CATALOG_LIGA_IMAGE_FALLBACK` + `PRODUCT_CATALOG_LIGA_SEED_URLS`
- `POKEMONTCG_API_KEY` (optional for higher Pokémon rate limits)

## Async path

BullMQ `catalog.sync.*` → `ProductCatalogSyncService` → `AssetService.ingest` → `AssetMediaPipeline` → R2/CDN → `platform.domain_events` / EventBus. Marketplace/Checkout untouched.
