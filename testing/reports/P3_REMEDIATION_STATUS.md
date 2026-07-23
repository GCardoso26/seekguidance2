# P3_REMEDIATION_STATUS

**Date:** 2026-07-23  
**Bug:** BUG-V4-010

## Results

| ID | Status | Evidence |
|----|--------|----------|
| BUG-V4-010 | **CLOSED** | RLS enable em **28/28** tabelas `product_catalog`; `REVOKE` USAGE/ALL de `anon`/`authenticated`/`PUBLIC`; zero policies client (= deny-by-default) |

## Migration

`supabase/migrations/20260722260000_product_catalog_rls_p3.sql`  
Aplicada em prod `rjgzaakhzuzdzcooywva`.

## Security model

- Catálogo **somente server-side** via `DATABASE_URL` (role com bypass / owner).
- Sem policies para `anon`/`authenticated` → acesso Data API bloqueado mesmo se grants forem reintroduzidos.
- Sem `FORCE ROW LEVEL SECURITY` (API owner/superuser continua operacional).

## Validation (prod)

- `rls_on=28`, `rls_off=0`
- `anon_usage=false`, `authenticated` USAGE=false
- Reads server-side em `products` / `provider_registry` OK

## Residual

Nenhum P0–P3 aberto no backlog V4. Re-correr certificação / release readiness se desejado.
