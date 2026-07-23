# PRODUCT_RELATIONSHIP_ENGINE_REPORT

**Date:** 2026-07-22  
**Scope:** Official Product Relationship Engine inside Product Catalog (no AI)

## Delivered

- Table `product_catalog.product_relationships`
- Types: contains, contained_in, compatible_with, recommended_with, replacement_for, variant_of, bundle_of, requires, accessory_for, expansion_of, collection_of, promo_for, includes, included_by
- `ProductRelationshipRepository` + `ProductRelationshipService`
- API `GET /runtime/judge/product-catalog/products/{id}/relationships`
- Marketplace `OfficialRelatedProducts` + BFF proxy
- Search secondary boost via `HybridProductSearch` (+0.05 max per related hit; never replaces lexical ranking)

## ADR

008–011 / 015 — Product Catalog extension only; existing events unchanged.
