# tcg-judge-ingestion

Pacote Python: crawler Wizards (MTG), parsers PDF/HTML, chunking hierárquico CR/MTR, embeddings, filas arq.

Instalação (Docker): ver `services/api/Dockerfile`.

Execução local de ingestão ponta-a-ponta:

```powershell
$env:DATABASE_URL = "postgresql://tcgjudge:tcgjudge_dev@localhost:5432/tcg_judge"
$env:OPENAI_API_KEY = "sk-..."
python scripts/ingest_mtg.py
```

Workers:

```powershell
arq services.workers.worker.WorkerSettings
```

## Módulos de produção (ingestão contínua)

| Área | Módulo |
|------|--------|
| Resiliência | `crawler/resilient_fetch.py`, `retry/backoff.py`, `retry/circuit_breaker.py`, `retry/policies.py` |
| Versionamento | `versioning/fingerprint.py`, `semantic_diff.py`, `change_detection.py` |
| Dedup / linhagem | `deduplication/semantic_dedupe.py`, `lineage.py` |
| Validação | `validation/chunk_quality.py`, `citation_integrity.py`, `pipeline_validate.py` |
| Métricas | `monitoring/ingestion_metrics.py` |
| Fontes | `crawler/sources_registry.py` |

SQL: `infra/db/06_ingestion_production.sql` (fingerprints, `version_hash`, linhagem em `chunks`).
