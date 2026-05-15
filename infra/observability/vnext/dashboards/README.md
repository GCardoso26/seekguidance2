# Dashboards VNext (Grafana)

Modelos vivos recomendados (importar JSON existentes em `infra/observability/grafana_runtime/` e `grafana_live/`):

- Replay dashboards: integridade, drift, entropia de ramos.
- Legality dashboards: confiança do solver, divergência temporal, SEGOC/APNAP.
- Runtime consistency: backpressure, DLQ depth, latência worker.
- Ontology dashboards: drift e supersession.
- Solver dashboards: proof steps agregados (sem CNF).
- Multiplayer dashboards: alinhamento de traces e estados assistidos.
- **Lineage dashboards**: âncoras temporais, merges e `lineage_persistence` (payload móvel).
- **Replay dashboards**: reconciliação, `replay_confidence`, heatmaps de ramos e conflitos semânticos.
- **Sync dashboards**: filas, backpressure e drift entre dispositivos (sem equivalência forte cross-TCG).
- **Runtime entropy dashboards**: pressão combinada de ramos + custo previsto (`runtime_cost_forecasting`).
- **Reconciliation dashboards**: `replay_reconciliation`, consenso e repair hints determinísticos.
- **CI / governance dashboards**: gates `continuous_v8` ligados a datasets executáveis e regressões temporais.

## JSON stub (Grafana vNext)

Ficheiros mínimos na mesma pasta, prontos a importar e enriquecer:

- `replay_runtime.json`, `replay_governance.json`, `runtime_entropy.json`, `mobile_runtime.json`, `offline_sync.json`, `lineage_runtime.json`, `dataset_runtime.json`, `ontology_runtime.json`, `multiplayer_runtime.json`.
- `runtime_governance.json`, `replay_health.json`, `runtime_ci.json` (governança operacional + saúde de replay + gates de CI).
- `aws_hybrid_mobile_runtime.json`, `distributed_replay_lineage.json`, `replay_sync_conflicts.json` (híbrido AWS/mobile + lineage distribuído + conflitos de sync).
- `replay_federation_health.json`, `runtime_alignment.json`, `mobile_runtime_health.json`, `replay_cost_heatmap.json`, `runtime_drift_governance.json` (federation vNext).

Importar também fragmentos em `prometheus.recording_rules.yml` e `prometheus.alert_rules.yml` desta pasta ao compor o Prometheus final.
