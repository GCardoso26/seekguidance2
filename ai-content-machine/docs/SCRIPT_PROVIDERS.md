# Script providers

## Contrato

`ScriptProvider` — `ScriptFactoryService` não escolhe o motor; fala só com o resolver.

## Cadeia (fallback)

```
OllamaScriptProvider      (OLLAMA_BASE_URL → /v1/chat/completions)
        ↓ falha / NOT_CONFIGURED / INVALID / TIMEOUT
ApiScriptProvider         (OPENAI_API_KEY / SCRIPT_LLM_* → OpenAI-compatible)
        ↓ falha / NOT_CONFIGURED
MockScriptProvider        (templates locais — sempre READY)
```

Implementação: `FallbackScriptProvider`.

## Validação (HTTP 200 ≠ válido)

1. parse JSON (inclui fence markdown)
2. schema Zod: `hooks[]` + `script{hook,setup,problem,insight,value,proof,cta}`
3. inválido → `INVALID` no trail → próximo provider

## Env

| Var | Uso |
|-----|-----|
| `OLLAMA_BASE_URL` | Ex.: `http://127.0.0.1:11434` |
| `OLLAMA_MODEL` | Default `llama3.2` |
| `OLLAMA_TIMEOUT_MS` | Default `60000` (script pede JSON mode + até 4096 tokens) |
| `OPENAI_API_KEY` / `SCRIPT_LLM_API_KEY` | Habilita API |
| `OPENAI_BASE_URL` / `SCRIPT_LLM_BASE_URL` | Default `https://api.openai.com` |
| `OPENAI_MODEL` / `SCRIPT_LLM_MODEL` | Default `gpt-4o-mini` |

## Observabilidade

Trail: `provider`, `model`, `status`, `durationMs`, `error?` — em `script_runs.result` e eventos.
