# Automation Center — fluxo YouTube Short (fábrica real)

Path publicável mínimo na UI `/app/automation`:

```
Nova idea → Script Factory (YOUTUBE_SHORT / Ollama)
  → Approve Script
  → Production (Kokoro + Library + ComfyUI no MISS + ffmpeg_kenburns)
  → READY_FOR_PUBLISH   ← só se visuais GENERATED (Comfy ou library HIT)
  → Usar último READY_FOR_PUBLISH
  → Dry-run → Approve for publish
  → (opcional) Abrir janela → Publish REAL + restore
```

`mock_visual` completa o MP4 mas o pacote fica `READY_FOR_REVIEW`. O botão **Usar último READY_FOR_PUBLISH** ignora esses runs. Sem ComfyUI (A1 ou ponte PC) **não há publish YouTube**.

## Pré-requisitos na VM

- `OLLAMA_BASE_URL` e `KOKORO_BASE_URL` no `.env` da API
- `COMFY_BASE_URL` apontando à A1 (`http://comfy:8188`) **ou** à ponte GPU (`http://host.docker.internal:8188`) — ver `docs/COMFYUI_A1_VS_PC.md`
- Workspace seleccionado (ex. `86e1e2c0-…`)
- Rebuild após pull: `docker compose up -d --build` (e `--profile comfy` se gerar na A1)

## Ordem na UI

1. Confirmar strip **Factory status** (Ollama / Kokoro / **ComfyUI** / ffmpeg). Comfy `NOT_CONFIGURED` ou `ERROR` ⇒ Shorts novos não são publicáveis.
2. **Nova idea rápida** ou escolher idea no dropdown
3. **Run Script Factory (YOUTUBE_SHORT)** — Last response: `provider: ollama` (ou mock + trail)
4. Seleccionar o script gerado → **Approve Script**
5. **Run Production (YOUTUBE_SHORT)** — se `idempotent_skip`, marcar **Regenerate** e repetir
6. **Detalhe** do run: VOICE=`kokoro`, VISUALS=`comfyui` (ou `mock_visual` = hold), Library hits/misses, COMPOSING=`ffmpeg_kenburns`, `factoryMetrics`
7. Pacote `READY_FOR_PUBLISH` / content `qa` — se `READY_FOR_REVIEW` por `visuals_mock_not_publishable`, ligar Comfy e regenerar
8. Gate 5.1: dry-run → approve-for-publish → (só se quiser REAL) open-window → Publish REAL + restore

## O que NÃO usar para a fábrica real

| Botão | Motivo |
|-------|--------|
| Run Daily Engine (MOCK) | Pipeline sintético — não chama Ollama/Kokoro/Ken Burns |
| Feedback Loop (MOCK) | Analytics/winner mock — não é upload YouTube |

## Safety (defaults)

`DRY_RUN=true`, `PUBLISHING_ENABLED=false`, kill switch on → Preflight **SAFE**, Ready to publish **NO**.  
Isso é correcto até o operador abrir a janela de propósito.

## API equivalente

```bash
# idea
curl -sS -X POST localhost:8787/api/ideas -H 'content-type: application/json' \
  -d '{"workspaceId":"…","title":"…"}'

# script
curl -sS -X POST localhost:8787/api/scripts/generate -H 'content-type: application/json' \
  -d '{"workspaceId":"…","contentIdeaId":"…","platform":"YOUTUBE_SHORT","await":true}'

# approve
curl -sS -X POST localhost:8787/api/scripts/<scriptId>/approve -H 'content-type: application/json' \
  -d '{"workspaceId":"…"}'

# production
curl -sS -X POST localhost:8787/api/production/run -H 'content-type: application/json' \
  -d '{"workspaceId":"…","scriptId":"…","platform":"YOUTUBE_SHORT","await":true}'
```
