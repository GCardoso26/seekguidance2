# Playwright PDV Report

**Data:** 2026-07-22  
**Comando:** `npx playwright test e2e/specs/seller-pdv.spec.ts --project=chromium`  
**BASE_URL:** `http://127.0.0.1:3000`  
**Artefato:** `testing/reports/_bugfix_playwright_pdv.log`

## Antes (campanha PDV day)

3 failed / 2 passed — `skipIfPdvUnavailable` timeout em upsell apesar da UI PDV no snapshot.

## Depois (bugfix)

**5 passed (39.1s)**

### Fix

```ts
// aguarda pdv-manager | pdv-cart | pdv-barcode-input até 20s
```

`data-testid="pdv-manager"` já existia em `PdvManager.tsx` — problema era timing do `dynamic()`.

## Critério “Playwright verde”

**ATENDIDO** para o suite PDV seller.

## Critério “PDV E2E completo com estoque”

Parcialmente coberto pelo spec (early-return sem produto). **Estoque pós-venda: NÃO COMPROVADO** neste relatório.
