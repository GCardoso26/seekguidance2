# CI/CD

## GitHub Actions

Workflow: `.github/workflows/ci.yml`

- **job `api`**: Python 3.12, `pip install`, `ruff check`, `pytest`.
- **job `mobile`**: Node 20, `npm ci`, `tsc --noEmit`.

## Próximos passos

- Gate de **Docker build** push para GHCR.
- **Semantic release** + changelog.
- **EAS** workflow disparado em tag `v*`.
- **SAST** (CodeQL) e **Dependabot**.

## Ambientes

| Branch | Deploy |
|--------|--------|
| `develop` | staging cluster |
| `main` | produção (manual approval) |
