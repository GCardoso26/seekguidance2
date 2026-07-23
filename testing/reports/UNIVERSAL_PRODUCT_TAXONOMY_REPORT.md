# UNIVERSAL_PRODUCT_TAXONOMY_REPORT

**Date:** 2026-07-22

## Navigation path

```
Publisher → Game → Category → SubCategory → Product Family → Product → Variant
```

## Fields

- `products.publisher_id` → `publishers`
- `products.game`, `category`, `subcategory` (existing)
- `products.product_family`, `product_line`, `edition`, `series`
- Helpers: `UniversalTaxonomy.taxonomyBreadcrumb` / `parseTaxonomyQuery`

## Examples

- Magic → Sealed → Booster → Play Booster → Final Fantasy → Japanese
- Pokémon → Accessory → Sleeves → Pokémon Center → Charizard → 2026 Edition

## Lifecycle (publisher-sourced)

`ANNOUNCED | PREVIEW | PREORDER | AVAILABLE | LOW_STOCK | OUT_OF_PRINT | DISCONTINUED | HISTORICAL`

Marketplace may filter by lifecycle without new BC.
