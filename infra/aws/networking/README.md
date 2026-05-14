# Networking (AWS)

- **VPC** com subnets públicas (LB) e privadas (EKS nodes, RDS, ElastiCache).
- **VPC endpoints** para S3, ECR API/DKR (reduz NAT cost).
- **Security groups**: API → RDS/Redis apenas; workers idem; ingress LB → API.

Sem templates Terraform completos aqui — ver `infra/aws/terraform/README.md` roadmap.
