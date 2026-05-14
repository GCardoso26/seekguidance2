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

Importar também fragmentos em `prometheus.recording_rules.yml` e `prometheus.alert_rules.yml` desta pasta ao compor o Prometheus final.
