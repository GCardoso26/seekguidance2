# Storage (AWS)

## RDS PostgreSQL

- Mesmo contrato que local: `DATABASE_URL` com `postgresql+asyncpg://`.
- **RDS Proxy** opcional (`RDS_PROXY_ENABLED`) para pooling e failover readiness.
- Extensão **pgvector** — confirmar parameter group / `CREATE EXTENSION`.

## ElastiCache Redis

- `REDIS_URL` aponta para primary endpoint (TLS recomendado).
- Uso: cache retrieval, DLQ keys, locks distribuídos, filas arq.

## S3

Buckets sugeridos (prefixos versionados por ambiente):

| Uso | Variável (API) |
|-----|------------------|
| Replay archives | `S3_REPLAY_ARCHIVE_BUCKET` |
| Ontology snapshots | `S3_ONTOLOGY_SNAPSHOT_BUCKET` |
| Runtime snapshots | `S3_RUNTIME_SNAPSHOT_BUCKET` |
| Semantic lineage | `S3_SEMANTIC_LINEAGE_BUCKET` |
| Judge datasets | `S3_JUDGE_DATASETS_BUCKET` |
| Ingestion corpus | `S3_INGESTION_CORPUS_BUCKET` |
| Proof artifacts | `S3_PROOF_ARTIFACTS_BUCKET` |

## Glacier

- **Lifecycle** S3 → Glacier/Deep Archive após `S3_GLACIER_TRANSITION_DAYS`.
- Restores documentados em `disaster_recovery/`.

Exemplo de política de bucket (substituir ARNs): `s3-bucket-policy-replay.example.json`.
