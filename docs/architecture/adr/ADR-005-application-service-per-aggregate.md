# ADR-005 — Application Service por Aggregate Root

**Status:** Accepted  
**Data:** 2026-07-16  
**Tags:** ddd, application-service, aggregate

## Context

Services “god” que persistem Set + Card + Variant na mesma TX inflamam locks, dificultam retries e misturam regras.

## Decision

Cada Application Service é **dona de um Aggregate Root principal**:

| Service | AR principal |
|---------|----------------|
| `PersistCatalogSetApplicationService` | Set |
| `PersistCatalogCardApplicationService` | Card |
| `PersistCatalogVariantApplicationService` | Variant |

Mapping do mesmo tipo pode ir na mesma TX como satélite.  
Orquestração multi-AR = múltiplos comandos/jobs, não mega-TX.

## Consequences

- Um repository por Aggregate Root; sem `save(any)`.
- `RepositoryResult` (`created`/`updated`/`unchanged`) decide Outbox.
- Processors só chamam um AS por job.
