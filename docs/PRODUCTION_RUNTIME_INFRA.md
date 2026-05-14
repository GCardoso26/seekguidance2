# Production Runtime Infra

## Observabilidade

- `app/observability/*` + `otel_spans.py` (atributos padronizados).
- `infra/observability/DASHBOARDS.md` + `infra/metrics/*` (Prometheus/Grafana stubs).
- Ativar `OBSERVABILITY_OTEL_ENABLED` + endpoint collector em produção.

## ANN / HNSW

- `app/retrieval/hnsw_ops.py`: plano de rebuild, lineage de embedding.
- Workers de rebuild a definir no scheduler (Kubernetes CronJob ou arq).

## Workers e GPU

- `services/workers/queue_profiles.py`: descritores de fila + DLQ.
- `gpu_inference_hooks.py`: jobs GPU (rerank/embeddings).

## Deployment

- `infra/deployment/BLUE_GREEN_CANARY.md`: padrões de rollout e rollback.
- `docker-compose.yml` mantém ambiente dev coerente.

## Segurança

- `app/security/replay_integrity.py` (HMAC opcional).
- Rate limit já na API (`rate_limit_middleware`).

## DR

- `infra/disaster_recovery/*` + runbooks de replay/vetores.

## Gaps

- Exporters Prometheus específicos por domínio (ingestion, replay) ainda genéricos.
- Helm charts completos não gerados (documentação apenas).

## Custos

- GPU para rerank contínuo.
- Rebuild HNSW após mudança de dimensão de embedding.

## Riscos

- Cardinalidade alta de labels OTEL se `game_slug` não for controlado.
