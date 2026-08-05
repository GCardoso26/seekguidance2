# DATABASE_REPORT — AUDIT_PASS_2026-07-29

## Live

- API `database: ok` (2026-07-29T20:25Z)
- Checkout-v2 postgres: ok (`checkout_sessions_durable`)
- Projeto Supabase `rjgzaakhzuzdzcooywva` (TCG-SaaS)

## Incidentes

| Quando | Evento | Status |
|---|---|---|
| 2026-07-29 ~04:59Z | `No space left on device` → crash loop → econnrefused | Mitigado (DB voltou) |
| Contínuo | `uq_asset_version` duplicate key | OPEN |

## Advisors

- Security: 22 WARN / 113 INFO (RLS, SECURITY DEFINER, etc.)
- Performance: 155 WARN / 458 INFO (initplan, multiple policies, unindexed FKs)

## Não executado

- EXPLAIN de queries quentes
- Vacuum / bloat
- Certification `certify:db` contra prod

## Veredito

DB **operacional agora**, com **risco de capacidade** e **dívida RLS/índices**. Não READY sem remediação + monitoramento de disco.
