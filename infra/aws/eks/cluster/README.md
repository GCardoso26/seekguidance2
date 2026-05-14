# Cluster EKS

- Versão Kubernetes alinhada ao suportado na região.
- **Control plane logging** (API, audit) para CloudWatch.
- **IRSA** (IAM Roles for Service Accounts) para pods acederem a S3/Secrets sem keys estáticas.

Detalhes de `eksctl` / Terraform ficam nos módulos `infra/aws/terraform` (roadmap).
