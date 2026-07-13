# Changelog Técnico — Public Beta RC

## [RC1 candidate / NO-GO] — 2026-07-13

- Pacote canônico em `docs/release/` (blockers, scorecard, Go/No-Go)
- Smoke: aceita `ready_for_marketplace` no catalog health
- Tag `RC1` **não** criada — ver `docs/release/RC1_BLOCKERS.md`

## [Sprint 16] — 2026-07-09 — Release Candidate Hardening

### CI / Quality
- Novo workflow `.github/workflows/quality-gates.yml` (lint + type-check + vitest + build)
- `NODE_OPTIONS=--max-old-space-size=8192` no build frontend (corrige OOM)
- Node 22 no job frontend do CI
- Correção de type-check em testes legados (`useSubscription`, `seller-operational-actions`)

### Performance
- Cache `s-maxage=60` em `/api/marketplace/shop/products`
- Reutilização de virtualização `@tanstack/react-virtual` na galeria

### Accessibility
- Componente `SkipToMain` para fluxos buyer
- Testes estruturais de a11y nos fluxos críticos

### Image Health
- `image_health_service.py` + endpoint admin `/catalog/image-health`
- Dashboard admin `/admin/catalog/image-health`
- Telemetria `image_failure` em `CardImage`

### Wishlist
- BFF reorder + suporte DND (`@dnd-kit`) na wishlist v2

### Docs
- `docs/sprint16/STAGING_ROLLOUT.md`
- `docs/RELEASE_NOTES_PUBLIC_BETA.md`
- `context/sprint16-release-candidate.md`

## [Sprint 15] — 2026-07-08 — Performance & Polish

### Backend
- Wishlist aggregate + application service + API buyer
- Freight quote (Melhor Envio + heurístico) + shipping service
- ACL `CatalogMarketplaceAdapter`
- Buyer analytics + cohort projections
- Migração SQL wishlist/shipping/analytics

### Frontend
- BFF buyer wishlists/shipping
- Feature flags `WISHLIST_V2`, `SHIPPING_V2`
- Virtual scroll galeria (>48 cards)
- Telemetria expandida (wishlist, shipping, gallery, checkout)

## [Sprint 14] — Buyer Experience Platform

- Buyer dashboard, smart cart, deck shopping, search providers
- Buyer AI insights (sugestões, never auto-buy)
- Store reputation panel, collection import CSV
