# PLAYER_PROFILE_V2_INTEGRATION_REPORT

**Gerado:** 2026-07-22  

## Fronteiras (ADR-011)

| Domínio | Consumo | Cross-schema SQL |
|---------|---------|------------------|
| Players | `/api/players/me`, `/api/players/:handle` | Não |
| Collection | `/api/user/collection/insights` | Não |
| Decks | `/api/decks`, `/api/decks/public` | Não |
| Buyer / Checkout / Orders | `/api/buyer/dashboard` | Não |
| Wishlist | `/api/wishlist` | Não |
| Gamification | `/api/gamification/*` | Não |
| Favorites | `judge-favorites` local + favorite_stores | Não |
| Marketplace seller | Links para `/vendedor/painel` | Não |

## Providers estruturais

- `defaultAchievementsProvider` — `lib/profile-achievements.ts`
- `defaultActivityFeedProvider` — `lib/profile-activity.ts`
- `defaultBadgesProvider` — `lib/profile-badges.ts`
- AI slots — `lib/profile-ai-slots.ts` (interfaces only)

## Feature flags

```
PLAYER_PROFILE_V2
PLAYER_PUBLIC_PROFILE
PLAYER_ACHIEVEMENTS
PLAYER_ACTIVITY
PLAYER_BADGES
```

Env: `NEXT_PUBLIC_FEATURE_<FLAG>` (default on; sandbox/dev força on).

## Typecheck

`npx tsc --noEmit` — **PASS** (2026-07-22)

## Veredito

**APROVADO** — nenhum BC novo; apenas orquestração FE sobre APIs públicas.
