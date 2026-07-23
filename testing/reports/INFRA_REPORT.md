# INFRA_REPORT

**Persona:** Ricardo (Infra / SRE)  
**Gerado:** 2026-07-22T06:55:00Z  
**Status:** **FAIL** · Confidence **35%**

## Environment Audit (local gate)

| Métrica | Valor |
|---------|-------|
| Score | **67%** |
| Blocking | **3** |
| Ready for Functional QA | **NO** |
| Artefato | `environment-audit-latest.md` |

Blocking: Runtime Console `localhost:3000` down · API health local · Search local.

## Produção / Checkout Render

| Check | Resultado |
|-------|-----------|
| FE `judgetcg.com.br` | UP (várias rotas 200) |
| Checkout health | 200 **mas** postgres/redis/meili = **`in_memory`** |
| Outbox check | `accessible` (claim health) |
| Workers check | `connected` (claim health) |
| Secrets audit automatizado | Migrations WARN (DATABASE_URL ausente no audit local) |

## Feature Flags / Migrations / CDN

| Item | Status |
|------|--------|
| Feature flags FE | Presentes no código (COLLECTION/DECK/PLAYER_*) |
| Migrations Checkout | Não revalidadas nesta rodada |
| CDN / Storage upload | WARN — não auditado |
| Chaos Redis/Worker OFF | **NÃO EXECUTADO** |

## Veredito

Infra **não** libera Beta: audit local FAIL + Checkout sem persistência durável comprovada.
