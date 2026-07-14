# Event Parity Matrix — Frontend ↔ Backend

**Version:** 1.0.0  
**Status:** Active (Beta 1.5)  
**Owner:** Platform  
**Related:** EVENT_REGISTRY · DATA_QUALITY

Pipeline:

```text
Evento → Frontend (trackEvent) → Gateway (/api/analytics/track)
      → Backend (/runtime/judge/analytics/track) → Banco (analytics_events | DLQ)
      → Dashboard (consumo SQL / health)
```

| Coluna | Significado |
|--------|-------------|
| FE | Emitido ou tipado no SDK |
| GW | Aceito pelo gateway Next |
| BE | No `EVENT_REGISTRY` / allowlist |
| DB | Persiste em `analytics_events` |
| Doc | Documentado no registry |
| Own | Owner atribuído |
| Dst | Destino definido |

Status: ✅ sim · ⚠ parcial · ❌ não · DLQ = inválido/unknown → dead letter (não perdido)

---

## Matriz (estado pós–Beta 1.5)

| Evento | FE | GW | BE | DB | Doc | Own | Dst | Schema | Notes |
|--------|----|----|----|----|-----|-----|-----|--------|-------|
| pricing_* / paywall / upgrade_modal_open | ✅ | ✅ | ✅ | ✅ | ✅ | growth | analytics_events | v1 | |
| upgrade_modal_close | ⚠ typed | ✅ | ✅ | ✅ | ✅ | growth | analytics_events | v1 | dead typed |
| checkout_started/completed/failed | ✅ | ✅ | ✅ | ✅ | ✅ | product | analytics_events | v1 | disambiguate context |
| subscription_* | ⚠ server | ✅ | ✅ | ✅ | ✅ | growth | analytics_events | v1 | Stripe paths |
| page_view | ✅ | ✅ | ✅ | ✅ | ✅ | product | analytics_events | v1 | |
| card_view / search / add_to_cart / purchase / listing_create | ✅ | ✅ | ✅ | ✅ | ✅ | mkt | analytics_events | v1 | |
| wishlist_* (created/shared/converted/remove) | ✅ | ✅ | ✅ | ✅ | ✅ | buyer | analytics_events | v1 | **was FIRED_DROPPED** |
| wishlist_add | ⚠ typed | ✅ | ✅ | ✅ | ✅ | buyer | analytics_events | v1 | not emitted |
| deck_shop_open / collection_import / image_failure / gallery_mode | ✅ | ✅ | ✅ | ✅ | ✅ | * | analytics_events | v1 | **was FIRED_DROPPED** |
| recommendation_click / buyer_insight / smart_cart_goal | ✅ | ✅ | ✅ | ✅ | ✅ | buyer | analytics_events | v1 | fixed |
| card_buy_click / card_add_to_cart / card_dwell_ms / announce_card_click | ✅ | ✅ | ✅ | ✅ | ✅ | mkt | analytics_events | v1 | **was orphan** |
| tournament_* | ✅ | ✅ | ✅ | ✅ | ✅ | judge | analytics_events | v1 | fixed |
| report_resolved / ruling_applied | ✅ | ✅ | ✅ | ✅ | ✅ | judge | analytics_events | v1 | |
| engagement backlog (question_asked…) | ⚠ typed | ✅ | ✅ | ✅ | ✅ | judge | analytics_events | v1 | not emitted |
| **unknown future name** | — | ✅ | ❌ | **DLQ** | — | — | analytics_events_dlq | — | never silent |
| invalid schema version | — | ✅ | reject | **DLQ** | — | — | DLQ | — | |
| invalid properties type | — | ✅ | reject | **DLQ** | — | — | DLQ | — | |

---

## Problemas encontrados (pré–fix) — closed in 1.5

| Problema | Antes | Depois |
|----------|-------|--------|
| BuyerExperience não na allowlist BE | Drop silencioso | Registry + persist |
| Orphans fora do union FE | Drop | Registrados |
| Gateway soft-200 + clear queue | Perda sem rastreio | `ok`/`lost`/`dead_lettered`; clear só se accounted |
| Sem versionamento | Livre | `event_schema_version` default 1 |
| Sem DLQ | Perda total | `analytics_events_dlq` |

---

## Dashboard readiness

| Domínio | Dados confiáveis agora? |
|---------|-------------------------|
| Monetização | Sim |
| Marketplace core | Sim (melhor com context) |
| Wishlist / Deck shop | Sim (persistência restaurada) |
| Search CTR | Não — evento click ainda ausente no catalog P0 ★ |
| Seller KYC funnel | Não — eventos ★ ainda não emitidos |

Parity **ingest** ≠ parity **instrumentação de produto**. Integrity platform guarantees fate of emitted events; missing emits remain catalog gaps.
