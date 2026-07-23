# RECOVERY_REPORT

**Gerado:** 2026-07-22T06:55:00Z  
**Status:** **FAIL** / **NÃO EXECUTADO** (full stack)

## Cenários exigidos

API / Worker / BullMQ / Redis / Search restart · Gateway down · Webhook atrasado

## Evidência nesta rodada

| Item | Resultado |
|------|-----------|
| Outbox unit (accumulate + catch-up) | PASS (teste unitário) |
| Recovery full stack | **NÃO EXECUTADO** |
| Pedidos/reservas/eventos sob crash | **Sem evidência** |
| Health Render `in_memory` | Indica que recovery durável **não** é confiável no host atual |

## Veredito

**PARCIAL (unit only)** — insuficiente para Beta.
