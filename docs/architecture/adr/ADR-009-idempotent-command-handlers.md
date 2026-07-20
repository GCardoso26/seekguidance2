# ADR-009 — Idempotent Command Handlers

**Status:** Accepted  
**Data:** 2026-07-20  
**Tags:** idempotency, commands, reliability

## Context

Retries de BullMQ, Saga e clientes HTTP duplicam comandos (`PublishProductListing`, `Inventory.hold`, etc.).

## Decision

Todo Command Handler crítico **deve** ser idempotente via `platform/idempotency`:

1. Recebe comando + `idempotencyKey`
2. Se chave existe e `status=completed` → retorna `response` anterior
3. Senão executa, persiste resultado, retorna

Tabela: `platform.idempotency_keys`  
Escopo inicial: PublishProductListing, Inventory Hold/Confirm/Release, Pricing Refresh.

## Consequences

- Chaves são imutáveis após `completed`.
- Falhas podem re-executar se `status=failed` (política explícita).
- Checkout BC herdará o mesmo padrão.
