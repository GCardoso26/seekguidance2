# Composition

Reutilizar `CompositionProvider` + `VideoComposer`. Não criar segundo compositor.

Canónico: `ai-content-machine/docs/COMPOSITION_KENBURNS.md`.

Responsável por: Ken Burns, narração, composição, MP4.

**ComfyUI não entra no compositor.** `ProductionService` também não importa `ComfyUIProvider` — só `createVisualResolver()`.

Sem FFmpeg: `ffmpeg: NOT_CONFIGURED` — dry-run e factory status reportam; não fingir MP4.

Retomada: se COMPOSING falhou e VOICE/VISUALS estão ok, retry só de COMPOSING em diante.
