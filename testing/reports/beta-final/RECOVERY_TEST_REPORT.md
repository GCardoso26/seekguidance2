# RECOVERY_TEST_REPORT

**Date:** 2026-07-20

## Evidência

- Outbox: commit-before-publish + retry após falha publisher (PASS)
- FE restart: necessário após chunks/EADDRINUSE (BUG-0005 reincidência operacional)
- Continuous smoke detectou Console DOWN (score 67%) — recovery = reinício `npm run dev` com `API_PROXY_TARGET`

## Gaps

- Restart controlado API Node + BullMQ + Projection com asserts de pedidos/reservas em DB staging

## Status

**PARCIAL** — outbox recovery OK; recovery full stack não formalizado.
