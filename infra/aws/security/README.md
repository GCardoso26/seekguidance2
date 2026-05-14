# Security (AWS)

## IAM (least privilege)

- **IRSA** para pods API/workers (sem access keys em Secret Kubernetes).
- Políticas separadas: S3 prefixos, KMS decrypt, Secrets Manager `GetSecretValue` com resource ARN restrito.

Ver `iam/README.md` e exemplos JSON (sem ARNs reais).

## Secrets Manager + KMS

- Rotação de segredos RDS / API keys externas.
- `KMS_KEY_ID` para encryption S3/SNS/SQS conforme adotado.

## WAF

- `WAF_WEB_ACL_ARN` readiness — associar a ALB/API Gateway quando exposição for internet-facing.

## Runtime security

- Falco / GuardDuty / Inspector — roadmap; não bloqueia MVP EKS.
