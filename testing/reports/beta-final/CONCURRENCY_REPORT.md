# CONCURRENCY_REPORT

**Date:** 2026-07-20

## Spec

`e2e/specs/checkout-concurrency.spec.ts` — 2 buyers / 1 stock

## Resultado deste run

**SKIPPED** — requer `canRunCheckoutRace()` + `buyer.json` + `buyer-b.json` + produto de race.

## Esperado (quando habilitado)

1 compra aprovada · 1 rejeitada · estoque ≥ 0 · sem dois pedidos

## Status

**NÃO EVIDENCIADO** neste final sprint.
