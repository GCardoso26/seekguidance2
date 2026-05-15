# Guia passo a passo — ambiente TCG Judge na AWS

Este guia é **incremental**: podes parar ao fim de qualquer fase e ainda ter um ambiente utilizável. O código continua a correr em **Docker Compose** local; na AWS usas os mesmos serviços lógicos (**Postgres**, **Redis**, API **FastAPI**, **workers**).

Documentação de apoio:

- `docs/AWS_RUNTIME_PLATFORM.md` — visão de arquitectura e gaps.
- `infra/aws/README.md` — mapa de pastas (Terraform, EKS, CI/CD).
- `services/api/.env.example` — variáveis (incluindo `AWS_*`, `S3_*`, `EKS_*`, …).

{
    "UserId": "AIDA6NSI3A6DHHEKL4HWQ",
    "Account": "991216469894",
    "Arn": "arn:aws:iam::991216469894:user/Adm_Judge"
}

---

## Fase 0 — Decisão de alvo

| Opção | Quando usar | Complexidade |
|--------|----------------|----------------|
| **A) Mínimo laboratório** | Validar só BD/cache na cloud e API noutro sítio | Baixa |
| **B) Produção típica** | API + workers na cloud, dados geridos | Média–alta |
| **C) EKS completo** | Muitas réplicas, equipa com experiência Kubernetes | Alta |

Recomendação: fazer **B** com **RDS + ElastiCache + EKS** (ou **ECS Fargate** se preferires menos Kubernetes — não está automatizado neste repo, mas o mesmo `DATABASE_URL` / `REDIS_URL` aplicam-se).

---

## Fase 1 — Conta e ferramentas

1. Conta **AWS** com billing activo e **IAM user** ou **SSO** para administrador.
2. Instalar na tua máquina:
   - [AWS CLI v2](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
   - `kubectl` ([instalação](https://kubernetes.io/docs/tasks/tools/))
   - `helm` ([instalação](https://helm.sh/docs/intro/install/))
3. Configurar credenciais: `aws configure` (região, por exemplo `eu-west-1`).
4. No GitHub (se fores usar CI): preparar **OIDC** para IAM (sem access keys no repositório) — ver `infra/aws/cicd/github_actions/README.md`.

---

## Fase 2 — Rede (VPC)

1. Cria uma **VPC** com subnets **privadas** (EKS nodes, RDS, Redis) e **públicas** (opcional, para NAT ou bastion).
2. Cria **security groups**:
   - **RDS**: entrada só a partir do SG dos nodes EKS (ou do SG da API ECS) na porta **5432**.
   - **Redis**: entrada só do mesmo conjunto na porta **6379** (ou **TLS** conforme configuração).
3. (Opcional) **VPC endpoints** para S3 e ECR para reduzir custo de NAT.

*Templates:* evoluir a partir de `infra/aws/terraform/` e `infra/aws/networking/README.md` (roadmap Terraform).

---

## Fase 3 — PostgreSQL (RDS)

1. No **RDS**, cria instância **PostgreSQL** compatível com a versão que usas em dev (ex.: 16).
2. Activa **storage encryption** e backups automáticos.
3. Garante extensão **pgvector** (parameter group / `CREATE EXTENSION` após primeira ligação — validar com a equipa DBA).
4. Copia o **endpoint** e monta o `DATABASE_URL` no formato que a API já exige (asyncpg):

   `postgresql+asyncpg://USER:PASSWORD@endpoint.rds.amazonaws.com:5432/tcg_judge`

5. **Não** commits da password: usa **Secrets Manager** (ver fase 7).

---

## Fase 4 — Redis (ElastiCache)

1. Cria cluster **Elastiache for Redis** (modo que preferires: cluster ou single node para MVP).
2. Activa **in-transit encryption** se a política de segurança o exigir; ajusta a URL (`rediss://` vs `redis://`) e parâmetros no cliente.
3. Monta `REDIS_URL`, por exemplo:

   `redis://master.xxx.cache.amazonaws.com:6379/0`

4. Restringe SG: só a API/workers falam com o Redis.

---

## Fase 5 — S3 (opcional, mas recomendado para replay/corpus)

1. Cria buckets versionados (nomes alinhados a `services/api/.env.example`, por exemplo `S3_REPLAY_ARCHIVE_BUCKET`).
2. Aplica política de exemplo `infra/aws/storage/s3-bucket-policy-replay.example.json` (substituir `REPLACE_*`).
3. Configura **lifecycle** para arquivo (Glacier) se usares `S3_GLACIER_TRANSITION_DAYS`.
4. Na API, define as variáveis `S3_*` correspondentes; `AWS_PLATFORM_ENABLED=true` quando quiseres ligar caminhos “cloud-aware” (os stubs não fazem boto3 até implementares adapters).

---

## Fase 6 — Imagens Docker (ECR)

1. Cria repositórios **ECR**: por exemplo `tcg-judge-api` e `tcg-judge-worker`.
2. Na raiz do monorepo (onde está `services/api/Dockerfile`):

   ```bash
   aws ecr get-login-password --region REGIAO | docker login --username AWS --password-stdin ACCOUNT.dkr.ecr.REGIAO.amazonaws.com
   docker build -f services/api/Dockerfile -t tcg-judge-api:latest .
   docker tag tcg-judge-api:latest ACCOUNT.dkr.ecr.REGIAO.amazonaws.com/tcg-judge-api:latest
   docker push ACCOUNT.dkr.ecr.REGIAO.amazonaws.com/tcg-judge-api:latest
   ```

3. Repete para `services/workers/Dockerfile` → imagem worker.

*CI:* workflow manual `/.github/workflows/aws-platform-build.yml` valida build localmente no GitHub Actions (sem push até configurares secrets).

---

## Fase 7 — Segredos (Secrets Manager + Kubernetes)

1. Cria secret no **Secrets Manager** com chaves JSON: `DATABASE_URL`, `REDIS_URL`, `OPENAI_API_KEY`, etc.
2. No cluster **EKS**, instala **External Secrets Operator** (recomendado) e define `ExternalSecret` que sincroniza para um `Secret` Kubernetes `tcg-judge-api-env`.
3. No manifesto/Helm (`infra/aws/eks/api/deployment.example.yaml` ou `infra/aws/eks/helm/tcg-judge-api/`), usa `envFrom.secretRef.name: tcg-judge-api-env`.

Prefixo opcional na API: `SECRETS_MANAGER_PREFIX` (documentado em `.env.example`).

---

## Fase 8 — Cluster EKS

1. Cria cluster **EKS** (versão suportada) com **node group** **sem GPU** (ex.: `m7g.large`).
2. Configura `kubectl`: `aws eks update-kubeconfig --name NOME_DO_CLUSTER --region REGIAO`.
3. Instala **AWS Load Balancer Controller** (se fores usar ALB) ou outro Ingress conforme `infra/aws/eks/ingress/README.md`.
4. Aplica namespaces: `kubectl apply -f infra/aws/eks/namespaces.yaml`.
5. (Opcional) **Cluster Autoscaler** + **metrics-server** para HPA — ver `infra/aws/eks/autoscaling/README.md`.
6. Ajusta o Helm chart `infra/aws/eks/helm/tcg-judge-api/values.yaml`:
   - `image.repository` / `image.tag` → URI ECR.
   - `replicaCount`, `resources`, `gpu.enabled: false` (mantém por defeito).
7. Instala:

   ```bash
   helm upgrade --install tcg-judge-api ./infra/aws/eks/helm/tcg-judge-api -n api --create-namespace
   ```

8. Aplica **HPA** e **PDB** a partir dos exemplos em `infra/aws/eks/api/` (ajusta nomes se necessário).

---

## Fase 9 — Workers no EKS

1. Cria `Secret`/`ExternalSecret` para o worker (muitas vezes os mesmos `DATABASE_URL` e `REDIS_URL`).
2. Adapta `infra/aws/eks/workers/deployment.example.yaml` com a imagem ECR do worker.
3. `kubectl apply -n workers -f ...`

Confirma que o **Redis** e a **RDS** aceitam ligações a partir dos pods (mesmos SGs da fase 2).

---

## Fase 10 — Expor a API e testar

1. Cria **Ingress** ou **Service** `LoadBalancer` conforme o controller instalado.
2. Obtém URL pública ou interna (ALB).
3. Testa:

   ```bash
   curl -fsS https://SEU_ALB/ | jq .
   curl -fsS https://SEU_ALB/docs
   ```

4. Ajusta **CORS** na API se o front estiver noutro domínio (hoje o MVP pode estar permissivo; em produção restringe origens).

---

## Fase 11 — Front estático (opcional)

Segue `apps/AWS_STATIC_HOSTING.md`: **S3** + **CloudFront** + certificado **ACM**, invalidação de cache no deploy.

---

## Fase 12 — Observabilidade (opcional)

1. Define `OBSERVABILITY_OTEL_ENABLED` e `OBSERVABILITY_OTEL_ENDPOINT` quando tiveres collector (fragmento em `infra/aws/observability/otel/collector-aws.fragment.yaml`).
2. `CLOUDWATCH_LOG_GROUP_API` para agregação de logs JSON.
3. Importa dashboards stub de `infra/aws/observability/grafana/dashboards/` para Grafana gerido.

O stub `aws_observability_bridge_stub` em `app/observability/live_runtime/` reflecte apenas configuração; o wiring completo no `main.py` é roadmap incremental.

---

## Checklist final (antes de chamar “produção”)

- [ ] Backups RDS e janela de restore testados.
- [ ] Redis com auth/TLS conforme política.
- [ ] Buckets S3 com versioning + política least-privilege.
- [ ] Sem secrets no Git; rotação documentada.
- [ ] WAF / rate limit em frente à API exposta à Internet.
- [ ] Custos: tags `Project=tcg-judge`, `Environment=...`, budgets AWS.

---

## Se algo falhar

- **API não liga à BD**: SG, `DATABASE_URL`, ou extensão pgvector.
- **Workers sem fila**: `REDIS_URL` e prefixos DLQ (`WORKER_DLQ_REDIS_KEY_PREFIX`).
- **Build Docker no CI**: contexto na **raiz** do monorepo (igual ao `docker-compose.yml`).

Para detalhes de arquitectura e limitações dos stubs, volta a `docs/AWS_RUNTIME_PLATFORM.md`.
