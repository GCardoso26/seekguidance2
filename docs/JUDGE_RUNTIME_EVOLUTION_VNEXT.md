# Judge runtime evolution (vNext)

Este documento consolida a direção **incremental** da plataforma TCG Judge: **assistente de regras / judge assistant**, com raciocínio simbólico, runtime determinístico, replay, lineage temporal e pipelines **V1–V11** preservados. Não há objetivo de tornar o sistema uma «engine jurídica»; explicabilidade e revisão humana permanecem centrais.

## Arquitetura

- **API / app** (`services/api/app`): orquestração de reasoning, verificação formal bounded, runtime, observabilidade live.
- **Ingestão** (`services/ingestion/tcg_judge_ingestion`): corpus executável, arquivo real, erratas, políticas e edge cases de timing.
- **Infra** (`infra/`): métricas, tracing, operações, armazenamento de replay/semântica, DR.
- **Apps** (`apps/`): UX modular HTML/CSS/JS (stubs funcionais), sem monólito frontend.

Contratos `reasoning_v1`…`reasoning_v11` e pipelines homólogos **não** devem ser removidos em evoluções; novas capacidades entram como módulos paralelos e exports aditivos.

## Corpus evolution (real + temporal)

Pacotes de ingestão cobrem decisões históricas, políticas de publisher, grafo de errata, investigações, disputas multiplayer, reconstrução legacy, arquivo semântico de replay, deltas de política cross-version e repositórios de timing. Objetivos:

- **Lineage temporal real** e **supersedência** explícita nos metadados.
- **Snapshots replayáveis** referenciados por manifests (`judge_grade_datasets_v2`).
- **Índice de contradições** semânticas e **drift de legalidade** como sinais assistentes, não verdades absolutas.

## Formal legality (solver)

`formal_solver_v4` agrega SMT incremental, exaustão bounded, busca de prova de timing, ponto fixo de replacement, certificados multiplayer, SEGOC, combat chain, dependências ocultas, persistência de provas e UNSAT explicável v2. **Nunca** expor CNF/SAT bruto ao utilizador final: apenas `legality_reasoning`, `proof_steps`, `assistant_notes`, `replay_legality_summary`.

## Observabilidade

`live_runtime` estende tracing distribuído, métricas de pipelines semânticos, diagnósticos de replay, drift de ontologia, explosão de ramos, regressão de runtime, correlação de workers, hotspots, consistência de replay e métricas cross-TCG **comparativas** (não colapsadas).

Infra inclui fragmentos OTEL/Prometheus/Grafana para integração gradual.

## Explosion control

`explosion_control_v4` reforça previsão de entropia, forecast de explosão de replay, colapso de ontologia, convergência de ramos, limites de divergência semântica, compactação temporal, merge cross-version, caps multiplayer, freios de emergência e pruning distribuído — sempre com modos de degradação assistentes.

## Cross-TCG hardening

`hardening_v3` mantém **soft normalization**: runtimes específicos (ex.: SEGOC Yu-Gi-Oh!, combat FAB, efeitos adiados Pokémon, DON One Piece, experimental Riftbound) coexistem sem equivalência mecânica entre jogos.

## UX direction

Apps permanecem modulares (`judge_replay`, `stack_visualizer`, `judge_console`, `tournament_ops`, `judge_training`): timeline interativa, overlays de legalidade, exploradores de grafo causal, diff de replay, APNAP/replacement, fluxos de disputa — mobile-first onde aplicável.

## Production operations

`infra/runtime_operations`, `disaster_recovery_v2`, `worker_scaling`, `cache_runtime`, `replay_storage`, `semantic_storage` documentam maturidade operacional: DLQ, retenção, recuperação determinística, SLOs e políticas de degradação compatíveis com os contratos existentes.

## Continuous evaluation v6

`continuous_v6` foca tendências de legalidade, histórico de estabilidade de replay, timelines de drift, regressão cross-version, consistência cross-TCG **soft**, evolução de confiança do solver, análise de discordância humana, calibração judge-grade, divergência de replay e instabilidade semântica.

## Gaps honestos

- Corpus «massive real» ainda depende de ingestão curada e validação humana para produção.
- Provas formais permanecem **bounded**; cenários fora do orçamento reportam incerteza explicável.
- Dashboards Grafana live são fragmentos: exigem wiring a métricas reais do cluster.

## Próximos passos

1. Ligar manifests v2 a runners de avaliação contínua e histórico de ranking.
2. Persistir `proof_persistence` + lineage em armazenamento semântico.
3. Expandir HTML stubs para consumir payloads JSON dos endpoints existentes, sem monólito.
