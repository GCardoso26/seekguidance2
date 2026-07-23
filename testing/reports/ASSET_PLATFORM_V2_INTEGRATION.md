# ASSET_PLATFORM_V2 — Integration

**Date:** 2026-07-22

## Test suites

| Area | File |
|------|------|
| Quality / Explainable / Trust / Manufacturers / Expansion | `services/api/src/product-catalog/application/__tests__/AssetPlatformV2.test.ts` |
| Legacy ImageMatch / Central / Liga | existing `ASSET_INGESTION_*` suites |

## Jobs

| Job | Notes |
|-----|-------|
| `catalog.sync.sleeves|deckboxes|binders|dice|counters|playmats` | All manufacturer providers |
| `catalog.sync.sealed` | Scryfall, Pokémon, Lorcana, One Piece, Digimon, DBFW, SWU, FAB, YGO, Riftbound, Liga FF |
| `scheduler-tick --bootstrap` | Registers daily (accessories) / hourly (sealed) |
| `scheduler-tick --expansion` | Expansion assets → `catalog_set` |

## Flags

- `PRODUCT_CATALOG_LIGA_IMAGE_FALLBACK`
- `PRODUCT_CATALOG_CENTRAL_DRIVE_API`
- `PRODUCT_CATALOG_SYNC_EXPANSION=1`
