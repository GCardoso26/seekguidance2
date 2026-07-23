# ASSET_INGESTION — Performance

**Date:** 2026-07-22  
**Scope:** Non-blocking ingest characteristics

## Guarantees

| Concern | Approach |
|---------|----------|
| Marketplace / Checkout / Search / Collection | Not on request path — sync via BullMQ workers only |
| Retry / DLQ | Existing product-catalog BullMQ queues + sync_runs |
| Dedup | SHA-256 short-circuits re-upload |
| Liga fallback | Default **off**; rate-limited User-Agent; HTTPS public pages only |
| Drive API | Default **off**; optional merge after manifest |
| Lighthouse | No FE bundle of heavy ingest logic; UX is radio + existing ImageUpload — expect no Lighthouse regression vs Asset Pipeline V2 |

## Ops metrics

`GET /runtime/judge/product-catalog/admin/asset-ingestion-coverage` — coverage %, orphans, duplicates, avg quality. Use for dashboards without a new Analytics BC.

## Post-deploy smoke

1. `catalog.sync.sleeves` dry-run / incremental for Central  
2. Confirm accessories have empty `gameCodes`  
3. `catalog.sync.sealed` Scryfall — assets linked with `SEALED_PRODUCT` mediaType  
4. Coverage endpoint returns accessories + sealed buckets  
5. Seller master publish: official image preselected; custom override still works
