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

ComfyUI indisponível **não** quebra o MISS: fallback visual existente → compose → MP4 → `READY_FOR_REVIEW`.

## WorkflowRegistry

Troca de grafo sem mudar o CWM:

| `COMFY_WORKFLOW` | Ficheiro |
|------------------|----------|
| `image_default` | `visual/workflows/image_default.json` |
| `image_cinematic` | `visual/workflows/image_cinematic.json` |
| `image_a1_cpu` | `visual/workflows/image_a1_cpu.json` (4 steps, A1 CPU) |

Placeholders: `{{prompt}}`, `{{negative_prompt}}`, `{{width}}`, `{{height}}`, `{{seed}}`, `{{filename_prefix}}`, `{{checkpoint}}`, `{{steps}}`, `{{cfg}}`.

Image generation only — sem Wan/LTX/vídeo neste PR.

## Env

| Var | Default | Uso |
|-----|---------|-----|
| `COMFY_BASE_URL` | — | `http://comfy:8188` (A1) ou `http://host.docker.internal:8188` (host/PC) |
| `COMFY_WORKFLOW` | `image_a1_cpu` no compose | Nome no registry |
| `COMFY_TIMEOUT_MS` | `900000` | Deadline do job (A1 CPU precisa de minutos) |
| `COMFY_HTTP_TIMEOUT_MS` | `30000` | Abort por request (health/poll) |
| `COMFY_HEALTH_TIMEOUT_MS` | `5000` | Ping `/system_stats` |
| `COMFY_POLL_MS` | `3000` | Intervalo `/history` |
| `COMFY_CHECKPOINT` | `v1-5-pruned-emaonly.safetensors` | Override no grafo |
| `COMFY_NEGATIVE_PROMPT` | blurry/watermark… | Override |
| `COMFY_WIDTH` / `COMFY_HEIGHT` | plan (720×1280) | Downscale A1, ex. 512×768 |
| `COMFY_STEPS` / `COMFY_CFG` | 4 / 2.5 em `image_a1_cpu` | Sampler |

Sem `COMFY_BASE_URL`, ComfyUI fica `NOT_CONFIGURED` e a fábrica continua no Mock.

`GET /api/factory/status` faz **ping real**. URL setada mas Comfy morto → `ERROR`. Generate falha em ~5 s e cai no Mock.

PNG inválido / 1×1 / magic errado → `INVALID` → Mock.

## Gate de publish

`PublishingQualityGate`: qualquer IMAGE `mock_visual` / source `MOCK` **não** recebe `READY_FOR_PUBLISH`.
Library HIT de um frame `GENERATED` (Comfy) **sim**. Ver `docs/COMFYUI_A1_VS_PC.md`.

## factoryMetrics

`visualProvider` + `fallbackCount` incluem o trail visual (NOT_CONFIGURED/ERROR/TIMEOUT/INVALID antes do READY).

Comparar SEM GPU vs ComfyUI: tempo/vídeo, bytes, assets novos vs reused, falhas, fallbacks.
