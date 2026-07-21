# CONCURRENCY_REPORT — Final Validation Sprint

**Gerado:** 2026-07-21T14:50:00Z  
**Status:** **FAIL** (caso obrigatório não executado)

## Caso: dois compradores, última unidade

**Esperado:** 1 pedido + 1 falha estoque insuficiente  
**Resultado:** **SKIPPED**

```text
npx playwright test e2e/specs/checkout-concurrency.spec.ts --project=chromium
→ 1 skipped, 1 passed (auth setup)
```

Motivo skip: `canRunCheckoutRace()` / legacy checkout API — não wired para Checkout V2 race.

## Outros casos obrigatórios

| Caso | Status |
|------|--------|
| Webhook duplicado | Stub unit PASS only |
| Dois webhooks simultâneos | **NOT RUN** live |
| ConfirmPayment ×10 | Stub unit PASS only |
| Dois compradores última unidade | **SKIPPED** |

## Confidence

**0%** para critério sprint “Concurrency PASS”

## Métricas

N/A (teste não rodou)
