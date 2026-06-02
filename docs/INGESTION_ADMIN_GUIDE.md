# Ingestion Admin Guide

## Permissões

Roles `admin` e `operator` têm `ingestion_admin`.

## APIs

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/runtime/admin/ingestion/status` | Status por jogo |
| GET | `/runtime/admin/ingestion/jobs` | Jobs recentes |
| POST | `/runtime/admin/ingestion/reindex` | Enfileirar reindex |
| POST | `/runtime/admin/ingestion/upload` | Upload PDF |
| GET | `/runtime/admin/ingestion/errors` | Erros de documentos |

## UI

`/ingestion` no Runtime Console (requer login operacional).

## Reindex

Cria registo em `ingestion_jobs`. Worker de execução: `python scripts/ingest_tcg.py --game <slug> --all`
