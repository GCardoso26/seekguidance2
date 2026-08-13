# Visual providers

## Contrato

`VisualProvider.generate(request) → Asset`

`ProductionService` não escolhe o motor; no MISS fala só com o resolver.

## Cadeia

```
Asset Library (HIT → reuse + usage_count++)
        ↓ MISS
ComfyUIProvider         (COMFY_BASE_URL → /prompt → /history → /view)
        ↓ falha / NOT_CONFIGURED / TIMEOUT / INVALID
MockVisualProvider      (ffmpeg color — sempre READY)
        ↓
catalog (SHA-256) → CompositionProvider → MP4
```

ComfyUI **não** entra no CompositionProvider e **não** é importado pelo `ProductionService`.

ComfyUI indisponível **não** quebra o MISS: fallback visual existente → compose → MP4.

## WorkflowRegistry

Troca de grafo sem mudar o CWM:

| `COMFY_WORKFLOW` | Ficheiro |
|------------------|----------|
| `image_default` | `visual/workflows/image_default.json` |
| `image_cinematic` | `visual/workflows/image_cinematic.json` |

Placeholders: `{{prompt}}`, `{{negative_prompt}}`, `{{width}}`, `{{height}}`, `{{seed}}`, `{{filename_prefix}}`, `{{checkpoint}}`.

Image generation only — sem Wan/LTX/vídeo neste PR.

## Env

| Var | Default | Uso |
|-----|---------|-----|
| `COMFY_BASE_URL` | — | Ex.: `http://host.docker.internal:8188` |
| `COMFY_WORKFLOW` | `image_default` | Nome no registry |
| `COMFY_TIMEOUT_MS` | `120000` | Submit + poll |
| `COMFY_POLL_MS` | `1500` | Intervalo `/history` |
| `COMFY_CHECKPOINT` | `v1-5-pruned-emaonly.safetensors` | Override no grafo |
| `COMFY_NEGATIVE_PROMPT` | blurry/watermark… | Override |

Sem `COMFY_BASE_URL`, ComfyUI fica `NOT_CONFIGURED` e a fábrica continua no Mock.

## factoryMetrics

`visualProvider` + `fallbackCount` incluem o trail visual (NOT_CONFIGURED/ERROR/TIMEOUT/INVALID antes do READY).

Comparar SEM GPU vs ComfyUI: tempo/vídeo, bytes, assets novos vs reused, falhas, fallbacks.
