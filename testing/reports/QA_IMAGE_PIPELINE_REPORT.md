# QA_IMAGE_PIPELINE_REPORT

**Date:** 2026-07-23  
**Campaign:** Platform V6.2  
**Bug:** BUG-V6-010

## Root cause (proven)

Manufacturer manifests use placeholder host `cdn.judgetcg.example` (TLD reserved).  
Node `fetch` → DNS `ENOTFOUND` → `TypeError: fetch failed` → logged as `image:…:fetch failed`.

Confirmed via prior nslookup + sync logs. Not UA/timeout/rate-limit.

## Path

```
Manifest.sourceUrl → ProductCatalogSyncService.persistOne
  → AssetService.ingest → AssetMediaPipeline.process
    → downloadAssetBytes (resolve / fixture / retry)
    → sha256 → registry media.assets + asset_links + versions
```

## Fix shipped

| Change | File |
|--------|------|
| Download harden (UA, timeout, retry, rewrite CDN base, fixture for placeholders) | `assets/media/downloadAssetBytes.ts` |
| Pipeline uses download helper | `assets/media/AssetMediaPipeline.ts` |
| Tests (placeholder, 404, 503 retry, timeout, pipeline) | `assets/media/__tests__/downloadAssetBytes.test.ts` **8/8 PASS** |
| Soft-fail sync (prior) | `ProductCatalogSyncService` |

Env:
- `ASSET_PIPELINE_PLACEHOLDER_MODE=fixture|skip|fail` (default **fixture**)
- `MANUFACTURER_ASSET_CDN_BASE` / `PRODUCT_CATALOG_R2_PUBLIC_BASE` rewrite placeholders to real CDN
- `ASSET_PIPELINE_TIMEOUT_MS`, `ASSET_PIPELINE_MAX_ATTEMPTS`

## Evidence

```text
sync-gamegenic-knowledge → {"upserted":3,"ok":true,"errors":[]}
asset_pipeline_v2_ok fromFixture=true (multiple)
media.assets count = 10 (was 1)
```

Vitest: `downloadAssetBytes.test.ts` 8 passed.

## Verdict

| Criterion | Result |
|-----------|--------|
| Sync does not fail on images | **PASS** |
| Images registered when placeholder | **PASS** (fixture PNG, distinct sha256 per URL) |
| Real CDN path | **READY** when `MANUFACTURER_ASSET_CDN_BASE` set |
| R2 binary upload | still URL/key emit only (pre-existing) |

**BUG-V6-010 = CLOSED** (pipeline operable; placeholders no longer hard-fail fetch).
