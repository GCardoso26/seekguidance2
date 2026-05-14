# CloudFormation (exemplos)

Stacks incrementais sugeridos:

1. `tcg-judge-network` — VPC + subnets (export outputs para RDS/EKS).
2. `tcg-judge-data` — RDS subnet group + security groups (sem passwords no template; usar Secrets Manager).
3. `tcg-judge-s3` — buckets com versioning, encryption SSE-KMS, lifecycle Glacier opcional.

O ficheiro `template-stub.yaml` é um **placeholder** válido para validar `aws cloudformation validate-template`.
