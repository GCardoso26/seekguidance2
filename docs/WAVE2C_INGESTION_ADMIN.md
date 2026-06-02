# Wave 2C — Admin de ingestão

## API (RBAC `ingestion_admin`)

Prefixo: `/runtime/admin/ingestion`

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/status` | Estado por jogo (chunks, coverage, job recente) |
| GET | `/jobs` | Lista de jobs |
| POST | `/reindex` | Dispara re-indexação |
| POST | `/upload` | PDF manual (&lt; validação de extensão) |
| GET | `/errors` | Erros de documento (diagnostics) |

Implementação: `services/api/app/api/v1/runtime_ingestion_admin.py`

## UI

- `/ingestion` — consola de ingestão
- `/observability` — aba Infrastructure + qualidade Judge

Guia operacional: [INGESTION_ADMIN_GUIDE.md](./INGESTION_ADMIN_GUIDE.md), [PDF_INGESTION_GUIDE.md](./PDF_INGESTION_GUIDE.md).

## Migração

`supabase/migrations/20260601000000_wave2c_ingestion_diagnostics.sql` — `document_errors` e colunas em `ingestion_jobs`.
