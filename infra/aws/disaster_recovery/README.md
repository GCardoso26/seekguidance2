# Disaster recovery (AWS)

## Estratégia incremental

1. **RDS**: backups automáticos + snapshot manual antes de major migrations.
2. **S3**: versioning + replicação cross-region (opcional).
3. **Redis**: snapshots ElastiCache + tolerância a cold start (rehydrate cache).
4. **EKS**: Velero para cluster state + manifests GitOps.

Subpastas: `replay_recovery/`, `runtime_restore/`, `semantic_restore/`, `database_restore/`, `cache_restore/`, `region_failover/`.
