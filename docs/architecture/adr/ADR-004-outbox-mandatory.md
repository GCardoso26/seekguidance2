# ADR-004 — Outbox obrigatório

**Status:** Accepted  
**Data:** 2026-07-16  
**Tags:** outbox, consistency, events

## Context

Publicar no Event Bus dentro da mesma unidade lógica que escreve domínio, sem Outbox, causa dual-write: evento sem commit ou commit sem evento.

## Decision

Toda publicação de Domain Event **passa pelo Outbox** na mesma transação que a escrita de domínio.  
`TransactionManager` **não** conhece Outbox — a Application Service decide o insert.  
Publisher usa lease + `SKIP LOCKED`; payload é imutável.

## Consequences

- Proibido: `EventBus.publish` / Redis direto a partir de Application Service de escrita de domínio.
- Timeline: `occurredAt` · `committedAt` · `publishedAt` · `processedAt`.
- Consumers usam `consumer_offsets` para idempotência.
