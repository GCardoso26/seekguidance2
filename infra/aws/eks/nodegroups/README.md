# Node groups

- **General**: `m6g.large` / `m7g.large` (Graviton) ou equivalente x86 — sem GPU.
- **GPU (opcional)**: pool separado com `taints` + `tolerations` apenas para workloads que precisem (solver/embeddings pesados).

Labels sugeridos: `workload=tcg-judge-api`, `workload=tcg-judge-workers`.
