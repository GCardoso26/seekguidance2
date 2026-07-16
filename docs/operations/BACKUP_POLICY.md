# Backup Policy — JudgeTCG

**Status:** Congelado — Sprint 6  
**Princípio:** só **PostgreSQL** é fonte de verdade persistente de domínio.

## PostgreSQL

| Item | Política |
|------|----------|
| Frequência | Diário (full) + WAL contínuo se disponível |
| Retenção | 14 dias (mínimo); 30 dias recomendado em prod |
| Escopo | Schemas: `catalog`, `platform`, `identity`, `marketplace`, `cart`, `order`, `reservation`, `payment` |
| Restore test | Mensal — restore em ambiente isolado + `npm run certify:db` + smoke golden-path |
| RPO alvo | ≤ 24h (diário); ≤ 5 min com WAL |
| RTO alvo | ≤ 4h |

### Procedimento de restore (alto nível)

1. Provisionar instância vazia.
2. Restore do backup + replay WAL até ponto escolhido.
3. Validar migrations aplicadas (`applyFoundationMigrations inspect`).
4. Rodar `certify:db` · `certify:order` · `smoke:golden-path`.
5. Só então apontar apps.

## Redis

- **Não** é fonte de verdade.
- Streams / cache / broker podem ser reconstruídos.
- Após perda: republish Outbox pendente → consumers recuperam.
- Sem backup obrigatório de Redis para domínio.

## Meilisearch

- Índice é **derivado** da Search Projection / Catalog events.
- Após perda: rebuild via ProjectionManager (replay Outbox / reindex).
- Sem backup obrigatório do índice para domínio.

## Outbox

- Persiste em Postgres (`platform.outbox_events`) — coberto pelo backup PG.
- Após restore: publisher retoma pending/leased conforme leases.

## O que não fazer

- Não restaurar Meili/Redis como SoT.
- Não truncar `outbox_events` sem runbook.
- Não pular restore test trimestral em produção.
