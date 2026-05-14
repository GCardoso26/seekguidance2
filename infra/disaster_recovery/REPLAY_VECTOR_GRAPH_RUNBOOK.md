# Runbook: recuperação de replay, vetores e grafo semântico

1. **Postgres**: restaurar snapshot; validar `document_versions` e `chunks`.
2. **Replays**: revalidar hashes com `app.runtime.replay.replay_validation`; comparar com assinaturas HMAC se `REPLAY_SIGNING_SECRET` estiver ativo.
3. **Vetores (pgvector / HNSW)**: executar plano `app.retrieval.hnsw_ops.hnsw_rebuild_plan` por shard; warm-up de embeddings com lineage em `embedding_lineage_stub` (substituir por tabela real).
4. **Grafo**: reconstruir `rule_graph_edges` a partir de chunks + jobs de mineração.
5. **Consistência**: correr `pytest -m judge_grade` e suites de drift (`app.verification.drift`).
