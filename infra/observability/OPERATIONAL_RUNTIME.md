# Operational runtime (architecture)

- **API runtime** (`app/runtime/production_runtime/`): orquestração, backpressure, degradação, recuperação determinística.
- **Observability** (`app/observability/live_runtime/`): traces live, Prometheus opcional, diagnósticos de replay/legalidade.
- **Explosion V4** (`app/runtime/explosion_control_v4/`): predição, emergência, compressão semântica.

**Gap:** ligação a workers reais e exportadores OTLP/Prometheus com nomes estáveis em cada deploy.
