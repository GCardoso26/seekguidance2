# AUDIT_REPORT — JudgeTCG

**Pass:** AUDIT_PASS_2026-07-29  
**Gerado:** 2026-07-29T20:35:00Z  
**Executor:** Platform Guardian (evidence-only)  
**READY_FOR_PRODUCTION:** **FALSE**

## Escopo honesto desta passagem

Auditoria **completa por intenção** ≠ prova exaustiva de todas as 20 camadas nesta sessão.  
O que **não** foi executado está listado em `audit-evidence.json` → `not_executed_this_pass`.  
Critérios READY do prompt (Lighthouse ≥95, load 100→1000, CVC ≥8, P0=P1=0) **não** estão satisfeitos.

## Veredito executivo

| Critério do prompt | Resultado | Evidência |
|---|---|---|
| P0 = 0 | **FALSE** | Pagamentos `deferred`; frete desabilitado; risco operacional de disco (incidente 29/07) |
| P1 = 0 | **FALSE** | Vitest 5 falhas remanescentes; advisors RLS/perf; `uq_asset_version` errors |
| Sem regressões | **FALSE** | Suite frontend 6→5 falhas após fix de teste; 5 OPEN |
| Sem erros no console | **NÃO PROVADO** | Crawl browser não rodado nesta pass |
| Sem hydration | **NÃO PROVADO** | — |
| Checkout certificado | **FALSE** | PIX/OpenPix disabled; Melhor Envio disabled; payments deferred |
| Marketplace funcional | **PARCIAL** | Shells HTTP 200; liquidez/LPC=0 |
| Knowledge Graph íntegro | **NÃO PROVADO** | Sem query de órfãos nesta pass |
| BullMQ operacional | **NÃO PROVADO** | `certify:bullmq` não rodado |
| Redis operacional | **TRUE (API)** | `/v1/health` → redis ok |
| Assets íntegros | **PARCIAL** | Sync gera `uq_asset_version` duplicates |
| Lighthouse ≥95 | **NÃO PROVADO** | Não medido nesta pass |
| Load 100→1000 | **NÃO PROVADO** | — |
| CVC Compraria Hoje ≥8 | **FALSE** | Score 2026-07-23: would_buy_now=0; satisfaction=2.1 |

## Live baseline (provado agora)

- API `tcg-judge-api`: **healthy** — database ok, redis ok, stripe ok, **payments deferred**, openpix disabled, melhor_envio disabled, sentry disabled (commit `c3ce4c8c`).
- Checkout-v2 health: **ok** (postgres durable + outbox + workers).
- Páginas: `/`, `/lorcana`, `/lorcana/expansions`, `/loja`, `/mtg`, `/magic`, robots, sitemap → **200**.
- Catálogo search + events → **200**.
- Vitest frontend: **472 pass / 6 fail** (MobileLayout corrigido nesta pass; restam 5).
- Supabase advisors: security **22 WARN / 113 INFO**; performance **155 WARN / 458 INFO**.
- Postgres logs: erros repetidos `duplicate key uq_asset_version`.

## North Star (produto)

LPC=0, LCS=0%, Beta **Not started** (`PROJECT_STATUS.md` gerado 2026-07-20 — stale relativo a código, mas métricas de produto continuam zero).

## Hierarquia de verdade

Constitution → ADRs → North Star → evidência operacional.  
Readiness de engenharia **não** substitui North Star.

## Próxima iteração (ordem P0→P1)

1. Ativar/certificar gate de pagamentos (PIX + Stripe) com `certify:checkout:prod` / `certify:payment`.
2. Frete Melhor Envio ou decisão explícita de escopo Beta.
3. Corrigir race `uq_asset_version` no pipeline de assets.
4. Remediação advisors: SECURITY DEFINER executável por anon; RLS always-true; leaked password protection.
5. Zerar falhas Vitest remanescentes + Playwright smoke buyer.
6. Lighthouse CI nas rotas beachhead + load smoke.

## Artefatos

Ver irmãos neste diretório + `audit-evidence.json`.
