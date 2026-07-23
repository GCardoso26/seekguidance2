# BUG_FIX_REPORT

**Date:** 2026-07-22  
**Feature Freeze** — apenas correções com evidência

## Corrigidos

### BUG-QA-001 — Health Checkout V2 reportava `in_memory`

| Campo | Valor |
|-------|-------|
| Severidade | P0 operacional |
| Evidência | `health.ts` `inMemoryHealthDeps` usado por default em `createAuthenticatedApiServer`; Checkout V2 não injetava probes |
| Impacto | Readiness mentiroso; QA/ops não podiam confiar em persistência |
| Fix | `postgresCheckoutHealthDeps` + wire em `createCheckoutV2ApiStack` |
| Testes | `productionReadiness.test.ts` — 5 passed |
| Arquivos | `observability/http/health.ts`, `checkout/createCheckoutV2ApiStack.ts` |

## Conhecidos / não corrigidos (fora de escopo sem RFC ou evidência ops)

| ID | Descrição | Severidade |
|----|-----------|------------|
| GAP-PROJ-001 | OrderPaid sem projection Collection/Feed/Profile | P1 produto |
| GAP-STACK-001 | Identity/Marketplace in-memory no Checkout V2 process | P0 restart |
| GAP-PSP-001 | HMAC Stripe/MP incompleto | P0 segurança |
| GAP-PSP-002 | PIX/Stripe live não validado | P0 beta |
| GAP-DECK-E2E | Deck workspace error boundary em alguns E2E | P2 |
| GAP-8H | Campanha 8h não executada | P0 release |

## Regra Freeze

Nenhuma feature nova. Nenhum BC novo.
