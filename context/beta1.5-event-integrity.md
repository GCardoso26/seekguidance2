# Public Beta 1.5 — Event Integrity Platform

**Version:** 1.0.0  
**Status:** COMPLETE (code + docs)  
**Date:** 2026-07-14  
**Role:** Staff Platform Engineer (Event Streaming / Product Analytics / DQ)

---

## Verdict

O maior risco do Public Beta — **descarte silencioso de eventos** — foi eliminado na camada de ingestão.

Todo evento emitido é **validado, versionado (v1), persistido ou enviado à DLQ, auditado (`ingest_trace_id`), e contabilizado na resposta** (`ok` / `lost` / `dead_lettered`). Soft HTTP 200 no browser permanece por compatibilidade RC1.2, mas **não mascara perda**.

---

## O que mudou (aplicável já)

| Item | Local |
|------|-------|
| Event Registry runtime | `services/api/app/judge/event_registry.py` |
| Ingest + DLQ | `services/api/app/judge/analytics_events.py` |
| API track + ingestion-health | `services/api/app/api/v1/judge_product.py` |
| Migration DLQ + idempotency | `supabase/migrations/20260714120000_beta15_event_integrity.sql` |
| SDK schema + idempotency + flush gating | `frontend/runtime_console_v3/src/lib/analytics.ts` |
| Gateway truthful body | `frontend/.../api/analytics/track/route.ts` |
| Contract tests | `services/api/tests/judge/test_event_integrity.py` |

---

## Docs entregues

`docs/product/` — EVENT_REGISTRY, EVENT_PARITY, EVENT_VERSIONING, EVENT_INGESTION, EVENT_IDEMPOTENCY, ANALYTICS_HEALTH, EVENT_DASHBOARDS, EVENT_TESTING, EVENT_PLATFORM_ARCHITECTURE, EVENT_ROADMAP  

Atualizados: PRODUCT_ANALYTICS_ARCHITECTURE, EVENT_CATALOG, EVENT_TAXONOMY, DATA_QUALITY  

Context: `release-checklist`, `observability`, `monitoring`, `evaluation` (+ este arquivo)

---

## Ação operacional imediata

1. **Aplicar migration** `20260714120000_beta15_event_integrity.sql` no Postgres de produção/staging.  
2. Deploy API + frontend.  
3. Monitorar `GET /runtime/judge/analytics/ingestion-health` e DLQ `reason`.  
4. Confiar em KPIs de evento só com **AHS ≥ 75**; NSM de pedidos continua no domínio.

---

## Não feito (de propósito)

Heatmaps, session replay, A/B, charts no app, mudanças de checkout/marketplace/UI.
