# API de replay runtime (`/v1/replay/*`)

## Rotas

- `GET /v1/replay/health`
- `POST /v1/replay/validate`, `/lineage`, `/diff`, `/reconcile`, `/runtime-summary`

## Contratos

- Payloads leves com `assistant_notes`, alinhamento determinístico e summaries operacionais; sem execução jurídica real no MVP.
