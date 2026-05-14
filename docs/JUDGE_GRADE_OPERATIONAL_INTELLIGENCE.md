# Judge-grade operational intelligence

## Posicionamento

Plataforma **assistente de regras judge-grade**: explainability, determinismo onde aplicável, multi-TCG com **soft normalization** (sem equivalência mecânica forçada). Não é deck builder, nem sistema jurídico.

## Corpus

- `corpus_lineage/`, `ingestion_runtime/`, `ingestion_maturity/`, arquivos históricos (`historical_versions/`, `policy_archives/`, …).
- **Gap:** PDFs e fóruns completos dependem de crawling licenciado e armazenamento.

## Formal V3

- `formal_solver_v3/`: Z3 opcional, certificados de timing, provas com `legality_reasoning` e `proof_steps` para UI.
- **Gap:** IR por TCG para exaustão real ainda em expansão.

## Observabilidade produção

- `production_runtime/`: OTEL meta, Prometheus opcional, diagnósticos combinados, profiling snapshot.
- **Gap:** registar counters/histograms com nomes alinhados ao Prometheus em deploy.

## Explosion V3

- `explosion_control_v3/`: caps de emergência, compactação replay, pruning runtime.
- Coexiste com V1/V2 sem remover pipelines.

## Hardening V2

- Pressões por TCG (YGO, FAB, MTG MP, One Piece, Digimon, Lorcana, Riftbound).

## Continuous V4

- Métricas agregadas judge-grade + calibração humana (hook).

## UX

- `apps/tournament_ops/`, `apps/judge_training/`, novos stubs HTML.

## Próximos passos

1. Ligar Prometheus client em processo API/worker.
2. Curar datasets em `judge_grade_benchmarks/datasets/`.
3. Feature-gates por TCG para formal exaustivo.
