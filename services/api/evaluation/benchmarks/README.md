# Benchmarks contínuos

Este diretório agrupa suites pesadas (retrieval + reasoning + drift).

- Smoke rápido: `app/evaluation/runtime_lab/`
- Nightly: orquestrar `arq` com `benchmark_worker` + imagem CI com Postgres/Redis de teste.

Métricas alvo: ver `docs/` e `app/observability/production_metrics.py`.
