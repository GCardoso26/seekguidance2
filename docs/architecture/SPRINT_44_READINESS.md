# Sprint 4.4 — Readiness for Sprint 5 (Checkout)

**Status:** Gate operacional antes de domínio financeiro.  
**Relaciona:** [`SYSTEM_FLOW.md`](./SYSTEM_FLOW.md) · [`ROADMAP_90D.md`](./ROADMAP_90D.md)

## Checklist

| Área | Critério | Status |
|------|----------|--------|
| Provider Sync | Scryfall SHADOW → Catalog via Outbox | ✓ |
| Catalog | SoT imutável, ports + PG | ✓ |
| Outbox | commit → publish, leasing, dead | ✓ |
| Publisher | Redis Streams EventPublisher | ✓ |
| Redis | Streams + consumer groups | ✓ |
| Search | ProjectionManager + Meili/InMemory | ✓ |
| Public API | GET `/api/v1/*` read-only | ✓ |
| Identity | User · Session · Roles · JWT | ✓ |
| Marketplace | Seller · Inventory · Listing | ✓ |
| Golden Path | Register→…→GET /offers | ✓ |
| Smoke CI | `npm run smoke:golden-path` | ✓ |
| Smoke periódico | `npm run smoke:periodic` (30m) | ✓ |
| Integração | `infra/integration/docker-compose.yml` | ✓ |
| Métricas | Marketplace / Search / Identity | ✓ |
| Chaos básico | Redis down · worker morto · JWT restart | ✓ |
| Performance Budget | Login/Publish/Offers regressão | ✓ |

## Comandos

```bash
# CI gate (obrigatório antes de merge em main)
npm run smoke:golden-path

# Chaos + budgets
npm run test:chaos
npm run test:budget

# Ambiente production-like
npm run integration:up
# … migrations + workers (ver infra/integration/README.md)

# Smoke periódico (relatórios em reports/smoke/)
SMOKE_ONCE=1 npm run smoke:periodic
```

## Budgets congelados

| Operação | Budget |
|----------|--------|
| Login | &lt; 150 ms |
| Publish Listing | &lt; 250 ms |
| Listing → Search | &lt; 5 s |
| GET /offers | &lt; 100 ms |
| GET /search | &lt; 100 ms |

## Só então — Sprint 5

Quando este checklist estiver verde, inicia-se o bounded context financeiro:

```text
Cart → Checkout → Order → Reservation → Payment → Confirmation
```

Natureza diferente: consistência financeira, reserva de estoque, idempotência de pagamento, compensações.
