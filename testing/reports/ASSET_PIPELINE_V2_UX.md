# ASSET_PIPELINE_V2 — UX

**Date:** 2026-07-22

## Perceived quality

| Surface | Before | After |
|---------|--------|-------|
| Portal hero | CSS-only glow | Ready for desktop/mobile/overlay stills + video poster |
| Large cards | Raw `next/image` | ResponsiveImage + blur + hover zoom + mediaType |
| Sealed products | Single icon | Gallery (frente/verso/lateral/zoom) with stage 420×560 |
| Cards | Prefer `normal` | Prefer HD `full`→`large` on PDP paths |
| Loading | Generic pulse | Typed skeletons (hero/card/booster/marketplace/…) |

## Premium cues

- Consistent 420×560 marketplace/sealed frames  
- Never stretch a lone tiny thumb as if it were key art (clamp + gallery placeholders until Asset Service fills shots)  
- Dominant color / LQIP hooks for smoother paint
