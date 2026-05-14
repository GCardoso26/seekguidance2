# Runtime — custos e SLO (AWS)

Subpastas:

- `cost_governance/` — orçamentos, alertas de custo, consolidação Karpenter.
- `autoscaling_profiles/` — perfis HPA/CA por ambiente (staging vs production).
- `replay_cost_controls/` — lifecycle S3, prefix quotas.
- `branch_entropy_limits/` — caps de emergência (`BRANCH_ENTROPY_EMERGENCY_CAP` na API).
- `runtime_slo/` — SLO documentados (latência retrieval, determinismo replay).
- `operational_limits/` — throttling ingestão, caps solver (`SOLVER_RUNTIME_*`).
