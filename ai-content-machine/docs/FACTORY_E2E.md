# Factory E2E local

Valida a tese: **ideia → MP4** sem GPU e sem APIs pagas (degradação para Mock).

## Fluxo

```
IDEA → FallbackScript → SCRIPT → FallbackVoice → WAV
    → Library-first VISUALS (MISS: ComfyUI → Mock) → Composition (Ken Burns) → final.mp4 → QA
```

## Casos

| # | Cenário | Expectativa |
|---|---------|-------------|
| 1 | Primeira produção | Library MISS → catalog → MP4 real |
| 2 | Regenerate/remix | Library HIT → `usage_count++` → novo MP4 |
| 3 | Ollama+Kokoro+Comfy+Library OFF | Mock → produção ainda `COMPLETED` |

## Métricas (`factoryMetrics`)

`totalMs`, `scriptMs`, `voiceMs`, `visualsMs`, `composeMs`, `mp4Bytes`, `assetsReused`, `assetsNew`, `scriptProvider`, `voiceProvider`, `visualProvider`, `composeProvider`, `fallbackCount`.

Servem para estimar vídeos/dia sustentáveis na VPS A1.

## ComfyUI

Upgrade **opcional** de qualidade no MISS (`docs/VISUAL_PROVIDERS.md`). Sem `COMFY_BASE_URL` a fábrica continua. Sem Wan/LTX.
