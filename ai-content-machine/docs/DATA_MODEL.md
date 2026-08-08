# Data Model (Fase 2 deltas)

## Novas tabelas

- `research_runs` — status QUEUED/RUNNING/COMPLETED/FAILED/PARTIAL/CANCELLED
- `script_runs` — tokens, cost, model, provider, platform
- `ai_cost_events` — telemetria de custo

## Topics

+ `fingerprint` (unique), `score`, `score_breakdown`, `normalized_title`

## Scripts

+ `platform`, `status`, `quality_score`, `quality_breakdown`, `script_run_id`, `selected_hooks`
