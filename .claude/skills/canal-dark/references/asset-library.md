# Asset Library

Motor: `MediaAssetRepository` + tabela `media_library_assets` (catálogo reutilizável).  
`media_assets` permanece o registry **por production**. `AssetStorage` é I/O de ficheiros — não confundir com a library.

Canónico: `ai-content-machine/docs/MEDIA_ASSETS.md`, `VISUAL_PROVIDERS.md`.

## HIT / MISS

```
Library HIT (GENERATED/STOCK/UPLOADED + quality APPROVED)
  → reuse, incrementa usage_count
Library MISS
  → ComfyUI (premium, só no MISS)
Comfy success
  → Visual QA → catalog → reuse futuro
Comfy timeout/error/disabled
  → Mock controlado → MP4 possível → READY_FOR_REVIEW
```

HIT re-executa Visual QA. Mock catalogado = `REJECTED` / não publicável.

## Provenance

`source`: generated | stock | uploaded | mock  
`quality_status`: PENDING | APPROVED | REJECTED  
`quality_score` na metadata.

Nunca tratar mock como publicável só porque houve HIT de um mock.
