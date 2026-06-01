# Perguntas relacionadas

Após cada resposta, o backend gera 2–3 sugestões via heurística (`app/judge/related_questions.py`), usando `rule_path`, `rule_atom` e palavras-chave da pergunta.

## API

Campo opcional em `JudgeQueryResponse`:

```json
{ "related_questions": ["...", "..."] }
```

## Cache Redis

Incluídas no payload do cache semântico (TTL 24h alinhado ao cache Judge).

## Frontend

Componente `RelatedQuestions` — chips clicáveis que **preenchem** o input sem enviar automaticamente.

## Métricas

Evento `related_question_clicked` em `judge_growth_metrics`. Dashboard: CTR em `/observability` (secção Growth).
