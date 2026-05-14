# Reasoning Consistency Engine

## Objetivo

Transformar o pipeline de “retrieval + LLM” numa camada adicional **judge-grade** de:

- deteção de conflitos entre famílias de regras;
- ordenação lógica de interações (cadeia sem emulador de board);
- simulação simbólica (rótulos de estado e passos);
- validação de consistência e ambiguidade;
- timing inferido por jogo (`app/games/*/reasoning_rules.py`);
- grafo leve de dependências (`reasoning_graphs/graph_builder.py`).

## Pacotes

| Área | Caminho |
|------|---------|
| Conflitos | `app/reasoning/conflicts/` |
| Execução | `app/reasoning/execution/` |
| Simulação | `app/reasoning/simulation/` |
| Validação | `app/reasoning/validation/` |
| Grafo | `app/reasoning/reasoning_graphs/` |
| Fachada | `app/reasoning/engine.py` → `run_reasoning_engine` |

## API

`ChatRequest.include_reasoning_engine: bool` — quando `true`, a resposta inclui `reasoning_v3` (dict serializável, ver `ReasoningReportV3.to_api_dict`).

## Limites

- `Settings.reasoning_max_chain_depth` (default 12) e `reasoning_timeout_ms` (reservado para futuras chamadas async com deadline).
- Sem motor de jogo completo: apenas raciocínio sobre ordem, precedência e conflitos.

## Datasets e benchmark

- JSON em `services/api/datasets/**`.
- Runner offline: `app.evaluation.benchmark_runner.run_benchmark_on_disk()`.

## Testes

- Unitários: `tests/reasoning/`.
- E2E (API real): `tests/e2e/test_judge_questions.py` com `RUN_E2E=1`.

## Gaps / próximos passos

- Ligar métricas do benchmark a respostas LLM reais (golden answers).
- Timeout async real no `run_reasoning_engine`.
- Expandir `conflict_detector` com classificador treinado ou parser CR estruturado.
