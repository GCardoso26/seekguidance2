# Terraform (AWS)

## Estado

- Configura `backend "s3"` **apenas** quando tiveres bucket de estado e DynamoDB lock (não versionar credenciais).
- Começa por `terraform workspace new staging|production`.

## Módulos (roadmap incremental)

1. `network` — VPC, subnets privadas, endpoints S3/ECR.
2. `rds` — PostgreSQL + pgvector (subnets privadas, security groups).
3. `elasticache` — Redis com encryption in transit.
4. `s3` — buckets versionados (replay, corpus, artefactos).
5. `eks` — cluster + node groups (sem GPU por defeito; pool GPU opcional).
6. `iam` — IRSA roles para API/workers (S3, Secrets Manager, KMS).

Os ficheiros `main.tf` / `variables.tf` presentes são **esqueleto** sem recursos por defeito para evitar `terraform apply` acidental.
