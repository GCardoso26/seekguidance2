# GAME_IDENTITY_V2 — Acceptance

**Epic:** 6 — Game Identity System + Expansion Landing Pages  
**Date:** 2026-07-22  
**Scope:** Frontend UX/UI only · ADR-015 / ADR-011 respected  
**Repo:** `frontend/runtime_console_v3`

## Verdict

**PASS (code & architecture)** — Theme Engine V2, cinematic heroes, expansion landings, large visual cards (~420×560), marketplace skins, SEO metadata/JSON-LD, and unit tests are in place.  
**Lighthouse ≥95 / ≥90:** deferred to post-deploy measurement (see Performance report).

## Acceptance criteria

| Criterion | Status | Evidence |
|-----------|--------|----------|
| Theme Engine V2 for all supported TCGs | ✅ | `src/lib/experience/game-theme.ts` + `tests/lib/game-theme-v2.test.ts` |
| Distinct visual identity per game | ✅ | mood/texture/typography/hero/marketplace skin per `GameId` |
| Cinematic hero on all portals | ✅ | `GameHero` / `PortalHero` + `game-themes.css` |
| Expansion Landing Pages via existing APIs | ✅ | `/{slug}/sets/[setSlug]` (+ `/expansions/[setSlug]` alias) |
| Large cards ≈400×500 | ✅ | `LargeVisualCards.tsx` (420×560) |
| Reusable visual components | ✅ | Expansion / Hero / Marketplace / Sealed / Deck / News / Event |
| Marketplace game identity, same backend | ✅ | Portal marketplace section + `MarketplaceGameSkin` on `/loja/busca?game=` |
| Lighthouse Desktop ≥95 / Mobile ≥90 | ⏳ | Post-deploy — see `GAME_IDENTITY_V2_PERFORMANCE.md` |
| `tsc --noEmit` clean | ✅ | Ran 2026-07-22 |
| No new Bounded Context | ✅ | FE-only; Catalog/Decks/Marketplace BFF only |
| ADR-015 / ADR-011 | ✅ | No cross-schema, no new BC, public BFF routes only |
| Reports | ✅ | This file + UX / Buyer / Search / Performance |

## Routes

- `/{gameSlug}` — Game landing (Theme V2)
- `/{gameSlug}/expansions` — Set index (large cards)
- `/{gameSlug}/sets/{setSlug}` — Expansion landing (canonical)
- `/{gameSlug}/expansions/{setSlug}` — Alias
- Alias slug example: `/magic` → MTG theme (`gameIdFromSlug`)

## Non-goals honored

- No new BCs, SQL, internal schema access
- No Pricing/Catalog duplication
- Events / Ranking sections are navigation anchors (content epic post-Beta)
