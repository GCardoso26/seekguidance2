# QA_PLATFORM_V5_ASSETS

**Date:** 2026-07-23  
**Verdict:** **FAIL**

## Evidence

| Metric | Value |
|--------|------:|
| `media.assets` | 1 |
| `media.asset_links` | (baseline V4: 1) |
| sync_runs failed | 79/79 |
| Error pattern | `image:…:fetch failed` |

## Findings
- BUG-V5-004: ingest de imagem falha sistematicamente.  
- BUG-V5-011: pipeline não materializa galeria/CDN em volume.  
- Versioning / health / LQIP / AVIF / WebP / R2 **NOT_EXECUTED** live.

## Gate
Asset Pipeline **não validado**.
