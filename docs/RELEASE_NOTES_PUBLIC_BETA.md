# JudgeTCG — Public Beta Release Notes

**Versão:** Sprint 15–17 + pacote RC1 (tag pendente)  
**Data:** 2026-07-13  
**Status RC1:** NO-GO — ver `docs/release/RC1_GO_NO_GO.md`

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

### Inventory (Sprint 17)
- Dashboard, search multi-fonte, DataTable, import/export, health scores

### Qualidade & RC
- Pipeline quality gates (local verde; CI remoto bloqueado por billing)
- Image Health Dashboard
- Design System v3 — `ds:audit` 0 hits
- Pacote documental completo em `docs/release/`

## Feature flags

| Flag | Ambiente alvo |
|------|----------------|
| `WISHLIST_V2` | Canary produção (após Go) |
| `SHIPPING_V2` | Staging validado (após Go) |
| `SHIPPING_V2_ENABLED` | Staging validado (após Go) |

## Breaking changes

Nenhuma breaking change de API pública.

## Rollback

1. Desativar feature flags.
2. Reverter deploy frontend/backend para tag anterior (quando existir).
3. Migração Sprint 15 é aditiva — rollback de schema não necessário para operação básica.
