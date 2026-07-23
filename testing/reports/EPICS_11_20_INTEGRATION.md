# EPICS_11_20 — Integration

**Date:** 2026-07-22

## Stack

Frontend → BFF → Public API → Application → Domain → Events → Projection → UI

## Feature flags

`INTELLIGENCE_PLATFORM`, `NOTIFICATION_CENTER_V2`, `SELLER_EXPERIENCE_V2`, `MARKETPLACE_INTELLIGENCE`, `EDITORIAL_PLATFORM`, `MOBILE_FIRST_V2`, `PERFORMANCE_V2`, `GAMIFICATION_V2`, `AI_ASSISTANTS`, `ECOSYSTEM_PLATFORM`

## ADRs

ADR-008/009/010/011/015 respeitados — nenhum BC novo, sem SQL cross-schema, só APIs públicas.

## Personas smoke (manual)

Juliana · Carlos · Marina · Fernanda · Eduardo · Daniela · Renato — rotas `/colecao`, `/decks`, `/notifications`, `/vendedor/painel`, `/marketplace/intelligence`, `/editorial`, `/ecossistema`.

## Automated

- `npm run type-check`
- `vitest` — `tests/lib/intelligence-providers.test.ts`, `tests/lib/epics-11-20.test.ts`
