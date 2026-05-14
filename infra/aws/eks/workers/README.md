# Workers (EKS)

- Deployments separados por fila (ingestão, replay governance, evaluation).
- **DLQ**: SQS ou Redis persistente (compatível com `services/workers/dlq_store.py` roadmap).
- Probes e `terminationGracePeriodSeconds` alinhados a jobs longos.
