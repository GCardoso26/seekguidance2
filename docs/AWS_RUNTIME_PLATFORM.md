# TCG Judge — plataforma runtime AWS

Documento de **arquitetura incremental** para operar na AWS sem desligar o **Docker Compose** local nem alterar contratos **reasoning_v1…v11** / pipelines **V1–V11**.

**Guia operacional passo a passo:** `docs/AWS_DEPLOY_GUIA_PASSO_A_PASSO.md`.

## Visão geral

| Camada | Serviço AWS típico | Estado no repo |
|--------|-------------------|----------------|
| Compute | **EKS** (Fargate ou EC2 nodes) | Manifestos + Helm em `infra/aws/eks/` |
| Dados | **RDS Postgres** + **ElastiCache Redis** | URLs via `DATABASE_URL` / `REDIS_URL` |
| Objectos | **S3** (+ Glacier lifecycle) | Buckets opcionais (`S3_*` na API) |
| Segurança | **IAM IRSA**, **Secrets Manager**, **KMS**, **WAF** | READMEs + exemplos JSON |
| Observabilidade | **OTEL**, **CloudWatch**, **AMP**, **Grafana**, **X-Ray** | Fragmentos + `aws_observability_bridge_stub` |
| CI/CD | **GitHub Actions** + (opcional) **CodePipeline** | `aws-platform-build.yml` + `infra/aws/cicd/` |
| DR | Backups RDS, versioning S3, Velero | `infra/aws/disaster_recovery/` |

## EKS

- Namespaces: `api`, `workers`, `replay`, `observability`, `evaluation`, `ingestion`.
- **GPU opcional**: `values.yaml` do chart `gpu.enabled: false` por defeito; pool dedicado quando necessário.
- **HPA + PDB + probes** nos exemplos `eks/api/*.example.yaml`.

## Storage

- **RDS**: pgvector + parameter groups — validar antes de produção.
- **Redis**: TLS + auth token.
- **S3**: políticas least-privilege (`storage/s3-bucket-policy-replay.example.json`).
- **Glacier**: `S3_GLACIER_TRANSITION_DAYS` para arquivo legal/replay.

## Replay governance

- `replay_storage_adapters_aws_stub` liga config a futuros adapters boto3 (sem I/O por defeito).
- Retenção e lineage: ver `infra/aws/runtime/replay_cost_controls/`.

## Observabilidade

- `app/observability/live_runtime/aws_observability_bridge_stub` expõe flags (`OTEL`, CloudWatch, X-Ray, Prometheus remote write, Grafana URL).
- Dashboards stub JSON em `infra/aws/observability/grafana/dashboards/`.

## Runtime distribuído

- `aws_runtime_orchestration_stub` em `app/runtime/production_runtime/` resume `AWS_PLATFORM_ENABLED`, buckets e backends de storage **sem** assumir cloud ativa.

## Workers

- `services/workers/aws_worker_orchestration.py` — hints SQS/DLQ (`WORKER_RUNTIME_*`).

## Ingestão massiva

- `distributed_ingestion_aws_runtime_stub` — checkpoints S3 via `INGESTION_CHECKPOINT_S3_PREFIX` (opcional).

## Formal solver v6

- `aws_solver_runtime_v6_payload` — telemetria/artefactos bounded; **sem CNF bruto**; GPU opcional via config.

## Judge UX

- `apps/AWS_STATIC_HOSTING.md` — S3/CloudFront + CORS.

## Segurança

- Sem segredos no Git: usar **Secrets Manager** + **External Secrets Operator**.
- **WAF** e **throttling** API documentados; enforcement gradual.

## Custos e governança

- `infra/aws/runtime/cost_governance/` + `BRANCH_ENTROPY_EMERGENCY_CAP` / `COST_GOVERNANCE_MONTHLY_BUDGET_USD`.

## Gaps honestos

- Terraform/Helm **não** provisionam conta real até credenciais e redes estarem definidas.
- Exporters OTEL/X-Ray **não** estão wired no `main.py` (evitar side-effects locais).
- **boto3** não adicionado como dependência por defeito (opcional em sprint futura).
- Multi-region failover é **readiness**, não automação completa.

## Roadmap curto

1. OIDC GitHub → IAM + push ECR real.
2. Módulo Terraform `network` + `rds` + `elasticache`.
3. External Secrets + Helm values por ambiente.
4. ADOT collector DaemonSet + remote write AMP.

## Smoke

- `services/api/tests/smoke/test_sprint_docs_and_schema.py` inclui este ficheiro.
