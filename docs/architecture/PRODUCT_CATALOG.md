# Catálogo Mestre (Product Catalog)

Módulo **desacoplado do catálogo de cartas**, responsável por produtos selados e acessórios compartilhados entre lojistas.

## Domínios adjacentes (v2+)

| Domínio | Doc |
|---------|------|
| **Marketplace (orquestrador)** | [MARKETPLACE_ORCHESTRATOR.md](./MARKETPLACE_ORCHESTRATOR.md) |
| **Saga / Process Manager** | [SAGA_PROCESS_MANAGER.md](./SAGA_PROCESS_MANAGER.md) |
| **Pricing** | [PRICING_DOMAIN.md](./PRICING_DOMAIN.md) |
| **Inventory** | [INVENTORY_DOMAIN.md](./INVENTORY_DOMAIN.md) |
| Events | `platform.domain_events` |
| Scheduler | `ProviderScheduler` + `npm run scheduler:tick` |
| Quality | `quality_score` + `/product-catalog/quality` |
| Import Monitor | `/admin/import-monitor` |
| Hybrid Search | `HybridProductSearch` + embeddings |
| CDN | `buildDerivativeSet` (thumb/sm/md/lg) |
| Revisions / i18n | `product_revisions`, `product_translations` |

## Asset Service (prioridade)

Imagens vivem em **`media.assets`** + **`media.asset_links`** (polimórfico: `product_variant`, `catalog_card`, `manufacturer`, `banner`…).

- Ingestão: `src/assets/AssetService.ts`
- Pipeline: virus scan (opcional) → SHA256 → derivados WebP/AVIF/thumb/blurhash (flags) → CDN/R2
- **Uma imagem, N entidades** — dedup por `sha256`

`product_catalog.images` fica legado; novos syncs usam apenas assets.

## Domínio produto

| Conceito | Tabela |
|----------|--------|
| Fabricante / marca | `manufacturers`, `brands`, `*_aliases` |
| Produto | `products` (+ `product_type`, `collection_id`, `search_vector`) |
| Variante | `variants` (+ `fingerprint`) |
| Atributos EAV | `product_attributes` (variant_id, key, value) |
| TCGs M:N | `games`, `product_games` |
| Coleções | `collections` |
| Oferta lojista | `seller_products` |
| Histórico | `seller_price_history`, `seller_stock_history` (trigger) |
| Alertas | `variant_subscriptions` |

### Deduplicação

1. SKU → 2. EAN → 3. **fingerprint** → 4. título normalizado → 5. hash de imagem (asset)

Fingerprint: tokens estáveis (`brand|texture|color|capacity|…`).

### ProductType

`Accessory`, `Sealed`, `Storage`, `Dice`, … — mapeado de `Category` via `CATEGORY_TO_PRODUCT_TYPE`.

## Providers

Interface `ProductCatalogProvider` + **`ProductCatalogProviderRegistry`** (`register`, `getProvider`, `getProvidersByCategory`, `schedule`, `healthReport`).

- Sync **incremental**: `syncSince` no contexto + `syncProductsSince` nos providers
- Falhas: BullMQ DLQ (filas existentes) + webhook `PRODUCT_CATALOG_SYNC_WEBHOOK_URL` / Slack / Discord
- Health persistido em `product_catalog.provider_registry`

## Filas (BullMQ)

Comandos `ProductCatalogSyncCommand` — ADR-002.

## CLI

```bash
npm run sync:sealed
npm run sync:sleeves -- --since 2026-01-01T00:00:00Z
npm run catalog:remediate-p0 -- --sealed-only   # bootstrap + sealed only
npm run catalog:remediate-p0                   # sealed first, then accessories
```

## Operação (MVP)

| Peça | Onde |
|------|------|
| Sync inline sealed | `cron-entrypoint sealed` / GH `product-catalog-sync.yml` hourly |
| Accessories | `cron-entrypoint accessories` / GH daily 08:30 UTC |
| Scheduler tick | `cron-entrypoint tick` → BullMQ enqueue |
| Workers | `Dockerfile.workers` + `BULLMQ_WORKERS=1` (processa sync de verdade) |
| Render | `tcg-judge-pc-workers` + crons sealed/accessories/tick em `render.yaml` |

Import Monitor: `/admin/import-monitor` — providers `SEALED_PRODUCT` devem sair de `bootstrapped` após o primeiro sync.

## Busca

PostgreSQL: `tsvector` (português) + **pg_trgm** (`title_pt % query`) + filtros por `product_games`.

`pgvector` reservado para embeddings (coluna futura).

## API

Interna: `/runtime/judge/product-catalog/*`  
Pública (parceiros): `/runtime/judge/catalog/products`, `/variants`, `/search`, `/manufacturers`, `/brands`, `/games`

## UI

- Admin: `/admin/product-catalog`
- Lojista: `/vendedor/painel/catalogo/produtos/catalogo-mestre`
