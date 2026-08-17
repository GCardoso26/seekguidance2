# CWM Architecture

Documento da arquitetura **realmente presente** neste repositório após a migração Shorts Engine.
Não descreve trabalho futuro como se estivesse pronto.

## CURRENT → TARGET

```
ANTES                                      DEPOIS (caminho normal)
n8n orquestra                              n8n orquestra (igual)
CWM business logic                         CWM business logic (igual)
Library HIT → ComfyUI → Mock               Library HIT → Pexels → Pixabay
                                           → ComfyUI opcional
                                           → Manual fallback (produção)
                                           → Mock só se AUTOMATION_MODE=mock
Ken Burns + FFmpeg                         Ken Burns + FFmpeg (igual)
PublishingQualityGate                      soberano (igual)
mock_visual → READY_FOR_REVIEW             mock_visual ainda não publica
                                           + em production não é fallback silencioso
```

## Separação

| Camada | Responsável |
|---|---|
| n8n | orquestração (HTTP + cron) |
| CWM | lógica de negócio |
| LLM | Gemini → Groq → Ollama → API → Mock(dev) |
| Kokoro | TTS local |
| Asset Library | cache + catálogo + provenance |
| Pexels / Pixabay | fonte visual stock |
| ComfyUI | **opcional**, fora do caminho crítico |
| FFmpeg | render Ken Burns |
| YouTube API | publish controlado |

## Pipeline Shorts

```
TOPIC → RESEARCH → IDEA → SCRIPT → SCENE PLAN
  → ASSET RESOLUTION → VOICE → SUBTITLES → COMPOSITION → QA → READY → PUBLISH
```

Estados novos relevantes: `WAITING_ASSETS` (humano precisa de um visual).

## O que NÃO mudou de propósito

- `ProductionService` não importa `ComfyUIProvider`
- `CompositionProvider` não conhece ComfyUI
- YouTube continua atrás de kill switch / dry-run / `approvedForPublishing`
- SQLite + Fastify + Vite; sem Redis/K8s novos
- Funil de vendas (`/`, `/oferta`, …) permanece; o studio vive em `/studio`

## Limitações conhecidas

- Subtítulos continuam gerados a partir do storyboard (não Whisper).
- Música/SFX só entram se existirem na library ou `CWM_MUSIC_PATH` / `CWM_SFX_PATH` (o compositor mistura quando o ficheiro existe).
- n8n: workflows 01–14/18 mantidos; Shorts usa API de domínio + workflow fino `16-cwm-create-short`.
- Gemini/Groq só ficam READY com API key.
