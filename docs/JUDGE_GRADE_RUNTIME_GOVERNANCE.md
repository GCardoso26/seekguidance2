# Judge-grade runtime governance

Documento operacional para a plataforma **judge assistant**: CI judge-grade, datasets executáveis, governança de replay, verificação de legalidade, diagnósticos live, inteligência de regressão e maturidade de infra — tudo **incremental** e **explainability-first**, sem equivalência forte cross-TCG e sem remoção de `reasoning_v1`…`reasoning_v11`.

## CI evaluation architecture

- **`evaluation/judge_grade_datasets_v2/`** (Python + manifests JSON): `ci_runtime`, `benchmark_execution`, `dataset_registry`, regressão histórica, validação de replay, validação cross-TCG **soft**, validação formal assistente, análise temporal, calibração e tracking de confiança de runtime.
- **`tests/conftest.py`** adiciona `services/api/evaluation` ao `sys.path` para importar `judge_grade_datasets_v2` e `executable_datasets` em CI.

## Executable datasets

- **`evaluation/executable_datasets/`**: casos de legalidade, timing, multiplayer, replacement, APNAP, SEGOC, combat chain, drift de ontologia, divergência de replay e legalidade cross-version. Cada bundle suporta `replay_refs`, expectativas múltiplas e `assistant_notes`.

## Replay governance

- **`app/runtime/replay_stability/`**: lineage, integridade, validação de arquivo, consistência distribuída, alinhamento temporal, verificação de hash, histórico de compactação e governança de ramos.
- **`app/runtime/production_runtime/replay_governance_integration.py`**: ponte operacional entre produção e governança (stubs).

## Legality verification

- **`app/verification/formal_solver_v4/`** estendido: provas multiplayer bounded, limites de replacement, fixed-point de timing, legalidade cross-runtime, provas ancoradas em replay, alinhamento determinístico, UNSAT semântico, redução de prova e alinhamento solver↔replay. **Sem** SAT/CNF bruto.

## Runtime diagnostics

- **`app/observability/live_runtime/`** estendido: diagnósticos live de replay, monitorização de ramos e solver, alertas de hotspots, drift de ontologia live, alinhamento de traces, custo e entropia de replay.

## Regression intelligence

- **`app/evaluation/continuous_v6/`** estendido: histórico de regressão de runtime, drift cross-version, precisão do solver, regressões de consistência de replay, legalidade temporal, matriz cross-TCG soft, divergência semântica, instabilidade de ontologia e pontuação determinística.

## Replay lineage

Lineage e hashes referenciam manifests v2 (`lineage_metadata`, `replay_refs`). Supersedência temporal acompanha **cross-version legality verification**.

## Solver alignment

Funções dedicadas a comparar claims resumidos de solver vs replay e estados determinísticos, sempre com carga útil assistente.

## Cross-TCG hardening

- **`app/games/hardening_v3/`** estendido com runtimes adicionais (FAB reaction window, MTG APNAP explícito, Pokémon delayed resolution, estado DON One Piece, drift Digimon, progressão Lorcana, semântica desconhecida Riftbound) e diagnósticos de divergência em Yu-Gi-Oh!. **Soft normalization** obrigatória.

## Operational maturity

- **`infra/runtime_operations/`**, **`infra/disaster_recovery_v2/`**, **`infra/worker_scaling/`**: governança de runtime, saúde distribuída, DLQ persistente, arquivo de replay, snapshots semânticos, playbooks de recuperação, perfis de autoscaling e SLOs.

## Gaps honestos

- Runners CI ainda são stubs: falta wiring a workers reais e artefactos de corpus massivo.
- Matrizes cross-TCG não substituem validação por juiz humano.
- Painéis SLO são documentação + fragmentos; falta export Prometheus completo por ambiente.

## Próximos passos

1. Ligar `run_benchmark_manifest_stub` a jobs CI com relatórios versionados.
2. Persistir `replay_lineage_stub` + hashes em armazenamento de arquivo.
3. Alimentar `live_replay_anomaly_stub` com métricas reais do cluster.
