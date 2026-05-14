# Distributed Judge Runtime V11

Este documento descreve a camada **V11 — Distributed Semantic Runtime + Judge Operations Platform**: infraestrutura de **assistência a juiz**, **reasoning competitivo de TCG** e **consistência operacional**, sem transformar o produto num motor jurídico ou ERP.

## Objetivos

- **Estado semântico versionado** com cadeia determinística (`state_hash`, `parent_state_hash`, `transition_hash`, `semantic_checksum`).
- **Sessões de juiz** com contexto de mesa, stack simbólica e guidance procedural.
- **Timeline** para reconstrução de eventos (“o que aconteceu antes do estado ilegal?”).
- **Multiplayer formal** com **APNAP** explícito e resolução determinística de ações simultâneas.
- **Operações de torneio** (checklists, decklist heurística, encaminhamento de policy) como *guidance*, não decisão legal.
- **Persistência** via fachadas (`persistence/`) prontas para Postgres / arquivo.
- **Replay distribuído** (sharding, validação, consenso simples, execução histórica).
- **Observabilidade** leve (métricas em dict, traços estruturados; hooks para OpenTelemetry / Prometheus).

## Arquitetura

| Pacote | Função |
|--------|--------|
| `app/distributed_state/` | Store particionado, snapshots, replicação lógica, hashing determinístico. |
| `app/judge_sessions/` | Orquestração de sessão, stack, prioridade, disputas (guidance). |
| `app/timeline/` | Eventos e reconstrução ordenada. |
| `app/multiplayer/` | Modelo APNAP, turn structure, consistência. |
| `app/tournament_ops/` | Operações de ronda, decklist, floor tools, investigação procedural. |
| `app/persistence/` | Fachadas: semantic store, grafo, arquivo de replay, histórico, ontologia. |
| `app/replay_distributed/` | Sharding, validador, cross-version, consenso, executor. |
| `app/observability/` | Métricas e traços (embeddable em OTEL/Prometheus). |
| `app/evaluation/runtime_lab/` | Smoke / stress / labs de consistência. |
| `app/reasoning/distributed_runtime_v11_pipeline.py` | Orquestração do relatório V11. |

O pipeline **não substitui** V7–V10: `run_reasoning_engine` continua a executar retrieval, symbolic engine, trust, V9 e V10; **depois** invoca `run_distributed_runtime_v11`.

## API

- `ReasoningReportV3.distributed_judge_runtime_v11`
- Resposta HTTP: `reasoning_v11` em `ChatResponse` (espelha `DistributedJudgeRuntimeV11.to_api_dict()`).

Chaves principais:

- `distributed_state` — partição, verificação de cadeia, último snapshot, alvos de replicação.
- `judge_session` — sessão estável por hash da pergunta, contexto de match, stack, guidance de disputa.
- `timeline_analysis` — eventos reconstruídos.
- `multiplayer_resolution` — sequência APNAP, ações simultâneas resolvidas, estrutura de turno.
- `tournament_operations` — sugestões operacionais (relógio de ronda, decklist, checklist).
- `persistent_memory` — IDs de snapshot de grafo, cauda de arquivo, cabeça histórica, ontologia.
- `distributed_replay` — shard determinístico, validação de replay, consenso de hashes.
- `runtime_observability` — counters, latência estimada, determinismo, confiança agregada.

## Modelo de persistência

Hoje o **default** permanece **in-process** (`SemanticStateStore` + fachada `SemanticPostgresStore`). A separação em `persistence/` permite trocar o backend por **Postgres** / fila / object storage **sem alterar** o contrato do pipeline V11.

## Replay distribuído

- **Determinismo**: hashes estáveis (JSON ordenado + SHA-256).
- **Validação**: `distributed_replay_validator` verifica encadeamento parent/state.
- **Consenso**: `replay_consensus` usa o mesmo critério de quorum que `consistency_protocol.quorum_consistent`.
- **Cross-version**: `map_event_cross_version` etiqueta eventos para migração de motor.

## Timeline engine

Eventos são anexados de forma monótona; `timeline_reconstruction` ordena por `seq` explícito (base para extensões com timestamps absolutos).

## Multiplayer runtime

- `apnap_runtime.apnap_sequence` — jogador ativo primeiro, restantes por ordem estável.
- `simultaneous_action_resolution` — ordenação determinística por `player`.

## Telemetria

`runtime_observability` agrega:

- snapshots de counters;
- span sintético (`reasoning_tracing.trace_reasoning_span`);
- latência e métricas de grafo;
- score de determinismo e confiança de juiz derivada do motor principal.

Integração **OpenTelemetry** / **Prometheus** pode mapear estes dicts para exporters sem acoplar o core ao vendor.

## Benchmarks e datasets

- `app/evaluation/runtime_lab/` — runners de smoke / stress / regressão (stubs onde não há LLM).
- `evaluation/canonical_suite/*` — stubs `canonical_distributed_v11` por grupo (multiplayer, APNAP, investigação, etc.).

## Testes

- `tests/distributed_runtime/test_distributed_v11.py` — consistência, replay, timeline, APNAP, persistência, replicação, consenso, pipeline.
- E2E: cinco perguntas V11 em `tests/e2e/test_judge_questions.py` (requer `RUN_E2E=1`).

## Gaps e próximos passos

1. **Postgres real** para `SemanticPostgresStore` (asyncpg + migrações de partições).
2. **Redis / NATS** para replicação e fan-out de eventos de mesa.
3. **Relógio híbrido** na timeline (Lamport / HLC) para cross-device.
4. **Políticas de torneio** ligadas a conteúdos indexados (MTR/IPG) com citações.
5. **Instrumentação OTEL** nativa (spans aninhados por transição semântica).
6. **Casos canónicos** preenchidos (hoje stubs JSON).

## Princípios mantidos

- Assistência a **jogadores e juízes** em TCG competitivo.
- **Não** é sistema jurídico, **não** centraliza lógica no FastAPI: módulos isolados e importáveis.
