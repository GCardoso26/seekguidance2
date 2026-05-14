# Operational stability sprint

## Scope

Incremental operational layer for multi-TCG judge intelligence: tracing correlation, explosion control V2, replay stability, worker maturity, corpus quality signals, cross-TCG stability checks, continuous evaluation V2, and verification confidence — **without** removing reasoning pipelines V1–V11 or changing `reasoning_v1`…`reasoning_v11` contracts.

## Architecture

| Area | Location | Role |
|------|----------|------|
| Runtime tracing | `app/observability/runtime_tracing/` | Logical trace IDs, span metadata, retrieval↔reasoning correlation |
| Profiling | `app/observability/profiling/` | Branch/replay/graph/temporal cost proxies |
| Explosion V2 | `app/runtime/explosion_control_v2/` | Adaptive pruning hints alongside existing graph caps |
| Replay stability | `app/runtime/replay_stability/` | Dedupe, merge, temporal checks |
| Cross-TCG stability | `app/games/stability/` | Pressure matrix, boundary checks, anti–hard-equivalence |
| Corpus quality | `services/ingestion/tcg_judge_ingestion/corpus_quality/` | Ruling confidence, archive validation, tournament flags |
| Workers | `services/workers/` | Backpressure, health, DLQ peek, replay queue compaction |
| Verification confidence | `app/verification/operational_confidence/` | Operational scores separate from user-facing bundles |
| Multiplayer reasoning | `app/reasoning/multiplayer/` | Facade over `app/multiplayer` for APNAP / simultâneos |
| Continuous eval V2 | `app/evaluation/continuous/` | Semantic regression, drift series, cross-TCG spread |
| Infra | `infra/observability/` | Grafana skeleton, recording rules examples, alerting examples |

## Explosion control

- **V1** (`app/graph/explosion_control/`) remains authoritative for graph caps in production paths.
- **V2** adds entropy pressure, semantic branch limits, replay hash compaction, adaptive prune decisions — **feature-gate** heavy paths in orchestrators when wiring (not done globally in this sprint).

## Tracing & observability strategy

- Stable OTEL-style span names in `semantic_trace_spans.SpanNames`.
- **Gap:** Full OTLP export, exemplars, and Grafana datasource wiring are deployment-specific; API ships logical metadata + hooks.

## Replay stability

- Compaction reuses `replay_dedupe_events` for deterministic bounds.
- **Gap:** Archive compaction at rest (object storage) not implemented here.

## Cross-TCG pressure

- Soft normalization preserved: `normalization_safety` flags hard equivalence; pressure matrix is documentary + testable.
- **Gap:** No automated play-style simulation per TCG in CI.

## Operational confidence

- Scores are interpretable aggregates for dashboards and internal gates.
- **Gap:** Not merged into external API responses unless explicitly requested (keeps contracts stable).

## Tuning strategy

- Prefer caps from `Settings` + adaptive engines reading pressure metrics; tune via env / continuous eval nightly when enabled.

## Honest limitations

1. **Metrics names** in `infra/observability/*/recording_rules.yml` are placeholders until Prometheus instrumentation registers counters/histograms with the same names.
2. **DLQ recovery** exposes peek helpers; replay UI and ACLs for operators are not built.
3. **Corpus quality** modules are deterministic stubs; real PDF parsing and judge-forum mining remain ingestion-team work.
4. **Explosion V2** does not replace symbolic solvers; it informs pruning decisions only.
5. **Multiplayer** facade does not implement full MP rules engines — it validates ordering / conflicts at the stub level.

## Next steps

- Wire `explosion_control_v2.adaptive_prune_decision` behind a feature flag in graph + reasoning orchestrators.
- Register Prometheus metrics aligned with recording rules.
- Connect Tempo trace IDs from workers to API via shared `bind_trace` contract.
