# TCG Judge — infraestrutura AWS (incremental)

Este diretório contém **modelos, exemplos e documentação** para operar a plataforma na AWS **sem tornar a cloud obrigatória**: o desenvolvimento local continua em **Docker Compose** (`docker-compose.yml` na raiz).

## Despriorização operacional (mobile-first / edge)

A infra AWS **mantém-se** como **opcional**: sync, arquivo de replay, observabilidade central, ingestão e analytics quando fizer sentido económico e operacional. **Não** é requisito para o runtime do assistente em dispositivo — ver `docs/MOBILE_FIRST_ARCHITECTURE.md` e `docs/MOBILE_JUDGE_ASSISTANT_PLATFORM.md`.

- **EKS / autoscaling pesado / OTEL enterprise / Grafana obrigatório** passam a ser **caminhos de adopção**, não núcleo do produto.
- **Nada aqui é apagado** por esta reorientação: apenas o **papel** na arquitectura global.

## Princípios

- **Opcional**: variáveis `AWS_*`, `EKS_*`, `S3_*`, etc. em `services/api/.env.example` — só ativam caminhos específicos quando configuradas.
- **Explainability-first** e **replay determinístico** preservados; integrações são *adapters* e stubs honestos até I/O real.
- **Sem segredos** versionados: usar Secrets Manager / IAM / KMS em conta real.

## Mapa

| Pasta | Conteúdo |
|-------|-----------|
| `terraform/` | Raiz Terraform (estado remoto S3 a configurar). |
| `cloudformation/` | Exemplos CloudFormation (stacks incrementais). |
| `eks/` | Namespaces, manifests exemplo, Helm `tcg-judge-api`. |
| `networking/` | VPC / subnets / notas de segurança. |
| `storage/` | RDS, ElastiCache, S3, Glacier readiness. |
| `security/` | IAM least privilege, KMS, WAF readiness. |
| `observability/` | OTEL, CloudWatch, Prometheus remote write, Grafana. |
| `runtime/` | Custos, SLOs, limites de entropia / scaling. |
| `disaster_recovery/` | Backup / restore / failover regional. |
| `cicd/` | GitHub Actions, CodePipeline, smoke e rollback. |

## Ordem de adoção sugerida

1. RDS + ElastiCache (ou Aurora + Redis) com as mesmas URLs que já usa a API (`DATABASE_URL`, `REDIS_URL`).
2. S3 para *replay archives* e artefactos de ingestão (prefixos versionados).
3. EKS com o chart exemplo + HPA + probes (GPU **opcional** via `values.yaml`).
4. Observabilidade: OTEL → ADOT / collector + CloudWatch / Grafana Managed.
5. CI/CD: build imagem → ECR → deploy Helm com gates de smoke.

Consulta `docs/AWS_RUNTIME_PLATFORM.md` para arquitetura e gaps honestos.
