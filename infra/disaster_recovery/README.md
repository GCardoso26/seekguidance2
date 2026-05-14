# Disaster recovery

- **Postgres**: `pg_dump` / PITR + réplicas de leitura.
- **Vetores**: rebuild HNSW após restore (job `ANN rebuild`).
- **Replays**: snapshots versionados (`document_versions`, `chunks.lineage_root_chunk_id`).
- **Semantic graph**: reconstruir a partir de `rule_graph_edges` + chunks.

Automatizar com runbooks no operador de cloud.
