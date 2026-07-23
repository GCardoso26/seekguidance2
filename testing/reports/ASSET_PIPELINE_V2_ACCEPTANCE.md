# ASSET_PIPELINE_V2 — Acceptance

**Date:** 2026-07-22  
**Scope:** Assets BC extension + FE visual pipeline (UX/UI)  
**ADR:** 015 / 011 — no new BC; public surface via `assets/public.ts`

## Verdict

**PASS (architecture & code)** — Media type catalog, derivative map (AVIF/WebP/JPEG + sizes), metadata/LQIP, ResponsiveImage, galleries, hero desktop/mobile, skeletons, and HD card resolution are implemented on top of the existing Asset Service + Product Catalog ingest path.

**Lighthouse ≥95/≥90:** measure post-deploy (see Performance report).

## Criteria

| Criterion | Status |
|-----------|--------|
| Unified media type catalog | ✅ `MEDIA_TYPES` (BE + FE) |
| Pipeline multi-res + modern formats | ✅ `buildFormatDerivativeMap` + pipeline V2 envelope |
| Sealed/accessory galleries | ✅ `AssetGallery` + `buildSealedGallery` |
| Expansion logo/banner/background/key art | ✅ `resolveExpansionAssets` (+ Asset entity `catalog_set` roles) |
| Hero desktop/mobile/video structure | ✅ `HeroAssetFrame` + `GameHeroConfig` fields |
| Cards HD across surfaces | ✅ `cardImageUrl` prefers full→large; `CardImage`→`ResponsiveImage` |
| Lazy / blur / sizes | ✅ `ResponsiveImage` |
| Content skeletons | ✅ Card/Booster/Marketplace/Hero/Collection/Deck/Profile |
| No new BC / ADR | ✅ Extends `services/api/src/assets` |
| Reports | ✅ This suite |

## Key paths

- BE: `services/api/src/assets/public.ts`, `domain/mediaTypes.ts`, `cdn/derivativeUrls.ts`, `media/AssetMediaPipeline.ts`
- FE: `frontend/runtime_console_v3/src/lib/assets/*`, `components/assets/*`
