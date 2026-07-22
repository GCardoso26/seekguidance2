# GAME_IDENTITY_V2 — Search & Discoverability

**Persona:** Eduardo  
**Date:** 2026-07-22

## SEO

| Item | Portal `/{slug}` | Expansion `/{slug}/sets/{set}` |
|------|------------------|--------------------------------|
| Metadata title/description | ✅ | ✅ |
| Canonical (`withCanonical`) | ✅ | ✅ |
| OpenGraph | ✅ | ✅ |
| Twitter card | ✅ | ✅ |
| JSON-LD WebPage / CollectionPage | ✅ | ✅ |
| Breadcrumb (UI + schema) | portal schema; UI na expansion | ✅ |

## Discoverability

- Set index usa `ExpansionCardHero` → landing dedicada (não só `?set=` na busca)
- Alias `/expansions/[setSlug]` reexporta a mesma página
- Slug aliases (`magic`, `star-wars`, `dragon-ball`) resolvem para `GameId` sem novo BC

## Search APIs

Portal/expansion consomem apenas:

- `GET /api/catalog/sets`
- `GET /api/catalog/cards/search`
- `GET /api/decks/public`

Sem SQL cross-schema; sem clients internos de BC.
