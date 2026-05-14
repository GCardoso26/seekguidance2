# Plataforma operacional de runtime (VNext)

Este documento descreve a fase **operacional real** da judge intelligence platform: governança de replay,
solver explainability, runtime distribuído, observabilidade viva, avaliação contínua e datasets judge-grade.
Tudo permanece **explainability-first**, com **replay determinístico**, **lineage temporal** e **soft normalization**
(sem equivalência forte entre TCGs).

## Runtime governance

- `app/runtime/production_runtime/` integra orquestração, degradação, recuperação e novos stubs **v2**:
  cluster, snapshots distribuídos, backpressure v2, custo v2, health, recovery orchestration e enforcement de
  consistência. São pontos de extensão honestos até wiring com filas, object storage e control plane reais.
- `infra/runtime_operations/` contém playbooks e políticas de DLQ, retention e health checks (ver READMEs existentes).

## Replay governance

- `app/runtime/replay_governance_v2/` cobre validação distribuída, arquivo, alinhamento cross-runtime/version,
  integridade de snapshot, consistência, entropia, colapso de ramos, reconciliação temporal, multiplayer e storage.
- Objetivo: **replay lineage**, **equivalence merge** assistido e alertas de drift sem substituir o juiz humano.

## Solver runtime

- `app/verification/formal_solver_v6/` expõe payloads humanos (`legality_reasoning`, `proof_steps`, `assistant_notes`,
  `replay_legality_summary`, `solver_confidence`, certificados resumidos). **Nunca** CNF/SAT bruto ao utilizador.
- Foco YGO/MTG multiplayer/FAB combat chain/replacement/SEGOC/APNAP/hidden dependencies via stubs operacionais.

## Distributed runtime

- `distributed_runtime_v2`, workers, snapshots e replay persistente v2 preparam **operação distribuída real** com
  contratos estáveis para storage semântico e checkpoints.

## Operational confidence

- `app/evaluation/continuous_v8/` agrega tendências: drift cross-TCG, histórico de solver, consistência de replay,
  confiança de runtime, regressões e explosão de ramos. Serve para **SLOs internos** e triagem, não veredicto final.

## Observabilidade

- `app/observability/live_runtime/` inclui OTEL live v2, join de traces, tracing do solver, alinhamento replay/trace,
  pipeline semântico, entropia de ramos, custo/confiança observáveis, alertas de regressão e multiplayer.
- `infra/observability/` reúne snippets de collector Prometheus/OTEL, recording/alert rules e dashboards Grafana
  (ficheiros existentes + novos fragmentos em `infra/observability/vnext/` quando aplicável).

## Replay lineage

- Ingestão (`services/ingestion/tcg_judge_ingestion/`) mantém pacotes de governança de corpus executável com scores
  (`archive_confidence`, `replay_integrity_score`, `legality_confidence`, etc.) para investigação e auditoria.

## Continuous evaluation

- `continuous_v7` permanece; `continuous_v8` adiciona históricos e governança de regressão compatível com pipelines
  **V1–V11** e `reasoning_v1…reasoning_v11`.

## Hardening cross-TCG

- `app/games/hardening_v5/` acrescenta diagnósticos (leak de normalização, divergência de runtime, inconsistências)
  e runtimes avançados por TCG, sempre como **assistente** com notas humanas.

## UX operacional

- HTML modulares em `apps/` (`judge_replay`, `stack_visualizer`, `judge_console`, `tournament_ops`, `judge_training`)
  para visualização de legalidade, governança de replay, stack multiplayer/SEGOC/combat/hidden deps e consolas de
  runtime — **sem frontend monolítico**, mobile-first básico.

## Gaps honestos

- Stubs não executam corpus real nem clusters reais; falta wiring a brokers, object storage, OTEL collectors
  implantados e bases de lineage persistentes.
- SLOs e alertas precisam de valores alinhados a cada ambiente; os ficheiros em `infra/` são modelos.
- Certificados de legalidade são resumos assistentes, não substitutos de decisão de torneio.

## Próximos passos

1. Ligar `replay_governance_v2` a storage versionado e políticas de retention.
2. Publicar métricas reais da API/workers para Prometheus e spans OTEL com amostragem controlada.
3. Preencher `evaluation/judge_grade_datasets_v4/manifests/` com casos executáveis e `replay_refs` reais.
4. Endurecer testes de propriedade em determinismo e lineage após integração de I/O real.

## Smoke

- `services/api/tests/smoke/test_sprint_docs_and_schema.py` inclui este ficheiro na lista de documentação obrigatória.
