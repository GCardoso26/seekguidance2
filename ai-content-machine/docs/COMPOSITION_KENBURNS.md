# Composition / Ken Burns

## Separação

```
VisualProvider  → Asset[] (imagens)
CompositionProvider → FFmpeg + Ken Burns → final.mp4
```

Ken Burns **não** vive no VisualProvider nem na Asset Library.

## Provider

`FfmpegCompositionProvider` (`ffmpeg_kenburns`)

Entrada: `narration.wav` + imagens (+ SRT opcional, música opcional)  
Saída: `final.mp4` (H.264 + AAC)

## Motions (determinísticos)

Ciclo por índice de cena:

`zoom_in` → `zoom_out` → `pan_lr` → `pan_rl` → `pan_vertical` → …

## Fora de escopo

ComfyUI · vídeo IA · embeddings · transições cinematográficas complexas

## Facade

`VideoComposer.compose(...)` permanece a API usada pelo `ProductionService` (sem reescrever o pipeline).
