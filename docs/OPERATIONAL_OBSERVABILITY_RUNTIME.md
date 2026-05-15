# Observabilidade operacional do runtime

## Exportadores (stubs)

- `app/observability/runtime_exporters/`: Prometheus / OTEL com prefixos e scopes estáveis (`tcg_judge.*`), incluindo replay, governança, custo, mobile, offline, datasets, entropia de ramos e drift ontológico.

## Dashboards

- JSON mínimos importáveis em Grafana: `replay_runtime.json`, `replay_governance.json`, `runtime_entropy.json`, `mobile_runtime.json`, `offline_sync.json`, `lineage_runtime.json`, `dataset_runtime.json`, `ontology_runtime.json`, `multiplayer_runtime.json`.

## Notas

- Traces e labels devem referenciar apenas agregados; sem dados sensíveis de jogadores.
