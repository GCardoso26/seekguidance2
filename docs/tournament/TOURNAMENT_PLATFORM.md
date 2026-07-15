# TOURNAMENT_PLATFORM.md

**Program:** Business Program 2  
**Package:** `services/api/app/tournament_platform/`  
**Status:** Additive over RC1 tournament engine

## Principle

Do not rewrite `app/tournament` or `/runtime/judge/tournaments/*`.  
Tournament Platform adds Store Event → Tickets → Registration → Judge/Prize/Analytics around the existing Swiss/bracket engine.

## Graph

```
Store → StoreEvent → Tournament(s) [RC1]
                  → Tickets (InventoryType.EVENT contract)
                  → Registrations → Check-ins
                  → Staff / Penalties / Prizes / Decklist archives
```

## Naming

Avoid bare `events` tables/packages (conflicts with product analytics Event Registry).  
Use `store_events`, `tournament_platform`, `tp_*`.

## Dual-read

When platform tables are empty, adapters project `tournaments`, `tournament_participants`, `pairings`, standings from RC1.

Flag: `TOURNAMENT_PLATFORM_DUAL_WRITE` (optional future; writes to legacy participants off by default).
