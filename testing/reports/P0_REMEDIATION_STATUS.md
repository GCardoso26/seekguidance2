# P0_REMEDIATION_STATUS

**Date:** 2026-07-22/23  
**Plan:** `REMEDIATION_PLAN_P0_P1.md`

## Results (produção `rjgzaakhzuzdzcooywva`)

| Metric | Before | After |
|--------|-------:|------:|
| `provider_registry` | 0 | **89** |
| `products` | 0 | **260** |
| `variants` | 0 | **260** |
| `manufacturers` | 0 | **13** |
| Listings com `master_variant_id` | 0 | **1** |
| Sleeves linkados | 0 | **1 / 1** |

## BUG status

| ID | Status | Notes |
|----|--------|-------|
| BUG-V4-002 | **CLOSED** | Scheduler cols + bootstrap migration + script |
| BUG-V4-001 | **CLOSED** (manufacturers) | Manifests syncados; sealed APIs ainda não full-sync nesta corrida |
| BUG-V4-013 | **CLOSED** (path) | Shop API expõe `master_product_id`; linker SKU/title + fallback sleeve; 14877 singles fora de escopo |

## Artefatos

- `npm run catalog:remediate-p0`
- `MasterListingLinkService.ts`
- `remediate-p0-catalog.ts`
- Migration `20260722240000_provider_registry_bootstrap_p0.sql`
- `shop_products.get_product` JOIN variants

## Residual / próximo

- Image CDN placeholders (`judgetcg.example`) → fetch failed (P2 asset URLs).  
- P1: auth admin, GET coverage read-only, wire contents/specs, E2E.  
- Sealed publishers sync (Scryfall etc.) quando APIs disponíveis.
