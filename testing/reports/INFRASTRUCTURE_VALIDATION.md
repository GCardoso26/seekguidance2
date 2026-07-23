# INFRASTRUCTURE_VALIDATION

**Date:** 2026-07-22  
**Veredito:** **PARTIAL** — código Checkout V2 durável; ops incompleta

## Checkout

| Critério | Status | Evidência |
|----------|--------|-----------|
| Persistência PostgreSQL (`checkout.sessions`) | ✅ PASS (código) | `CheckoutRepository.ts` |
| Composition exige `DATABASE_URL` | ✅ PASS | `createCheckoutV2ApiStack.ts` |
| Health não mente `in_memory` | ✅ PASS (após fix) | `postgresCheckoutHealthDeps` |
| Idempotência start/confirm | ✅ PASS | `CheckoutService` + idempotency keys |
| Expire API | ✅ PASS | endpoint expire |
| TTL worker automático | ❌ FAIL | sem scheduler |
| Compensation saga | ✅ PASS | `ConfirmPaymentSaga` |
| Identity/Marketplace no mesmo processo | ⚠️ PARTIAL | ainda in-memory |
| Stripe/MP HMAC completo | ⚠️ PARTIAL | presença de header; verify deferred |
| Gateways live (Stripe/MP/PIX) | ❌ FAIL | secrets/ambiente |

## Outbox

| Critério | Status | Evidência |
|----------|--------|-----------|
| Postgres Outbox + SKIP LOCKED | ✅ | `PostgresOutboxRepository` |
| Publisher worker | ✅ | `OutboxPublisherWorker` |
| Acceptance tests (retry/recovery/concurrency) | ✅ | `outbox.acceptance.test.ts` |
| Probe no health Checkout V2 | ✅ (após fix) | SELECT outbox_events |

## Projection Workers

| Critério | Status | Evidência |
|----------|--------|-----------|
| OrderPaid → Orders projections | ✅ | `OrdersProjections.ts` |
| OrderPaid → Collection/Deck/Profile/Feed/Notif/Recs | ❌ | gap CONTINUITY |
| Default consumers registrados | ⚠️ | `consumers.ts` — Search/Analytics stub |
| Worker dedicado em produção | ⚠️ PARTIAL | ProjectionWorker lib; wiring incompleto |

## Redis / BullMQ

| Critério | Status | Evidência |
|----------|--------|-----------|
| Definição filas + DLQ + backoff | ✅ | `platform/bullmq/queues.ts` |
| Processors ativos | ⚠️ PARTIAL | `workers/main.ts` “later wiring” |
| Redis health no Checkout V2 | ⚠️ | não PING real (opcional até wired) |

## Recovery / Deploy

| Critério | Status |
|----------|--------|
| Recovery full (kill API/Redis/worker) | ❌ não reexecutado nesta sprint |
| Campanha 8h | ❌ NÃO EXECUTADO |
| Health live/ready/metrics endpoints | ✅ existem |
| Rollback/backups runbook | ⚠️ doc ops; evidência runtime pendente |

## Riscos

- Restart do processo Checkout V2 perde Identity/Marketplace in-memory.
- Consistência pós-compra depende de refetch FE até projections cross-BC existirem (ADR-015: exige RFC se for infra transversal).
