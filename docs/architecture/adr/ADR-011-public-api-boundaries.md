# ADR-011 — Public API Boundaries

**Status:** Accepted  
**Data:** 2026-07-20  
**Tags:** boundaries, cqrs, governance

## Context

Checkout e futuros BCs não podem importar repositórios/schemas de outros domínios.
Sem fronteiras explícitas, o monorepo vira um big ball of mud.

## Decision

Cada BC declara **Public API** (services, DTOs, commands, queries, events).  
Documentação canônica: [`PUBLIC_API_BOUNDARIES.md`](../PUBLIC_API_BOUNDARIES.md).

Proibido entre BCs:

- Importar `*/persistence/*` ou `*/repositories` de outro domínio
- SQL cruzado (`SELECT` em schema alheio)
- Acesso a tabelas de outro BC

Permitido:

- Public Services / Query Services
- Commands / Queries / Domain Events
- Saga Orchestrator

Architecture tests em `src/architecture/__tests__` falham o build em violações.

## Consequences

- Checkout consome apenas interfaces públicas.
- Marketplace permanece orquestrador (ADR-007 + Orchestrator).
