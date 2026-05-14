# Judge Workstation UX

## Visão

Transformar MVPs estáticos num **posto de trabalho de juiz** (replay rico, explainability, fluxo de disputa, mobile).

## Apps

| App | Caminho | Estado |
|-----|---------|--------|
| Replay visual | `apps/judge_replay/replay.html` | Timeline + scrubber + stack/chain placeholders. |
| Explainability | `apps/explainability/` | Shell multi-painel. |
| Explainability console | `apps/explainability_console/` | Exploradores de grafo/prova/drift. |
| Judge workbench | `apps/judge_workbench/` | Investigação, disputa, torneio. |
| Mobile judge | `apps/mobile_judge/` | UI compacta; complementa `apps/mobile` Expo. |

## Integração API

- Consumir `/v1/chat/ask` com `explain_retrieval` e `include_reasoning_engine`.
- Quando `REASONING_FORMAL_EXPLAINABILITY_ENABLED=true`, mostrar painéis adicionais a partir das chaves opcionais em `reasoning_v8+`.

## Contratos

- Nenhuma alteração obrigatória aos clientes: UIs são **opt-in** e estáticas até ligação JS.

## Gaps

- Falta ligação WebSocket para replay live multi-jogador.
- Sem auth RBAC na UI (depende da API / gateway).

## Riscos operacionais

- PII em notas de investigação: armazenar fora do repo ou cifrar.

## Próximos passos

1. SDK TypeScript partilhado para modelos `ChatResponse`.
2. Visualização de `retrieval_reasons` e graph expansion no console.
