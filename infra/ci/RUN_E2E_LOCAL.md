# Run E2E local (PowerShell)

Pré-requisitos: Docker Desktop a correr, `docker compose` disponível na raiz do repositório.

```powershell
Set-Location S:\tcg-judge
docker compose up -d postgres redis api
# Aguardar health do serviço `api` (porta 8000).

$env:RUN_E2E = "1"
$env:E2E_USE_COMPOSE_REDIS = "1"
$env:E2E_API_BASE = "http://127.0.0.1:8000"
Set-Location .\services\api
pytest tests\e2e -q
```

- Sem API acessível: os testes e2e são **skipped** (guard em `tests/e2e/conftest.py`) em vez de falharem por timeout.
- Para embeddings + respostas completas: defina `OPENAI_API_KEY` no `docker-compose` ou `.env` da API e execute ingestão conforme `docs/INGESTION.md`.
