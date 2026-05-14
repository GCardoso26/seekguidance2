# CI/CD (AWS)

| Pasta | Conteúdo |
|-------|-----------|
| `github_actions/` | Workflows reais em `.github/workflows/` + notas aqui. |
| `codepipeline/` | Stages: Source → Build → Deploy → Bake time. |
| `buildspec/` | Exemplos CodeBuild (`docker build`, `helm upgrade`). |
| `deploy/` | Estratégias blue/green ou canary com Helm. |
| `rollback/` | `helm rollback` + métricas replay. |
| `smoke/` | Scripts `curl` / `pytest -m smoke` pós-deploy. |
| `runtime_validation/` | Checks determinismo / branch entropy (stubs CI). |

Segredos: **OIDC** GitHub → IAM (sem AWS keys no repositório).
