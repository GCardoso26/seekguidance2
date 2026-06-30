# Changelog

## [Unreleased] — Fase 0 Catálogo

### Adicionado

- **Inscrições em torneios** (`/tournament/[id]`): página pública com status, vagas, lista anônima de inscritos, inscrição gratuita (modal) e paga (`/checkout` Stripe), gate CPF ativo
- **BFF inscrições**: `registration/status`, `register`, `participants`, `payments/confirm`, gestão lojista em `/vendedor/painel/torneios/[id]/inscritos`
- **Hook** `useTournamentRegistration` + Vitest `tournament-registration.test.ts` + E2E `tournament-registration.spec.ts` (101 specs E2E verdes)
- **Marketplace comprador — filtros avançados** (`/marketplace`): painel desktop + drawer mobile, infinite scroll, sync URL (`q`, `game_id`, `min_price`, `max_price`, `condition`, `in_stock`, `store_id`), BFF `/api/marketplace/products`
- **Painel lojista — Torneios** (`/vendedor/painel/torneios`): lista, criar torneio, cards/desktop, BFF `/api/tournament/tournaments/mine`, plano Lojista+
- **Catálogo — filtro por coleção** case-insensitive (`LOWER(set_code)`) + sync apitcg MTG/SORCERY/DBFW/UARENA (PR #20)
- Migration `20260621140000_card_catalog_phase0.sql` (external_ids, image_uris, card_prices, card_sync_runs)
- Pipeline de ingestão (`app/catalog/pipeline.py`) com adapters MTG, Pokémon, Lorcana, YGO
- Meilisearch indexer + fallback PostgreSQL ILIKE
- API `/runtime/judge/catalog/health`, `/catalog/cards/search`, `/catalog/sync/{game}`
- BFF Next.js `/api/catalog/health` e `/api/catalog/cards/search`
- Types `UnifiedCard` em `src/types/card.ts`
- Documentação `docs/CARD_INGESTION.md`
- Meilisearch no `docker-compose.yml`

### Melhorado

- E2E `landing.spec.ts`: navegação do grid de jogos mais resiliente (`domcontentloaded`, `force` click)

### Limitações conhecidas (backend — issue pendente)

- `entry_fee` não persiste na criação do torneio (schema FastAPI)
- `register` não valida pagamento prévio
- PIX torneio via Stripe (não gateway nativo marketplace)
- Notificações a inscritos = stub BFF

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
