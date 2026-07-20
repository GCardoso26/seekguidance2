# Architectural Governance Pack

Consolidação (ADR-008…011) sem refatorar BCs estáveis.

| Peça | Path |
|------|------|
| Domain Event Contract | `src/platform/events/DomainEvent.ts` |
| Factory | `DomainEventFactory` |
| Registry | `EventRegistry` |
| Idempotency | `src/platform/idempotency/` |
| CQRS | `src/platform/cqrs/` |
| Projections | `src/platform/projections/` |
| Feature Flags | `src/platform/feature-flags/` |
| Outbox (ADR-004) | `src/platform/outbox/` + `governance.ts` |
| Public barrels | `marketplace/public.ts`, `pricing/public.ts`, `inventory/public.ts`, `platform/public.ts` |
| Architecture tests | `src/architecture/__tests__/boundaries.test.ts` |
| Boundaries doc | [PUBLIC_API_BOUNDARIES.md](./PUBLIC_API_BOUNDARIES.md) |

## Migration

`supabase/migrations/20260720190000_platform_governance.sql`

## Pipeline CQRS

```
Command → Handler → Saga → Domain Event → Outbox → Projection → MV → Query
```

## Próximo épico

**Checkout BC** — apenas `*/public.ts` + Saga + Outbox. Zero SQL cross-schema.

Ver [CHECKOUT_BC_EPIC.md](./CHECKOUT_BC_EPIC.md) e [ADR-015](./adr/ADR-015-architecture-freeze-product-first.md).

**Arquitetura transversal congelada.** Novos componentes de plataforma exigem RFC + ADR.
