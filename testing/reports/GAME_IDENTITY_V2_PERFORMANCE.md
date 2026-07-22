# GAME_IDENTITY_V2 — Performance

**Date:** 2026-07-22

## Patterns retained / used

| Pattern | Where |
|---------|--------|
| Lazy / Next Image | Large cards + logos (`sizes`, priority só no hero logo) |
| CSS FX (not JS particles) | `game-themes.css` keyframes |
| Code splitting | Client islands (`GameHubPage`, expansion client) |
| Skeletons | Expansions index loading |
| Streaming Suspense | `GameHubPage` |
| `prefers-reduced-motion` | Disables hero/FX animations |

## Targets

| Gate | Target | Status |
|------|--------|--------|
| Lighthouse Desktop Perf | ≥95 | ⏳ Measure post-deploy on `/lorcana`, `/pokemon`, `/mtg`, set landing |
| Lighthouse Mobile Perf | ≥90 | ⏳ Same sample |
| `tsc --noEmit` | clean | ✅ |

## Risks / mitigations

- Large card grids: cap sections (4–8 items); full checklist via existing search route
- Multiple Google fonts avoided — CSS font stacks per theme (no layout font bloat)
- Hero video: structure only (no auto-download assets)

## Suggested LH sample (post-deploy)

```bash
cd frontend/runtime_console_v3
npm run lighthouse:prod
# or manual URLs: /, /pokemon, /mtg, /lorcana, /pokemon/sets/<slug>
```
