# ADR-002 — BullMQ transporta apenas comandos

**Status:** Accepted  
**Data:** 2026-07-16  
**Tags:** bullmq, commands, events

## Context

Misturar Domain Events em filas de trabalho acopla transporte de jobs a fan-out de fatos, complica retries e obscurece quem é a Source of Truth da publicação.

## Decision

- **BullMQ** carrega **comandos** (`SyncSetCommand`, `SyncCardCommand`, `SyncVariantCommand`, …) com **JobEnvelope**.
- **Event Bus** (via Outbox) carrega **eventos** (`CardUpdated`, `SetUpdated`, …).
- **Proibido** enfileirar Domain Events no BullMQ.

## Consequences

```text
Scheduler → Producer → BullMQ (command) → Processor → Application Service
  → Repos + Outbox → COMMIT → Publisher → Event Bus → Consumers
```

Processors são adapters finos; domínio fica na Application Service.
