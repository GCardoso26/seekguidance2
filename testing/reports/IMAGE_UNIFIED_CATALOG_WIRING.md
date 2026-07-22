# Image Insertion — Unified Catalog Wiring (evidência)

**Data:** 2026-07-22  
**Escopo:** Auditoria + wiring FE mínimo (sem novo BC)  
**ADRs:** 008–011, 015 respeitados (sem schema/BC novo nesta sessão)

## Inventário (pré-código)

| Superfície | Status | Evidência |
|------------|--------|-----------|
| AssetService + AssetMediaPipeline (código) | OK / storage partial | `services/api/src/assets/*` |
| HTTP upload lojista → AssetService | **missing** | Sem rota HTTP; `ImageUpload` não ligado ao painel |
| CARD → `media.assets` | **missing** | Providers geram ImageJobDTO; sem bridge ingest |
| SEALED/ACCESSORY → assets (código sync) | OK no código | `ProductCatalogSyncService.persistOne` → `assets.ingest` |
| Prod em DB: `media.assets` / `asset_links` | **FAIL** | Supabase `TCG-SaaS`: tabelas **não existem** |
| Prod: `media.media_assets` | legado vazio | 0 rows; schema diferente do AssetService |
| Prod: `product_catalog` schema | **ausente** | `product_catalog_schema=false` |
| CARD legado `image_url` | SoT ativa | `131500` cards com `image_url` em `tcg_judge.card_catalog` |
| FE `resolveCardAsset` | partial → wired | Antes só testes; agora `cardImageUrl` / `cardImageUrlForList` |
| PDV thumbs | missing → wired | Dados `images[]` existiam; UI ignorava |
| Master catalog publish thumbs | partial → wired | Agora `CardImage` + `mediaTypeFromCategory` |
| Marketplace ProductCard | partial → wired | `mediaType` por categoria |
| Filtros unificados CARD/SEALED/ACCESSORY | missing | Taxonomias ainda fragmentadas (fora de escopo mínimo) |

## Diff FE (esta sessão)

- `lib/assets/product-media-type.ts` — mapa categoria → MediaType
- `lib/format-currency.ts` — `cardImageUrl*` via `resolveCardAsset` / `resolveHdCardAsset`
- `components/ui/CardImage.tsx` — prop `mediaType`
- PDV: `PdvProductSearch`, `PdvCart`, `PdvManager`, `types/pdv`
- `ProductCard`, `MasterCatalogPublishPage`
- Testes: `tests/lib/asset-pipeline-v2.test.ts` (6 PASS)

## Critérios de aceite

| # | Critério | Resultado |
|---|----------|-----------|
| 1 | Upload lojista cria media.assets + asset_links | **Não comprovado** (sem HTTP + tabelas ausentes em prod) |
| 2 | CARD/SEALED/ACCESSORY via resolver | **Parcial** — FE wired; CARD ainda SoT legado; SEALED/ACCESSORY sem `product_catalog` em prod |
| 3 | Dedup SHA256 reupload | **Não comprovado** |
| 4 | Remover link sem orphanar | **Não comprovado** |
| 5 | PDP gallery roles gallery/front | **Não comprovado** (sem revalidação E2E) |
| 6 | PDV thumb sem P0 console | **Parcial** — código wired; E2E PDV com imagem **Não comprovado** em runtime |
| 7 | Fallback/skeleton | **PASS** (unit + ResponsiveImage existente) |
| 8 | Typecheck | ver execução local desta sessão |
| 9 | Sem regressão óbvia | **Parcial** — só unit assets |

## Bugs / bloqueadores (evidência)

### P0 — Asset Pipeline V2 não materializado em produção
- `media.assets` / `media.asset_links`: **não existem** (SQL em `rjgzaakhzuzdzcooywva`)
- Migração repo `20260720140000_product_catalog_v2_assets` **não** está em `list_migrations` aplicados
- `product_catalog` schema: **ausente**
- Impacto: sync SEALED/ACCESSORY → AssetService **não pode** persistir em prod; upload unificado impossível

### P1 — Upload lojista ausente
- Sem rota pública de ingest; painel não envia bytes ao Asset Pipeline

### P2 — CARD fora do Asset BC
- 131500 imagens em `card_catalog.image_url`; sem `catalog_card` em asset_links

## Como testar (após deploy FE)

1. Unit: `npx vitest run tests/lib/asset-pipeline-v2.test.ts`
2. PDV: `/vendedor/painel/pdv` — buscar produto com `images[]` e ver thumb 48px
3. Marketplace grid: produto selado/acessório deve usar mediaType não-CARD (object-fit/sizes)
4. Catálogo mestre: thumbs via CardImage

## Veredito imagens

**NÃO** — bloqueadores P0/P1 comprovados (schema Asset V2 + upload ausentes em produção).  
Wiring FE de consumo foi iniciado; **inserção unificada via Asset não está operacional**.
