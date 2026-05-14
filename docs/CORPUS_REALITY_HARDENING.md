# Corpus Reality Hardening

## Novidades

- **Arquivos históricos:** `tcg_judge_ingestion/historical_archives/pipeline.py` — intenções por tipo (rulings, fóruns, errata, FAQ…).
- **Drift temporal:** `tcg_judge_ingestion/drift/corpus_time_drift.py` — deltas semânticos / ontologia / replay (stub de série).
- **Trust operacional:** `tcg_judge_ingestion/trust/operational_scoring.py` — fiabilidade de ruling e confiança de arquivo.

## Integração

- Continua a usar `crawlers_real/` e `trust/source_trust.py` como base.

## Riscos de drift

- Errata rápida sem reindexação → drift semântico aparente.
- PDFs mutáveis sem `content_sha256` → falsos positivos de mudança.

## Limitações

- Persistência temporal em DB ainda não unificada com workers.

## Próximos passos

1. Persistir snapshots imutáveis (`corpus/immutable_snapshot.py`) em object storage.
2. Jobs noturnos de diff semântico por `document_id`.
