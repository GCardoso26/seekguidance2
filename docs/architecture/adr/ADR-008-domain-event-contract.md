# ADR-008 — Domain Event Contract

**Status:** Accepted  
**Data:** 2026-07-20  
**Tags:** events, contract, governance

## Context

Domain Events circulam entre Catalog, Pricing, Inventory, Marketplace, Saga e Search.
Sem contrato único, consumidores quebram e versionamento fica implícito.

## Decision

Todo Domain Event da plataforma **deve** seguir `platform/events/DomainEvent.ts`:

- `eventId`, `eventType`, `aggregateId`, `aggregateType`
- `version` (semântica; imutável por versão)
- `occurredAt`, `correlationId`, `causationId?`
- `actor?`, `tenantId?`
- `payload`

Nenhum evento “solto” fora do contrato.  
Eventos tipados usam nomes versionados: `PriceChanged.v1`, `ListingPublished.v1`, etc.

`DomainEventFactory` é a única forma canônica de criar eventos.

Compatibilidade: o envelope legado em `shared/events/types.ts` continua suportado via adaptadores (`toLegacy` / `fromLegacy`) até migração completa dos Application Services.

## Non-goals

- Não migrar todos os BCs em um único PR obrigatório.
- Não alterar payloads de eventos já publicados (ver ADR-010).

## Consequences

- Event Registry valida tipos/versões conhecidos.
- Outbox (ADR-004) persiste o contrato canônico (ou snapshot legado adaptado).
- Architecture tests falham se BCs emitirem objetos fora do contrato.
