# Growth Analytics

## Tabela

`tcg_judge.judge_growth_metrics` — campos `game`, `metric_type`, `metric_value`, `details`, `created_at`.

## Eventos

| Tipo | Descrição |
|------|-----------|
| `login` | Login Google |
| `share_created` | Link de veredito criado |
| `share_opened` | Link aberto |
| `session_restored` | Deep link de sessão |
| `related_question_clicked` | Chip de sugestão |
| `history_opened` | Foco na pesquisa do histórico |
| `judge_question_sent` | Pergunta enviada |

## API

- `POST /runtime/judge/growth/event` (202, best-effort)
- `GET /runtime/judge/growth?days=30` — DAU/WAU/MAU, CTR, shares, top jogos

## Dashboard

Aba **Growth** em `/observability`.
