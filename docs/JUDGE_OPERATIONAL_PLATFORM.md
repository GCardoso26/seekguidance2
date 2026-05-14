# Judge operational platform

## Objetivo

Integrar **corpus executável**, **formal V4**, **runtime de produção**, **observabilidade live**, **explosion V4**, **hardening V3**, **continuous V5** e **UX** numa plataforma operacional de assistente — sem chatbot genérico, sem sistema jurídico, **sem** quebrar `reasoning_v1`…`v11` nem pipelines V1–V11.

## Componentes novos (sprint)

| Área | Local |
|------|--------|
| Corpus executável | `tcg_judge_ingestion/executable_corpus/`, `runtime_rulings/`, arquivos de resolução, `corpus_confidence_v2/`, `corpus_indexing/` |
| Formal legality runtime | `app/verification/formal_solver_v4/` |
| Runtime integrado | `app/runtime/production_runtime/` |
| Observabilidade live | `app/observability/live_runtime/` |
| Explosion V4 | `app/runtime/explosion_control_v4/` |
| Hardening V3 | `app/games/hardening_v3/` |
| Continuous V5 | `app/evaluation/continuous_v5/` |

## Gaps honestos

1. Dados curados em volume ainda externos ao repo (`judge_grade_benchmarks/datasets/`).
2. Z3/Prometheus/OTEL dependem de ambiente; stubs mantêm CI verde.
3. UX HTML são incrementais — integração com API de replay ainda por contratar.

## Próximos passos

- Ligar `executable_corpus` ao pipeline de ingestão existente.
- Expor endpoints read-only para `live_runtime` diagnostics em ambiente controlado.
