# ASSET_PIPELINE_V2 — Performance

**Date:** 2026-07-22

## Guarantees in code

| Rule | Implementation |
|------|----------------|
| Never load original by default | Clients use medium/large presets; original only as last-resort URL |
| AVIF/WebP | Next `formats: avif,webp` + CDN format map from pipeline |
| Lazy loading | `loading="lazy"` unless `priority` (heroes) |
| Blur / LQIP | `placeholder="blur"` + SVG LQIP |
| Responsive | `sizes` per `MediaType` |
| Cache/CDN | Existing R2 public base + derivative URL naming |

## Targets

| Gate | Status |
|------|--------|
| Desktop Perf ≥95 | ⏳ post-deploy |
| Mobile Perf ≥90 | ⏳ post-deploy |
| Unit tests pipeline/derivatives | ✅ |

## Notes

Heavy sharp encoding remains behind workers/flags (existing design); V2 always emits the derivative/format/metadata contract so CDN/workers can fill binaries without FE changes.
