# Voice

Reutilizar `FallbackVoiceProvider`. Não implementar outro TTS. Não editar Kokoro só para a Skill.

Cadeia actual (ver `ai-content-machine/docs/VOICE.md`):

```
KokoroVoiceProvider  (KOKORO_BASE_URL)
  → RealVoiceProvider (VOICE_API_KEY / ElevenLabs — stub)
  → MockVoiceProvider (ffmpeg tone)
```

A Skill **regista o provider efetivo** (`stages.VOICE.provider` + `fallbackTrail` + `factoryMetrics.voiceProvider`).

Sem `KOKORO_BASE_URL` → `NOT_CONFIGURED` → mock se a fábrica estiver em modo mock.

Idempotência: não regenerar VOICE se `stages.VOICE.ok`.
