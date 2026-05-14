# Replay storage

Estratégia de retenção:

- curto prazo: hot store para diagnósticos live
- médio prazo: objetos imutáveis com `snapshot_id` + `lineage_metadata`
- arquivo: alinhar a `tcg_judge_ingestion/semantic_replay_archives` e investigações de torneio

Recuperação determinística documentada em `disaster_recovery_v2`.
