# Visual direction

Prioridade de produto: qualidade visual. A Skill é o diretor; o CWM gera.

Documentação canónica do motor (não duplicar):

- `ai-content-machine/docs/VISUAL_DIRECTION.md`
- `ai-content-machine/docs/VISUAL_QUALITY.md`
- `ai-content-machine/docs/VISUAL_PROVIDERS.md`
- `api/src/production/visual/VisualDirector.ts`

## Ordem

```
SCRIPT → VISUAL DIRECTOR → VISUAL BIBLE → VISUAL PLAN → ASSET LIBRARY
  → ComfyUI se MISS → VISUAL QA → COMPOSITION
```

Nunca: prompt aleatório por cena.

## Schema

Não forçar o JSON `scene_id/S01` da spec genérica. O contrato canónico é `VisualPlan` / `VisualScenePlan`:

`scene`, `role`, `durationSec`, `subject`, `action`, `environment`, `camera`, `lighting`, `mood`, `prompt`, `negativePrompt` + `profileId` / character bible.

A Skill preenche **intent** no briefing; `buildVisualPlan` materializa.

## Visual Bible / Character / continuity

- Style ID = `VisualProfile.id` (registry JSON no CWM).
- Character lock = `VisualCharacterBible` (mesmo protagonista em todas as cenas).
- Location / props: repetir `environment` e objetos nomeados no subject; não improvisar sets.
- Camera, lighting, composition, palette: vêm do profile, não do humor do gerador.
- Negative prompts: profile + anti-deep-web.

## Anti-deep-web (proibido por defeito)

horror não solicitado; gore; olhos/mãos deformados; anatomia impossível; iluminação excessivamente escura; glitch; VHS; cyberpunk sem motivo; surrealismo aleatório; texto ilegível; watermark; stock genérico se houver alternativa; estética “AI slop”; estética “deep web”.

O estilo vem do Visual Bible / Style ID.
