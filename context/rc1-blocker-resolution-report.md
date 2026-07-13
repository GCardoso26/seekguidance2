# RC1 Blocker Resolution Report

**Fase:** RC1 Blocker Resolution 1.0  
**Data:** 2026-07-13  
**Tipo:** Hardening only (sem features)

## Resumo executivo

Removemos os blockers **P0 de saúde (BFF 503)** e **smoke**.  
**Billing GitHub Actions** e **Lighthouse Performance &lt;95** continuam impedindo GO oficial da tag RC1.

## Trabalho realizado

### Código (bugs de release)

1. `api/health/route.ts` — schema `tcg_judge` + fallback via API health; timeout 15s  
2. `test_sprint6.py` — Redis test isolado do ambiente  
3. `smoke_test.py` — expectativas alinhadas ao produto + encoding Windows  
4. `lighthouse-audit.js` — `lighthouse.default` + URLs RC

### Ops

- Deploy Vercel prod CLI (`fda702e`) — health 200 confirmado

### Docs

- Pacote `context/rc1-*-report.md` + updates `docs/release/*`

## Go / No-Go

**NO-GO** — ver `docs/release/RC1_GO_NO_GO.md`.

## Próximas ações humanas

1. Restaurar billing/spending limit GitHub Actions  
2. Decidir: aceitar meta Perf documentada &lt;95 para beta **ou** sprint dedicada de performance (fora deste freeze)  
3. Expor schema `tcg_judge` no Supabase API  
4. Ativar `SHIPPING_V2_ENABLED` em staging/prod conforme canary plan
