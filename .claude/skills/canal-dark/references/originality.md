# Originality

`OriginalityService` + `POST /api/editorial/originality`.

Também entra no `ScriptQaService` (sem segunda camada LLM): `originalityScore`, `repetitionScore` no breakdown.

## Detectar

hooks iguais; títulos similares; scripts repetitivos; thumbnails semelhantes; CTAs repetidos; mesma estrutura; narração repetida; assets repetidos (via library `usage_count` — sinal, não bloqueio automático sozinho).

Histórico: `contents.title`, `scripts.hook`, winning hooks do workspace.

## Limiares

- `ORIGINALITY_MIN` = 45
- `REPETITION_MAX` = 55

Acima do risco → `REVIEW_REQUIRED`. Não auto-publicar.
