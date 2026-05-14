# IAM (exemplos)

Criar roles:

- `tcg-judge-api` — IRSA: `sts:AssumeRoleWithWebIdentity` com condição OIDC do cluster.
- `tcg-judge-worker` — idem, políticas mais estreitas para filas SQS / S3 ingestão.

**Não** versionar policies com account IDs reais — usar placeholders `REPLACE_ACCOUNT`.
