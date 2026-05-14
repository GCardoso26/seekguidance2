# Disaster recovery v2

Procedimentos para recuperação **determinística** de replays e arquivo temporal:

1. Restaurar snapshot de corpus referenciado pelo manifest v2.
2. Revalidar hashes de replay (`replay_consistency_monitoring`).
3. Reabilitar workers com caps de explosion control antes de carga total.

Runbooks legados permanecem em `infra/disaster_recovery/`.
