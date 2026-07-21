# CHAOS_TEST_REPORT — Final Validation Sprint

**Gerado:** 2026-07-21T14:50:00Z  
**Status:** **PARTIAL PASS** (light chaos unit only)

## Executado

```text
cd services/api
npx vitest run src/ops/__tests__/chaos.light.test.ts
→ 4/4 PASS
```

Inclui: Redis indisponível → outbox acumula → catch-up sem perdas (in-memory/simulated).

## Não executado (obrigatório sprint)

Desligar em ambiente integrado durante checkout:

- Redis (live stack)
- Worker
- Gateway
- Search

Recuperação observada ponta a ponta: **NOT RUN**

## Confidence

**35%** (unit light chaos OK; campanha “Chaos PASS” **NO**)

## Bugs

Nenhum novo além de bloqueadores Checkout V2.
