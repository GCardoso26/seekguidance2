# ASSET_PIPELINE_V2 — Integration

**Date:** 2026-07-22

## Reused systems (no new BC)

| System | Usage |
|--------|--------|
| Asset Service | `ingest`, `listForEntity`, pipeline V2, `public.ts` |
| Product Catalog | Existing `assets.ingest` on variant images (primary/gallery) |
| Catalog API (FE BFF) | Card `imageUris` → HD resolve |
| Marketplace / Collection / Deck | `CardImage` / `ResponsiveImage` / deck cover resolver |

## Entity / role extensions (same `media.*` tables)

- Entity: `catalog_set`, `deck`, `profile`, `game`, `news`, `event`
- Roles: `hero_mobile`, `banner`, `background`, `key_art`, `lifestyle`, `transparent`, `cover`, …

Metadata stored in `derivatives._meta` (no new database) — alt, caption, copyright, provider, source, license, hash, mime, checksum, palette, LQIP.

## FE integration points

- Portal `GameHero` → `HeroAssetFrame`
- Large visual cards → `ResponsiveImage`
- Expansion landing → sealed `AssetGallery`
- `CardImage` → `ResponsiveImage` (CARD)
- Skeletons re-exported from `ui/skeletons`
