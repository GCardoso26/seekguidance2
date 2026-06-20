# Changelog — Judge TCG

Formato baseado em [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added
- Marketplace neutro: PIX direto como pagamento padrão (zero comissão)
- Stripe Connect opcional para cartão
- Assinatura Pro Loja via dashboard (R$ 49/mês)
- Migration `20260620180000_marketplace_neutro_pix_pro.sql`
- Documentação: [MARKETPLACE_NEUTRO.md](MARKETPLACE_NEUTRO.md)

### Changed
- Checkout: seleção PIX vs cartão; PIX é padrão
- Dashboard lojista: aba **Pagamentos** (PIX + Stripe opcional + Pro)
- Comissão sobre vendas removida (modelo assinatura)

## [1.7.0] — 2026-06-20 — Marketplace MVP

### Added
- Lojas com Stripe Connect Express (`/store/onboarding`, `/store/dashboard`)
- Produtos físicos: `store_products`, carrinho, checkout PaymentIntent
- Split payment 85% loja / 15% plataforma (`commission_rate` por loja)
- Grid marketplace com abas **Produtos** + **Decklists** (decklists preservadas)
- Migration `20260619160000_marketplace_shop_mvp.sql`
- Documentação: [MARKETPLACE.md](MARKETPLACE.md)

### Fixed
- CI monorepo: `npm ci` na raiz para frontend/mobile workspaces
- Ruff lint (API) — CI verde

## [1.6.0] — 2026-06-19 — Mobile App

### Added
- Expo WebView híbrido (tabs judge, social, torneios, perfil)
- Push Expo + migration `user_push_tokens`
- App mobile inline no monorepo (sem submodule)

## [1.5.0] — 2026-06-06 — Bracket + Analytics

### Added
- Bracket real (top cut), PWA, analytics admin
- OG dinâmico, sitemap

## [1.4.0] — Monetização

- Paywall Free/Pro, Stripe checkout, badges, leaderboard

---

## Histórico anterior

### Added
- Sprint Final: docs `SECURITY.md`, `RUNBOOK.md`, `CHANGELOG.md`, contexto v5
- Migration `20260607120000_production_performance.sql` (índices + `leaderboard_cache`)
- Sentry opcional (API + frontend via `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN`)
- Pool DB configurável em produção (`app/config/production.py`)
- CI job Vitest para `frontend/runtime_console_v3`
- Campo `infracting_player_id` no modal de resolver chamada de juiz

### Fixed
- Conflito `messages` vs `social_messages` na migration social (db push)
- Penalidades no painel juiz exigiam `infracting_player_id` sem UI

## [2026-06-07] — Sprint 3

- Painel Juiz Digital: `judge_calls`, certificações, fair play
- API `/runtime/judge/judge/*` + dashboard `/judge/dashboard`

## [2026-06-06] — Sprint 2

- Torneios multi-TCG, marketplace, streaming API
- Checklist de deploy inicial

## [2026-06-05] — Sprint 0–1

- Judge RAG em produção
- Plataforma torneios Fase A/B
- CI Ruff + pytest platform
