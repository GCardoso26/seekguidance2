# Voice providers

## Contrato

`VoiceProvider` — `ProductionService` não escolhe o motor; fala só com o resolver.

## Cadeia (fallback)

```
KokoroVoiceProvider   (KOKORO_BASE_URL → OpenAI-compatible /v1/audio/speech)
        ↓ falha / NOT_CONFIGURED
RealVoiceProvider     (VOICE_API_KEY / ELEVENLABS_API_KEY — stub runtime)
        ↓ falha / NOT_CONFIGURED
MockVoiceProvider     (ffmpeg tone — sempre READY em mock)
```

Implementação: `FallbackVoiceProvider`.

## Env (Kokoro)

| Var | Default | Uso |
|-----|---------|-----|
| `KOKORO_BASE_URL` | — | Ex.: `http://127.0.0.1:8880` |
| `KOKORO_VOICE` | `af_bella` | Voice id |
| `KOKORO_MODEL` | `kokoro` | Model id |
| `KOKORO_API_KEY` | — | Bearer opcional |

Sem `KOKORO_BASE_URL`, Kokoro fica `NOT_CONFIGURED` e a fábrica continua no Mock (ou API se configurada).

## Observabilidade

Stage `VOICE` e metadata do asset incluem `provider` + `fallbackTrail`.
