# PRODUCT_COLLECTIONS_REPORT

**Date:** 2026-07-22

## Enrichment

`product_catalog.collections` gained: `publisher_id`, `code`, `slug`, `description`, `expansion_code`, `language`, `region`, `official`.

## Service

`ProductCollectionsService` — upsert by code/slug, attach products via `products.collection_id`.

## Portal

- API: `GET /runtime/judge/product-catalog/collections/{slug}`
- BFF: `/api/product-catalog/collections/[slug]`
- Page: `/portal/catalog/collections/[slug]` — “Veja todos os produtos desta coleção”

## Examples

- Final Fantasy collection → Play/Collector Boosters, Bundle, Commander Deck, Starter/Gift
- Pokémon Scarlet & Violet → ETB, Booster Box, Mini Tin, Premium/Poster Collections
