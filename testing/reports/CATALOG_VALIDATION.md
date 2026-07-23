# CATALOG_VALIDATION

**Date:** 2026-07-23  
**Result:** **PASS (operational MVP) / PARTIAL (coverage)**

## Tables

| Table / metric | Count |
|----------------|------:|
| products | 260 |
| variants | 260 |
| manufacturers / brands | 13 / 13 |
| publishers / games | 8 / 12 |
| provider_registry / sync_runs | 89 / 79 |
| official_product_contents | 1 |
| product_specifications | 1 |
| product_official_metadata | 3 |
| collections / relationships / asset_packages | 0 / 0 / 0 |

## Integrity

- P2 uniques: `uq_product_asset_packages_identity`, `uq_collections_code` present  
- P3 RLS: 28/28 enabled; anon/authenticated USAGE=false  

## Marketplace link

`store_products=14878`, `master_variant_id` filled = **1** (publish/link path remediado; bulk singles fora do escopo accessory).

## Verdict

Catálogo mestre **operacional** pós P0; cobertura knowledge ainda **esparsa**.
