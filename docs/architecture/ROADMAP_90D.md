# JudgeTCG — Roadmap 90 dias + MVP operacional

**Status:** Congelado pós–Foundation Closed (v1.3.0)  
**Data:** 2026-07-16  
**Princípio:** um fluxo vertical completo > dez jogos parciais / expansão arquitetural.

---

## Meta única (90 dias)

> Um lojista cadastra uma loja, anuncia uma carta de Magic sincronizada do Scryfall;  
> um comprador encontra pela busca, conclui a compra;  
> a operação monitora o fluxo ponta a ponta.

Se isso estiver **LIVE e estável**, a arquitetura e o núcleo do produto estão validados.  
Pokémon, YGO, Lorcana, IA etc. passam a ser **expansão** — não pré-requisito.

---

## Fluxo vertical (congelar expansão até funcionar)

```text
Scryfall
  → Catalog Sync
  → PostgreSQL
  → Outbox
  → Redis Event Bus
  → Search Projection
  → API Pública
  → Frontend
  → Lojista cria anúncio
  → Comprador pesquisa / compra
```

**Ordem de produto (obrigatória):**

```text
Search → API Pública → Marketplace → Checkout
```

Search depende da API. Marketplace também. Não inverter.

**Até este fluxo fechar:** nenhuma feature nova fora das sprints abaixo; nenhuma expansão arquitetural; nenhum outro TCG.

---

## MVP operacional

| # | Entrega |
|---|---------|
| 1 | Um jogo: MTG (Scryfall) |
| 2 | Catálogo oficial sincronizado |
| 3 | Cadastro de lojas |
| 4 | Anúncios (overlay — Catalog imutável) |
| 5 | Busca rápida |
| 6 | Compra ponta a ponta |
| 7 | Ops observável |

**Fora:** wishlist · chat · social · IA · analytics avançado · outros TCGs · cupom · cashback.

---

## Cinco trilhos

| Trilho | Papel |
|--------|--------|
| **1 Plataforma** | Sync → PG → Outbox → Events (prioridade máxima nas Sprints 1–2) |
| **2 Produto** | Loja → anúncio → busca → checkout (Sprints 4–5) |
| **3 Operação** | Grafana · alertas · admin · runbooks (Sprint 6) |
| **4 UX** | Lista priorizada de experiência (paralelo, sem inflar escopo) |
| **5 Negócio** | KPIs desde o dia 1 (definir agora; medir no LIVE) |

---

## Sprints (ordem obrigatória)

### Sprint 1 (1–2 semanas) — Sync real Scryfall

**Objetivo:** sincronizar cartas reais. **Sem frontend.**

### Sprint 1 — Certificação PG

- [x] Database Certification
- [x] Contracts Postgres (4 ARs)
- [x] Wiring PG
- [x] Migrations

### Sprint 2 — Scryfall SHADOW

- [x] Débito EventBus removido (`CatalogSyncService`)
- [x] Pipeline Scheduler → Producer → Processor → AS → Outbox → Publish
- [x] ConsistencyValidator + ShadowComparison no report
- [x] CLI `npm run sync:scryfall:shadow`
- [x] Gate de saída: [`SHADOW_EXIT_GATE.md`](./SHADOW_EXIT_GATE.md)

Checklist:

- [x] Database Certification (`npm run certify:db`)
- [x] Contracts Postgres verdes (Card/Set/Variant/ProviderMapping)
- [x] Wiring repositories PG (`createPostgresCatalogStack`)
- [x] Migrations aplicadas (phase1 + outbox + guardrails)
- [x] Scryfall SHADOW (orchestrator + teste PG + CLI)

### Sprint 2.5 — SHADOW Stress (antes do CANARY)

- [x] C1–C6 em [`SHADOW_STRESS.md`](./SHADOW_STRESS.md) — 77 testes (stress suite verde)
- [x] Spec Sync Timeline: [`SYNC_TIMELINE.md`](./SYNC_TIMELINE.md)
- [x] Identity bridge Card/Variant via Provider Mapping (idempotência PG)
- [x] Fix falso `update` por ordem de chaves em `game_data` (JSONB)
- [x] Re-sync real `lea`: inserts=0, maioria unchanged (sem duplicação)
- [ ] **Não** CANARY Catalog — próximo: Sprint 3 Search Projection (depois API Pública)

**Resultado esperado — tabelas populadas automaticamente:**

`catalog.catalog_sets` · `catalog.catalog_cards` · `catalog.catalog_variants` ·  
`catalog.provider_mappings` · `platform.outbox_events` · `platform.consumer_offsets`

---

### Sprint 2 — Consistência + volume

Usar `ConsistencyValidator` + `ShadowComparison` com **milhares** de cartas.

Métricas: throughput · inserts · updates · unchanged · erros · retries · tempo médio.

Só então:

```text
SHADOW → CANARY → LIVE  (Catalog / sync)
```

---

### Sprint 3 — Search Projection

```text
Events → SearchEventConsumer → Projection Repository → Meilisearch
```

Detalhe: [`SEARCH_PROJECTION.md`](./SEARCH_PROJECTION.md)

Checklist:

- [x] SearchProjectionRepository / Version / Health / Lag
- [x] Filtros dia 1 + relatório
- [x] Docs SEARCH_PROJECTION
- [x] Parar — sem Marketplace

---

### Sprint 3.1 — Redis + ProjectionManager

```text
ProjectionManager → SearchProjectionRepository → Meilisearch
SearchEventConsumer (thin) ← Redis Streams XREADGROUP / Replay
```

- [x] `ProjectionManager` (ensure, rebuild, alias swap, retire, verify)
- [x] `ProjectionCoverage` / `ProjectionDrift`
- [x] `SyncLeadTime` (Provider → searchable P50/P95)
- [x] Redis Streams consumer group + replay
- [x] `SearchQueryService` contrato congelado (read-only)
- [ ] Soak com Redis + Meili em ambiente compartilhado

Norte operacional: **lead time de sincronização** P95.

---

### Sprint 3.5 — API Pública (100% Read Only)

```text
GET /api/v1/* → SearchQueryService → Projection → Meilisearch
```

Contrato: [`READ_MODEL_CONTRACT.md`](./READ_MODEL_CONTRACT.md)

**Somente GET** — sem POST, sem Marketplace, sem auth complexa:

- `GET /api/v1/search`
- `GET /api/v1/suggest`
- `GET /api/v1/cards`
- `GET /api/v1/cards/:id`
- `GET /api/v1/sets`
- `GET /api/v1/sets/:code`
- `GET /api/v1/variants`
- `GET /api/v1/variants/:id`

DTOs: `CardSummaryResponse` · `CardDetailsResponse` · `SearchResultResponse` · `SetResponse` · `VariantResponse`

Cache: `ETag` · `Cache-Control` · `Last-Modified`

Checklist:

- [x] SearchQueryService congelado (`search` / `getCard` / `getVariant` / `getSet` / `suggest`)
- [x] DTOs públicos (sem entidades Catalog)
- [x] `/api/v1` + versionamento
- [x] Cache HTTP
- [x] Métricas: latency P50/P95/P99 · QPS · top queries · cache hit · zero results · freshness
- [x] `npm run api:public`
- [x] Bloqueado: Login / JWT / Marketplace / Checkout / Stripe / KYC / Sellers / Listings / IA

---

### Sprint 4 — Marketplace Domain

```text
Seller → Inventory → Listing → Overlay → RenderedCard
```

Aqui muda tudo: sai infraestrutura, entram **conceitos de domínio**.  
Contrato: [`MARKETPLACE_DOMAIN.md`](./MARKETPLACE_DOMAIN.md) · [ADR-007](./adr/ADR-007-marketplace-domain-boundaries.md).

Quatro agregados (Order fica na Sprint 5). Catalog **imutável**; Listing só referencia `catalogCardId` + `catalogVariantId` (ADR-003/ADR-007). Sem FK para Meilisearch.

Checklist:

- [x] ADR-007 Marketplace Domain Boundaries
- [x] `MARKETPLACE_DOMAIN.md` (equivalente ao FOUNDATION_FREEZE, p/ domínio)
- [x] **Seller** (status · verification · configuration) — domínio + port + InMemory + AS
- [x] **Inventory** (`InventoryItem`, sem preço) — domínio + port + InMemory + AS
- [x] **Listing** (preço · condição · idioma · notas; refs Catalog/Inventory/Seller) — AS emite `MarketplaceListingUpdated` via Outbox
- [x] **RenderedCard** overlay + `renderCardWithOffers` (montado na borda; nunca grava Catalog)
- [x] Raiz separada `/api/v1/marketplace` (read-only) + `npm run api:marketplace`
- [x] Bloqueado: Order/Checkout/Payments · Analytics pesado · IA · Chat · Feed · Social · Reviews · Recomendações

**Depende de:** Sprint 3.1 estável + Sprint 3.5.

Norte de negócio: **tempo para um lojista criar o primeiro anúncio**.

Sprint 4 segue em três incrementos verticais (4.1 → 4.2 → 4.3) + 4.4 (integração).

---

### Sprint 4.1 — Identity Domain (domínio, sem JWT)

```text
User → SellerProfile → Seller Aggregate
```

Identidade ≠ papel. `User` é identidade; ser vendedor é um **papel** (ponte `SellerProfile`).  
Contrato congelado: [`IDENTITY_DOMAIN.md`](./IDENTITY_DOMAIN.md). Mapa do sistema: [`SYSTEM_FLOW.md`](./SYSTEM_FLOW.md).

- [x] `IDENTITY_DOMAIN.md` + `SYSTEM_FLOW.md` (congelados antes de implementar)
- [x] `identity/` bounded context — `User` · `Session` · `Role`/`Permission` · `SellerProfile`
- [x] Repository ports + InMemory (mesma filosofia do Catalog: insert/update/rollback/concurrency/no-op/idempotency)
- [x] AS: `RegisterUser` (buyer default) · `AssignRole` · `CreateSellerProfile` (concede `seller`) · `Authorization`
- [x] `PasswordHasher` (scrypt) — nunca senha em claro
- [ ] JWT / Refresh / verificação de e-mail — **congelado p/ 4.3**

### Sprint 4.2 — Marketplace + Identity Persistence (PostgreSQL) ✅

- [x] Migration `identity.*` (users/roles/user_roles/sessions/seller_profiles) + `marketplace.*` (sellers/inventory_items/listings), com `row_version`
- [x] Contrato congelado (sem impl): `EmailVerificationToken` · `PasswordResetToken`
- [x] Adapters PG: `PostgresSeller/Inventory/Listing` · `PostgresUser/SellerProfile/Session/RoleAssignment`
- [x] Repository Contracts compartilhados (InMemory **e** Postgres): insert/update/rollback/optimistic-lock/no-op/idempotency/concurrency
- [x] `createPostgresMarketplaceStack()` · `createPostgresIdentityStack()`
- [x] Certificação: 153 testes verdes (contratos PG inclusos)
- Sem frontend. Catalog IDs por referência (sem FK ao `catalog.*` / sem FK ao Search).

### Sprint 4.3 — Authenticated Marketplace API (primeira história completa) ✅

Não é "só autenticação" — é o **primeiro fluxo completo do produto**.

```text
Register → Login → JWT → Onboard Seller → Inventory → Publish Listing
  → Outbox → Search → GET /cards/:id/offers
```

- [x] `JwtSigner` / `JwtVerifier` ports + `HmacJwtAdapter` (HS256, sem deps)
- [x] AccessToken + RefreshToken; Session = fonte de revogação
- [x] `POST /api/v1/auth/register|login|refresh|logout`
- [x] Middleware: `RequireAuth` · `RequirePermission` · `CurrentUser` (roles do DB)
- [x] RBAC via domínio existente (`buyer`/`seller`/`admin`) — sem ACL
- [x] Write API: `POST/PATCH/DELETE` listings + inventory; `POST /sellers` (onboard)
- [x] Controllers thin → Application Services → Outbox → `MarketplaceListingUpdated`
- [x] E2E golden path (`authGoldenPath.e2e.test.ts`) — critérios de aceite verdes
- [x] Bloqueado: e-mail verify · password reset · OAuth · MFA · CAPTCHA · Stripe · Checkout
- Script: `npm run api:auth`

### Sprint 4.4 — Integração operacional (Golden Path CI) ✅

Validar o fluxo completo: Provider → Catalog → Outbox → Redis → Search → Public API → Marketplace → Oferta.

Contrato: [`SPRINT_44_READINESS.md`](./SPRINT_44_READINESS.md)

- [x] `npm run smoke:golden-path` — smoke oficial (Catalog→Search→Auth→Listing→Offers + budgets)
- [x] Workflow CI `.github/workflows/golden-path-smoke.yml` (gate em PR → main)
- [x] Compose production-like: `infra/integration/docker-compose.yml` (PG + Redis + Meili)
- [x] Smoke periódico: `npm run smoke:periodic` (30 min, relatório em `reports/smoke/`)
- [x] Métricas de negócio (Marketplace / Search / Identity)
- [x] Chaos leve: Redis down · worker morto · JWT após restart
- [x] Performance budget (Login &lt;150ms · Publish &lt;250ms · Listing→Search &lt;5s · Offers &lt;100ms)
- [x] Readiness checklist Sprint 5

**Sem Checkout.** Só após este gate verde.

---

### Sprint 5 — Checkout / Order Domain

Segunda história completa do produto: comprador encontra oferta → cart → checkout → reserva → pagamento → pedido.

Contrato: [`ORDER_DOMAIN.md`](./ORDER_DOMAIN.md) (congelado antes do código).

```text
Search → Offer → Cart → Checkout → Reservation → Payment → Order → Confirmation
```

**Marketplace vende. Order compra.** Checkout fora de `marketplace/`.

#### Sprint 5.1 — Cart + Order Domain ✅

- [x] `ORDER_DOMAIN.md`
- [x] Agregados: Cart · CheckoutSession · Order · InventoryReservation
- [x] Ports + InMemory + Outbox events (`CartCreated` … `OrderCompleted`)
- [x] AS: CreateCart · AddCartItem · StartCheckout · PayOrder
- [x] `PaymentGateway` + `FakePaymentProvider` (approved/declined/timeout)
- [x] Domain tests (snapshot de preço, payment ≠ marketplace, reserva sem mutar Inventory)
- Sem API ainda

#### Sprint 5.2 — PostgreSQL + Contracts ✅

- [x] Migration `cart.*` / `order.*` / `reservation.*` — **0 FK** para marketplace/catalog/identity
- [x] Adapters PG: Cart · CheckoutSession · Order · Reservation
- [x] Repository Contracts (InMemory = Postgres): insert/update/rollback/optimistic-lock + financial safety (snapshot · Order ≠ Marketplace)
- [x] `createPostgresOrderStack(pool)` — Outbox = `platform.outbox_events`
- [x] `npm run certify:order` · `orderGoldenPath.persistence.test.ts`
- Sem API / Stripe / estoque decrementando

#### Sprint 5.3 — Reservation Engine ✅

- [x] `ReservationEngine` · `ReservationPolicy` · Hold / Confirm / Release / Expire AS
- [x] Concorrência real PG: `pg_advisory_xact_lock` — estoque=1 → A HELD · B OUT_OF_STOCK
- [x] Idempotência `request_id` · TTL → EXPIRED · Outbox (`ReservationHeld`…)
- [x] `reservationEngine.concurrent.pg.test.ts` · golden path com Reservation HELD
- Sem API / Stripe / decremento marketplace.inventory

#### Sprint 5.4 — Checkout API ✅

- [x] `CHECKOUT_API_CONTRACT.md`
- [x] `/api/v1/cart` · items · `/checkout` · `/checkout/:id/pay` · `/orders`
- [x] JWT + `RequireBuyer` · DTOs públicos · PayCheckout (Hold → RequestPayment)
- [x] `checkout.api.e2e.test.ts` · `npm run certify:checkout`
- Sem Stripe / frete / comissão

#### Sprint 5.5 — Payment Adapter ✅

- [x] `PAYMENT_PROVIDER_CONTRACT.md` · bounded context `payment/`
- [x] `PaymentGateway` port · `FakePaymentProvider` (async + timeout)
- [x] Webhook simulation `POST /api/v1/payments/webhook` (assinatura + idempotência)
- [x] PayCheckout → RequestPayment → webhook → SettlePayment (Order PAID/CANCELLED)
- [x] Migration `payment.*` · contracts InMemory/Postgres · `npm run certify:payment`
- Stripe real bloqueado

**Bloqueado (5.x):** Stripe real · cupom · cashback · frete · split · comissão · disputa · refund avançado.

---

### Sprint 6 — Operação ✅

Grafana · Prometheus · Alertas · Health · Runbooks · Backups · Chaos · Smoke readiness

- [x] `docs/operations/` — FOUNDATION · SLO · RUNBOOKS · INCIDENT · BACKUP
- [x] MetricsRegistry + `/metrics` · `/health` · `/health/live` · `/health/ready`
- [x] Dashboards `infra/grafana/dashboards/` · alertas `infra/prometheus/alerts.yml`
- [x] Chaos C1–C4 · `npm run smoke:production-readiness` · `npm run test:chaos`
- Sem features comerciais novas

Perguntas em ~30s:

- Qual worker caiu?
- Qual provider está degradado?
- Qual fila travou?
- Qual Outbox está atrasado?
- Qual migration foi aplicada?

---

## Pós-90D — próximo ciclo

O trilho de **construção de plataforma** está fechado.  
O próximo ciclo é **operação + validação de mercado + expansão controlada**.

Plano: [`MVP_1_0_RELEASE_PLAN.md`](./MVP_1_0_RELEASE_PLAN.md)  
Objetivo: **primeira venda real em produção** (Sprint 7+).

---

## Trilho 4 — UX (lista priorizada)

Durante o desenvolvimento, manter backlog de UX (não vira sprint de “features” soltas):

1. Cadastro de anúncio em poucos cliques (buscar carta → preencher dados oficiais do Catalog).
2. Busca muito rápida + autocomplete + filtros TCG.
3. Página da carta: bloco **oficial (Catalog)** vs **ofertas (Marketplace)** visualmente separados.
4. Compra com o menor número possível de etapas.

Impacto na adoção &gt; acumular features.

---

## Trilho 5 — Negócio (KPIs desde o dia 1)

### Marketplace

lojas cadastradas · anúncios ativos · GMV · pedidos · ticket médio

### Plataforma

sync/dia · cartas sincronizadas · tempo de sync · falhas

### Search

pesquisas/dia · CTR · zero results

### Operação

uptime · Outbox lag · filas · erro por provider

SLOs técnicos: [`FOUNDATION_FREEZE.md`](./FOUNDATION_FREEZE.md) §15.3

---

## Depois do Scryfall LIVE estável

```text
Pokémon → YGO → Bandai → Lorcana → SWU
```

Só adapters + [`PROVIDER_CERTIFICATION.md`](./PROVIDER_CERTIFICATION.md).

### Pricing (pós-MTG LIVE)

TCGPlayer → CardMarket → CardTrader → eBay (referência; sem média inventada no início).

### IA (muito depois)

Descrição automática · correção de anúncios · sugestão de preço · busca semântica · suporte.  
Nada além disso no primeiro ciclo.

---

## O que não fazer agora

| Tentação | Decisão |
|----------|---------|
| Feature fora das Sprints 1–6 | ❌ |
| Novo TCG | ❌ Até Scryfall LIVE estável |
| Frontend antes do Sync SHADOW | ❌ Sprint 1 sem UI |
| IA / social / wishlist | ❌ Fora do MVP |
| Novos padrões arquiteturais | ❌ Até fluxo vertical estável |
| Dashboard gigante | ❌ Só KPIs / admin mínimo |

---

## Próxima ação (agora)

```text
NÃO começar feature nova.
COMEÇAR Sprint 1: Database Certification → Contracts PG → Wiring → Scryfall SHADOW.
```

---

## Links

- Fundação: [`FOUNDATION_FREEZE.md`](./FOUNDATION_FREEZE.md)  
- ADRs: [`adr/`](./adr/README.md)  
- DB Cert: [`DATABASE_CERTIFICATION.md`](./DATABASE_CERTIFICATION.md)  
- Provider Cert: [`PROVIDER_CERTIFICATION.md`](./PROVIDER_CERTIFICATION.md)  
- Domínios: [`DOMAIN_ORIENTED_PLATFORM.md`](./DOMAIN_ORIENTED_PLATFORM.md)
