# Asset Pipeline

Caminho MISS (depois da Asset Library no `ProductionService`):

```
Asset Library HIT (APPROVED, não mock)
        ↓ MISS
PexelsProvider          (PEXELS_API_KEY)
        ↓ MISS / RATE_LIMIT / TIMEOUT / AUTH_ERROR
PixabayProvider         (PIXABAY_API_KEY)
        ↓ MISS
ComfyUIProvider         somente se COMFY_BASE_URL (OPTIONAL)
        ↓
AUTOMATION_MODE=mock    → MockVisualProvider (dev/test)
AUTOMATION_MODE=production → ManualFallbackProvider → WAITING_ASSETS
```

## Library

Tabela `media_library_assets`: sha256, source, provider, usage_count, quality_status, tags.

Fluxo externo: SEARCH → DOWNLOAD → VALIDATE → HASH → STORE → CATALOG → REUSE.

## Manual

`MANUAL_ASSET_REQUEST` em `production_runs.result.manualAssetRequests` e tabela `manual_asset_requests`.

UI: copiar busca, abrir Pexels/Pixabay, upload → catalog → resume VISUALS.

Estados de asset: DISCOVERING, DOWNLOADING, VALIDATING, READY, MISSING, AWAITING_USER, FAILED.
