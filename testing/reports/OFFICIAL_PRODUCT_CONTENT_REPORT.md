# OFFICIAL_PRODUCT_CONTENT_REPORT

**Date:** 2026-07-22

## Entities

- `OfficialProductContents` → `product_catalog.official_product_contents`
- `ProductContentItem` → `product_catalog.product_content_items`
- Types: `ProductContentType`, `ContentQuantity` (numeric), `ContentUnit`

## Service

`OfficialProductContentsService` — upsert replaces item list atomically per product. Source must be official (`source` default `official`).

## Examples modeled (schema-ready)

| Product family | Typical items |
|----------------|---------------|
| Commander Deck | 100 cards, foil cards, tokens, life wheel, deck box, decklist PDF |
| Elite Trainer Box | boosters, sleeves, dice, guide, divider, markers, energy pack |
| Booster Box | N boosters |
| Trove | storage box, guide, boosters |

## API

`GET /runtime/judge/product-catalog/products/{id}/knowledge` → `official_contents`

## Policy

Never infer contents. Only publisher/manufacturer official manifests, PDFs, APIs, marketing kits.
