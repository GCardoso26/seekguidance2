# Skill canal-dark

Orquestração editorial faceless/dark **sobre** o Content War Machine (CWM) em `ai-content-machine/`.

Não é uma segunda fábrica de conteúdo.

## Descoberta

| Cliente | Caminho |
|---|---|
| Claude Code | `.claude/skills/canal-dark/` (canónico) |
| Cursor | `.cursor/skills/canal-dark` → symlink para o mesmo sítio |

## Uso rápido

```bash
# Do repositório
node .claude/skills/canal-dark/scripts/inspect-cwm.mjs
node .claude/skills/canal-dark/scripts/validate-content.mjs \
  .claude/skills/canal-dark/examples/example-channel
node .claude/skills/canal-dark/scripts/inspect-media.mjs --help
node .claude/skills/canal-dark/scripts/package-content.mjs --help
```

PowerShell (Windows / pwsh): os `.ps1` da pasta `scripts/` chamam os `.mjs`.

API editorial (CWM, sem pipeline paralelo):

- `POST /api/editorial/ideas/score`
- `POST /api/editorial/titles/score`
- `POST /api/editorial/originality`
- `POST /api/editorial/rights`
- `POST /api/editorial/thumbnail/score`
- `POST /api/editorial/shorts/adapt`
- `POST /api/editorial/dry-run`
- `POST /api/editorial/package`

Execução técnica continua em `/api/research/run`, `/api/ideas`, `/api/scripts/generate`, `/api/production/run`, `/api/factory/status`.

## Mock

Com `AUTOMATION_MODE=mock` a cadeia CWM usa mocks reais (script/voz/visual). Um MP4 mock **não** autoriza publicação. Ver `PublishingQualityGate`.

## Limitações

- Long-form 8–15 min: o CWM de produção está calibrado para Short (`YOUTUBE_SHORT` ~40s). A Skill adapta o briefing; a execução usa o `ProductionService` existente.
- YouTube OAuth, ComfyUI, Kokoro, Ollama: `NOT_CONFIGURED` quando ausentes.
- Monetização nunca é afirmada.

- `ai-content-machine/docs/CWM_ARCHITECTURE.md`
- `ai-content-machine/docs/ASSET_PIPELINE.md`
- `ai-content-machine/docs/SHORTS_PIPELINE.md`
- `ai-content-machine/docs/UI_SETUP.md`

Studio: `/studio` (Criar Short). Automation Center permanece avançado.
