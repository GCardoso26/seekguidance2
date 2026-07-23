# CONCURRENCY_REPORT

**Gerado:** 2026-07-22T06:55:00Z  
**Status:** **FAIL**

## Cenário

Dois compradores · mesmo listing `76ba13ac-6ef5-4ea0-a842-4858cb6c3a6c` · última unidade esperada · confirm com `simulateSuccess`

## Observado (Render)

| Buyer | Session | add item | confirm |
|-------|---------|----------|---------|
| b1 | `2e24a392-…` | 200 / payment_pending | **failed** |
| b2 | `f49c5da2-…` | 200 / payment_pending | **failed** |

**Esperado:** 1 pedido completed + 1 estoque insuficiente.  
**Obtido:** ambos failed — padrão de concorrência **não comprovado**.

Artefato: `qa-beta-orchestrator-evidence-latest.json`

## Idempotência (confirm ×10)

| Métrica | Valor |
|---------|-------|
| Calls | 10 |
| Status `completed` | 10 |
| Unique status | `completed` |

Status idempotente **PASS**. Contagem única de OrderCreated/outbox/estoque **não auditada em SQL** (proibido cross-schema / sem acesso).

## Veredito

Concorrência de estoque **FAIL**; idempotência de status **PASS com ressalva**.
