# Image Insertion — Unified Catalog Wiring (evidência)

**Data:** 2026-07-22  
**Escopo:** Auditoria + wiring FE + migração prod + upload HTTP  
**ADRs:** 008–011, 015 respeitados (sem BC novo)

## Commits

- `e42db2b0` — FE resolver / PDV / marketplace / CardImage
- (este) — upload ingest HTTP + ImageUpload + ProductsPage

## Migração produção (`rjgzaakhzuzdzcooywva` / TCG-SaaS)

Aplicado via Supabase MCP:

| Migration name | Resultado |
|----------------|-----------|
| `product_catalog_master` | **PASS** — schema `product_catalog` |
| `media_assets_v2_core` | **PASS** — `media.assets` + `media.asset_links` |
| `product_catalog_v2_rest_no_trgm` | **PASS** — games (12), collections, history, search_vector |
| índice `gin_trgm_ops` | **adiado** — opclass indisponível no search_path (não bloqueia assets) |

Evidência SQL pós-migração: `to_regclass('media.assets')`, `media.asset_links`, `product_catalog.products` OK; 12 games.

## Evidência dedup / unlink (SQL em prod)

```
assets_for_sha=1  (reupload mesma SHA256)
remaining_links=1 (unlink store_product; product_variant mantém share)
size_after_reupload=2048
```

## Upload HTTP (código)

- `POST /runtime/judge/assets/ingest` — URL → SHA256 → upsert asset → link
- `DELETE /runtime/judge/assets/links` — unlink only
- `GET /runtime/judge/assets/entity/{type}/{id}`
- BFF FE: `/api/assets/ingest`, `/api/assets/links`
- `ImageUpload` → Storage → ingest; Painel Produtos wired

**Runtime E2E HTTP em prod:** depende de deploy da API Python — **Não comprovado** nesta sessão até o backend estar no ar com o router novo.

## Critérios de aceite

| # | Critério | Resultado |
|---|----------|-----------|
| 1 | Upload lojista → assets + links | **Parcial** — schema+SQL OK; HTTP E2E **Não comprovado** (precisa deploy API) |
| 2 | CARD/SEALED/ACCESSORY via resolver | **Parcial** — FE wired; CARD ainda legado `image_url` |
| 3 | Dedup SHA256 | **PASS** (SQL prod) |
| 4 | Unlink sem orphanar | **PASS** (SQL prod) |
| 5 | PDP gallery roles | **Não comprovado** |
| 6 | PDV thumb | **Parcial** — código; E2E visual **Não comprovado** |
| 7 | Fallback/skeleton | **PASS** (unit) |
| 8 | Typecheck | **PASS** (local) |
| 9 | Sem regressão | **Não comprovado** (sem smoke deploy) |

## Veredito imagens

**NÃO COMPROVADO** para “inserção unificada operacional end-to-end” (HTTP upload em prod ainda sem deploy da API).

Bloqueador P0 de schema **resolvido**. Upload path **implementado**; falta deploy API + smoke autenticado.
