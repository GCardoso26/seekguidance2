# Provider fallbacks

## Visual

| Erro | Estratégia |
|---|---|
| Pexels RATE_LIMIT / NOT_FOUND / TIMEOUT | Pixabay |
| Pexels AUTH_ERROR | marca unhealthy, Pixabay, avisa config |
| Pixabay falha | Comfy se configurado, senão Manual (prod) ou Mock (dev) |
| Comfy disabled/timeout | próximo da cadeia; **não é erro de saúde** |
| Manual | WAITING_ASSETS — nunca color-bars em production |

## Voz

Kokoro → API TTS (stub até runtime real) → Mock **apenas** `AUTOMATION_MODE=mock`.

## Script

Gemini → Groq → Ollama → OpenAI-compatible → Mock (`AUTOMATION_MODE=mock`).

## Publish

`PublishingQualityGate` recusa `mock_visual`. UNKNOWN rights bloqueiam auto-publish.
