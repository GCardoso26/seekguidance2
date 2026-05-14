# Judge assistant — production intelligence

## Produto

O **TCG Judge** permanece um **assistente de regras / gameplay** para juízes e jogadores: linguagem acessível, explainability, orientação prática. **Não** é sistema jurídico, penalidades automáticas nem árbitro de torneio substituto.

## Corpus real (`real_corpus/`)

- Rulings históricos, torneios, errata, fóruns (baixa confiança), edge cases, bibliotecas de replay/multiplayer.
- **Objetivo:** alimentar regressões e benchmarks com casos reais, mantendo proveniência e confiança explícitas.

**Gap:** PDFs e fóruns completos exigem pipelines de ingestão e licenças; stubs marcam contratos.

## Formal solver V2 (`formal_solver_v2/`)

- Ponte SMT opcional (Z3), encodings resumidos, solvers de precedência/dependência/paradoxo/replacement/multiplayer.
- Saídas incluem `assistant_note` / passos de mesa — **sem** expor SAT/CNF ao utilizador final.

**Gap:** validação exaustiva depende de IR rico por TCG; Z3 é opcional.

## Observabilidade

- Exportadores OTEL/replay/pipeline, diagnósticos de grafo, alertas de explosão de ramos, `replay_diagnostics_bundle`.
- Infra: `grafana_live_dashboards/`, `prometheus_alert_rules/`, `otel_runtime_config/`, `replay_diagnostics/`, `semantic_drift_dashboards/`.

**Gap:** métricas Prometheus reais ainda a alinhar com nomes dos exemplos.

## Explosion control V3 (em `explosion_control_v2/`)

- Entropia de replay, predição de divergência, colapso de grafo, compactação temporal de ramos, convergência, limites de ontologia — **complementam** V1 caps, não os substituem.

## Cross-TCG hardening (`games/hardening/`)

- Stress Yu-Gi-Oh / FAB / MTG multiplayer / timing / dependências ocultas + deteção de leak de normalização.

## Continuous evaluation V3 (`evaluation/continuous/`)

- Estabilidade de legalidade, divergência de replay, regressão cross-TCG, drift de ontologia V2, explosão de ramos, consistência semântica.

## Benchmarks

- `evaluation/runtime_eval/judge_grade_benchmarks/` — catálogo + pastas vazias para datasets curados.

## Judge UX

- HTML incrementais em `apps/judge_replay/`, `apps/stack_visualizer/`, `apps/judge_console/` — arquitetura leve, sem SPA gigante.

## Próximos passos honestos

1. Ligar exporters a um collector OTLP real.
2. Preencher benchmarks com casos curados (multiplayer + replacement).
3. Feature-gate formal pesado por TCG e por ambiente.
