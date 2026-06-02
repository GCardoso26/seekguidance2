# PDF Ingestion Guide

## Upload

`POST /runtime/admin/ingestion/upload`  
`multipart/form-data`: `game_slug`, `file` (PDF, max 25MB)

## Metadados

Tabela `uploaded_documents`:

- `filename`, `checksum`, `pages`, `chunk_count`
- `source_type = local_document`
- `uploaded_by`

## Pipeline

Upload → metadados persistidos → reindex job recomendado para chunking/embeddings.

## OCR

Opcional — não incluído no MVP Wave 2C; preparar extensão futura.
