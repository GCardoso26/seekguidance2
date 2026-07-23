# PRODUCT_KNOWLEDGE_GRAPH_REPORT

**Date:** 2026-07-22  
**Scope:** Product Catalog Platform V4 — Knowledge Graph (official sources only, no AI)

## Structure

```
Publisher → Game → Expansion → Collection → Product → Variant
  → Official Contents → Specifications → Relationships → Assets → Marketing → Metadata
```

All nodes use persistent UUIDs in `product_catalog.*`.

## Delivered nodes

| Node | Storage |
|------|---------|
| Publisher | `product_catalog.publishers` |
| Game | existing `product_catalog.games` + product.game |
| Collection | enriched `product_catalog.collections` |
| Product / Variant | existing tables + lifecycle / product_family / taxonomy fields |
| Official Contents | `official_product_contents` + `product_content_items` |
| Specifications | `product_specifications` |
| Relationships | extended `product_relationships` (product + game/entity) |
| Assets / Marketing | `product_asset_packages` + Asset Pipeline |
| Metadata | `product_official_metadata` |

## Consumers

- Marketplace PDP: `ProductKnowledgePanel` + related products
- Portal: `/portal/catalog/collections/[slug]`
- Search: secondary affinity boosts only
- Admin: `/admin/knowledge-coverage`

## Constraints honored

- No new BC / events / public Asset API break
- No AI inference
- Incremental extension of Product Catalog only
