# JudgeTCG — Public Beta Release Notes

**Versão:** Sprint 15 + Sprint 16 RC  
**Data:** 2026-07-09

## Destaques

### Buyer Experience
- Painel do comprador com pedidos, wishlist, coleção e economia
- Wishlist com múltiplas listas (backend), compartilhar, duplicar e exportar
- Smart Cart com objetivos (preço, frete, lojas, reputação, prazo)
- Deck shopping e recomendações personalizadas

### Marketplace & Shipping
- Frete v2 com Melhor Envio + fallback heurístico (`SHIPPING_V2`)
- ACL formal Catalog ↔ Marketplace para projeções de listings
- Cache de listings com `s-maxage=60`

### Qualidade & RC (Sprint 16)
- Pipeline único de quality gates (lint, type-check, test, build)
- Image Health Dashboard em `/admin/catalog/image-health`
- Auditoria WCAG AA nos fluxos críticos do comprador
- Virtualização de galeria para catálogos grandes

## Feature flags

| Flag | Ambiente alvo |
|------|----------------|
| `WISHLIST_V2` | Canary produção |
| `SHIPPING_V2` | Staging validado |
| `SHIPPING_V2_ENABLED` | Staging validado |

## Migrações

- `20260708160000_sprint15_wishlist_shipping_analytics.sql` — wishlist, shipping read models, analytics, image health events

## Breaking changes

Nenhuma breaking change de API pública. Endpoints legacy `/marketplace/wishlist` mantidos.

## Rollback

1. Desativar feature flags.
2. Reverter deploy frontend/backend para tag anterior.
3. Migração Sprint 15 é aditiva — rollback de schema não necessário para operação básica.
