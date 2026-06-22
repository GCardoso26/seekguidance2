# Changelog

## [Unreleased] — Fase 0 Catálogo

### Adicionado

- Migration `20260621140000_card_catalog_phase0.sql` (external_ids, image_uris, card_prices, card_sync_runs)
- Pipeline de ingestão (`app/catalog/pipeline.py`) com adapters MTG, Pokémon, Lorcana, YGO
- Meilisearch indexer + fallback PostgreSQL ILIKE
- API `/runtime/judge/catalog/health`, `/catalog/cards/search`, `/catalog/sync/{game}`
- BFF Next.js `/api/catalog/health` e `/api/catalog/cards/search`
- Types `UnifiedCard` em `src/types/card.ts`
- Documentação `docs/CARD_INGESTION.md`
- Meilisearch no `docker-compose.yml`

## [1.0.0] — 2026-06-21

### Adicionado

- Marketplace neutro (0% comissão, PIX direto)
- Assinatura Pro Loja (R$ 49/mês)
- Webhook PIX automático (OpenPix/Asaas)
- Gestão de pedidos com filtros e CSV export
- Avaliações 5-estrelas com fotos
- Notificações multi-canal (push stub, email, inbox)
- Cupons de desconto por loja com persistência no PIX
- Dashboard com KPIs e gráficos
- Checkout PIX com timer, realtime e fallback
- Edição de avaliação em até 7 dias (texto/fotos)
- Aba Disputas (empty state preparatório)

### Melhorado

- Performance: memoização, code splitting, React Query cache
- SEO: metadata Open Graph
- Mobile: layout responsivo
- Cupom reflete no valor final do PIX e em `shop_coupon_uses`
