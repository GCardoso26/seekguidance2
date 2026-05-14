# Production Maturity Sprint — TCG Judge Platform

Documento técnico do incremento **“research-grade → production-grade”** preservando **reasoning_v1 … reasoning_v11**, motores simbólicos, ontologia, runtime distribuído, temporal intelligence e multi-TCG.

## Arquitetura (incremental)

| Camada | Local | Descrição |
|--------|--------|-----------|
| API + reasoning | `services/api/app` | FastAPI, RAG, pipelines V1–V11 **inalterados em contrato**. |
| Ingestão | `services/ingestion/tcg_judge_ingestion` | Crawl, parse, validação, métricas, orquestração. |
| Workers | `services/workers` | arq: download/parse/embed + DLQ stub + workers de suporte. |
| Infra | `infra/db`, `infra/observability`, `infra/disaster_recovery`, `infra/deployment` | SQL, Prometheus/OTEL mínimos, runbooks. |
| UX estática | `apps/*` | MVPs HTML para replay, stack, console, treino, torneio. |
| Avaliação | `services/api/evaluation/*` | Golden schema, edge cases, runtime_eval stub. |

## Módulos criados ou expandidos (ingestão)

- **`crawler/publisher_clients/`** — `models.py` (contrato), `generic.py` (fetch resiliente).
- **`crawler/robots/robots_txt.py`** — leitura best-effort de `robots.txt`.
- **`crawler/scheduling/windows.py`** — janelas declarativas (cron hint).
- **`crawler/integrity/checksums.py`** — SHA-256 e verificação.
- **`crawler/adaptive_fetch/throttle.py`** — token bucket async por host.
- **`crawler/resilient_fetch.py`** (existente) — retry + circuit breaker + métricas.
- **`pdf_tracking/page_fingerprint.py`**
- **`document_versioning/lineage.py`**
- **`semantic_diffing/sections.py`**
- **`ingestion_orchestrator/plan.py`**
- **`job_recovery/replay.py`**
- **`queue_monitoring/depth.py`**
- **`validation/semantic_validation.py`** (+ validações anteriores)
- **`parsers/{mtg,yugioh,pokemon,onepiece,digimon,fab,lorcana,riftbound}/extract.py`**
- **`parsers/registry.py`** — roteamento por `game_slug`.

## Multi-TCG (normalização)

Em `app/games/normalization/`:

- **`ontology_enrichment/inheritance.py`**
- **`semantic_taxonomy/tags.py`**
- **`interaction_taxonomy/kinds.py`**
- **`timing_taxonomy/layers.py`**

Mantém-se a regra: **não forçar equivalência falsa** (stack ≠ chain); referências cruzadas em `semantic_alignment/cross_tcg_bridge.py` (sprint anterior).

### Reasoning profiles (Yu-Gi-Oh)

`app/games/adapters/yugioh/reasoning_profiles.py` passou de stub a **perfil maduro stub** com SEGOC, chain, timing, tuning de retrieval/graph.

## Observabilidade e SLO

- **`app/observability/telemetry_bridge.py`** — configuração OTLP sem dependência obrigatória.
- **`app/observability/slo.py`** — helpers de avaliação de latência e determinismo.
- **`app/observability/production_metrics.py`** (existente) — gauges/counters agregados.
- **`infra/observability/prometheus.yml`**, **`otel-collector-minimal.yaml`**, `README.md`.

## Configuração (`Settings` + `.env.example`)

Novos campos em `app/core/config.py`:

- Observabilidade: `observability_otel_enabled`, `observability_otel_endpoint`, `observability_prometheus_enabled`, `observability_log_json`.
- API: `api_rate_limit_requests_per_minute`, `api_rate_limit_window_seconds` (usados em `app/main.py`).
- Ingestão: `ingestion_default_host_rps`, `ingestion_max_concurrent_downloads`, `ingestion_dlq_enabled`.
- Cache (preparação): `cache_retrieval_ttl_seconds`, `cache_semantic_ttl_seconds`.
- SLO: `slo_retrieval_p95_ms_target`, `slo_reasoning_p95_ms_target`, `slo_replay_determinism_min_score`.

## SQL

- **`infra/db/06_ingestion_production.sql`** — fingerprints e linhagem em `documents` / `chunks` (montado no `docker-compose`).

## UX / produto

- `apps/stack_visualizer/`, `apps/judge_console/`, `apps/tournament_ops/`, `apps/judge_training/` — HTML + README.
- `apps/judge_replay/replay.html` (sprint anterior) mantido.

## Avaliação

- `evaluation/golden_answers/schema.json` — JSON Schema para respostas douradas.
- `evaluation/edge_case_libraries/mtg/timing_trap.sample.json` — exemplo.
- `evaluation/runtime_eval/nightly_stub.py` + README.

## Testes adicionados

| Ficheiro | Cobertura |
|----------|-----------|
| `tests/test_production_maturity.py` | Settings de produção, SLO, OTEL stub, taxonomia, throttle async |
| `tests/ingestion/test_ingestion_modules.py` | Plano de ingestão MTG, `extract_for_game`, cobertura semântica |

Os testes de API importam `tcg_judge_ingestion` via `tests/conftest.py` (`sys.path` → `services/ingestion`).

## E2E

Não foi adicionada nova bateria E2E obrigatória (evitar duplicação com `tests/e2e/test_judge_questions.py`). Stubs HTML servem para smoke manual.

## Métricas (ingestão)

Counters/gauges em `monitoring/ingestion_metrics.py`, incluindo:

- `crawl_success_total`, `crawl_fail_total`, `retry_frequency`, `circuit_open_wait`, `pipeline_latency_ms`.

## Integrações

- **Rate limit** da API lê agora `Settings` (antes constante 60).
- **Parsers** alimentam validação semântica e futura ligação a `StructuredRule` V2/V3.
- **Orquestrador** consome `sources_registry` existente.

## Limitações (gaps honestos)

1. **OpenTelemetry / Prometheus** — hooks e YAML mínimos; falta exporter `/metrics` na API e dashboards Grafana completos.
2. **HNSW / ANN** — comentários e SQL preparados; rebuild operacional e sharding não automatizados neste diff.
3. **GPU workers** — não adicionados (dependem de cluster e imagens CUDA).
4. **Corpus massivo / golden humano** — apenas schema + 1 sample JSON.
5. **Crawlers “reais” por publisher** — `resilient_get_bytes` + registry de URLs; falta política legal por site, sitemaps, e testes de integração contra origens vivas.
6. **DLQ persistente** — `dead_letter_worker` + flag `ingestion_dlq_enabled`; fila dedicada em Redis/Postgres a implementar.
7. **Segurança** — rate limit in-memory; falta Redis token bucket, auth tenant-scoped, assinatura de snapshots.
8. **CI/CD Helm** — READMEs guia; charts completos fora de escopo deste incremento.

## Próximos passos recomendados

1. Expor `/metrics` (prometheus_client ou OTEL metric exporter) na API e workers.
2. Ligar `HostThrottle` + `ingestion_default_host_rps` dentro de `resilient_fetch`.
3. Persistir `document_fingerprint` / `version_hash` em `insert_document` (asyncpg).
4. Preencher `golden_answers/*.json` com revisão humana e gatilhar `evaluation_worker`.
5. HNSW: `CREATE INDEX CONCURRENTLY` após carga mínima + job de rebuild.
6. Helm chart com Deployment API + worker + OTEL sidecar.

## Compatibilidade

- **Nenhuma** remoção de pipelines V1–V11.
- Payloads `reasoning_v1`–`reasoning_v11` **não** foram alterados neste sprint.
- Alteração comportamental controlada: **rate limit** passa a ser configurável (default igual ao anterior: 60 req / 60 s para `/v1/chat`).

## Validação executada

- `python -m ruff check app tests`
- `python -m pytest`

(Repetir localmente após `docker compose` com novos SQLs em DB vazia.)
