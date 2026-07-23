# LIVE_DATA_PLATFORM — Acceptance

**Date:** 2026-07-22  
**Epic:** 7 — Live Data Platform  
**ADR:** 015 / 011 — composição FE sobre BFFs públicos

## Verdict

**PASS** — Home, portais, Card Page, Collection e Deck Workspace recebem blocos dinâmicos alimentados por APIs existentes (`decks/public`, `top-movers`, `trends`, `collection/insights`, `price-history`, `tournament-platform/events`, `buyer/recommendations`).

## Criteria

| Item | Status |
|------|--------|
| Home dinâmica | ✅ `LiveHomeFeed` |
| Portal por jogo vivo | ✅ `PortalLiveBlocks` |
| Universal Card Page ao vivo | ✅ `CardLivePanels` (7d/30d/90d + decks + torneios) |
| Collection viva | ✅ `CollectionLiveStrip` |
| Deck Workspace vivo | ✅ `DeckLivePanels` |
| Sem novo BC | ✅ |

## Paths

- `components/live-data/*`
- `lib/live-data/fetchers.ts`
