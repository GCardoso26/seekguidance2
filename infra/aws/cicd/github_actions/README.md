# GitHub Actions → AWS

Workflows activos na raiz do repo:

- `../../.github/workflows/ci.yml` — lint + testes (existente).
- `../../.github/workflows/aws-platform-build.yml` — build Docker API/worker e opcional push ECR (`workflow_dispatch`).

Configurar em GitHub: secrets `AWS_ROLE_TO_ASSUME`, `ECR_REPOSITORY_API`, etc., antes de activar push.
