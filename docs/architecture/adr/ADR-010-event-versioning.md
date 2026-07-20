# ADR-010 — Event Versioning

**Status:** Accepted  
**Data:** 2026-07-20  
**Tags:** events, versioning, compatibility

## Context

Consumidores (Search, Analytics, Projections) dependem de payloads estáveis.
Alterar um evento in-place causa regressões silenciosas.

## Decision

Eventos **nunca mudam**. Novas necessidades → nova versão:

```
PriceChanged.v1
PriceChanged.v2
```

`EventRegistry` registra: type, version, schema description, compatibility notes.  
Testes garantem que versões publicadas permanecem registradas.

## Non-goals

- Não exigir schema JSON Schema runtime em todos os ambientes na v1.
- Não forçar dual-write de v1+v2 automaticamente.

## Consequences

- Proibido alterar payload de versão já registrada.
- Producers escolhem versão explicitamente via Factory.
- Consumers devem tratar versões desconhecidas como no-op ou DLQ (política por BC).
