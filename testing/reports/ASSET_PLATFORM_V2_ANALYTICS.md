# ASSET_PLATFORM_V2 — Analytics

**Date:** 2026-07-22

## Endpoint

`GET /runtime/judge/product-catalog/admin/asset-ingestion-coverage`

## Metrics

- Cobertura acessórios / selados / sem imagem
- Por fabricante, publisher, TCG, expansão, categoria
- Asset Score médio (`averageAssetScore` via metadata)
- Top fabricantes / publishers
- Órfãos / duplicados
- Assets substituídos / atualizados (domain_events window)
- Coverage histórico (14 dias)

No Analytics BC — Product Catalog admin surface only (ADR-015).
