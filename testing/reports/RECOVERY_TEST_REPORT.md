# RECOVERY_TEST_REPORT

**Gerado:** 2026-07-22T02:58:00Z  
**Verdict:** **NOT PASS** / SKIPPED full

## Observado incidentalmente
- Restart API local Checkout V2 (`npm run api:checkout-v2`) → health 200; E2E subsequente PASS
- Tunnel CF: com origin DOWN → health/BFF **502**; com origin UP → health **200** / BFF **401**

## Não executado (obrigatório)
| Reiniciar | Pedidos/Reservas/Eventos/Checkout preservados? |
|-----------|--------------------------------------------------|
| Frontend | SKIPPED |
| API Render Web Service | N/A — Private Service sem URL pública |
| Workers / BullMQ | SKIPPED |

**READY recovery = NO**
