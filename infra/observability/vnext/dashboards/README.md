# Dashboards VNext (Grafana)

Modelos vivos recomendados (importar JSON existentes em `infra/observability/grafana_runtime/` e `grafana_live/`):

- Replay dashboards: integridade, drift, entropia de ramos.
- Legality dashboards: confiança do solver, divergência temporal, SEGOC/APNAP.
- Runtime consistency: backpressure, DLQ depth, latência worker.
- Ontology dashboards: drift e supersession.
- Solver dashboards: proof steps agregados (sem CNF).
- Multiplayer dashboards: alinhamento de traces e estados assistidos.
