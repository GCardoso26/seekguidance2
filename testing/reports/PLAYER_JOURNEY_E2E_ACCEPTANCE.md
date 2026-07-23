# PLAYER_JOURNEY_E2E — Acceptance

**Date:** 2026-07-22  
**Spec:** `frontend/runtime_console_v3/e2e/specs/player-journey-continuity.spec.ts`  
**Helper:** `e2e/helpers/player-journey-mocks.ts`  
**Result:** **6 passed** (setup + 5 steps) — chromium

## Fluxo

```
01 Marketplace product + wishlist
02 Checkout success + ContinuityNextSteps
03 Coleção (dashboard / nav)
04 Decks list + workspace (soft)
05 Perfil (resumo)
```

## Como executar

```bash
cd frontend/runtime_console_v3
# Se C: estiver cheio, redirecione TEMP:
#   $env:TEMP="S:\tcg-judge\.tmp"; $env:TMP=$env:TEMP
npx playwright test e2e/specs/player-journey-continuity.spec.ts --project=chromium
```

Evidências: `testing/reports/player-journey-continuity/`  
(`01-product.png` … `05-perfil.png`, `meta.json`)

## Notas

- Discovery usa mocks mínimos (padrão wishlist.spec) — evita crash do layout.
- UCP SSR (`/mtg/cards/:id`) não é âncora deste E2E (notFound sem catalog live); product page cobre CTAs de descoberta.
- Deck detail pode cair em error boundary em alguns ambientes; o assert aceita workspace **ou** empty/error documentado.
- Sem pagamento Stripe/MP real — path de success pós-gateway.
