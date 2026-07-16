# Service Level Objectives — JudgeTCG

**Status:** Congelado — Sprint 6  
**Relaciona:** [`FOUNDATION_OPERATIONS.md`](./FOUNDATION_OPERATIONS.md)

## SLOs

| Serviço | Objetivo | Janela | Medição |
|---------|----------|--------|---------|
| **Disponibilidade API** | 99.5% | 30 dias | `1 - (5xx / requests)` em `/api/v1/*` |
| **Search freshness** | P95 Provider → searchable **&lt; 60s** | 7 dias | `search_projection_lag_seconds` / lead time |
| **Checkout complete** | P95 **&lt; 3s** | 7 dias | `checkout_duration_seconds` (start → webhook settle) |
| **Payment webhook** | P95 processing **&lt; 1s** | 7 dias | webhook handler duration |

## Error budgets (resumo)

- Disponibilidade 99.5% → ~3.6h downtime / 30 dias.
- Freshness: alertar se `search_projection_lag_seconds > 60` (warning) ou `> 300` (critical).
- Checkout: alertar se P95 `checkout_duration_seconds > 3`.

## SLIs associados

| SLI | Métrica |
|-----|---------|
| API up | `/health/ready` = 200 |
| Outbox healthy | `outbox_oldest_event_age_seconds < 300` |
| Payments flowing | `payment_pending_total` estável / decrescendo |
| Reservations | `reservation_conflict_total` sem spike anômalo |

## Fora de escopo nesta definição

SLOs de SEO, mobile apps, multi-região, multi-TCG.
