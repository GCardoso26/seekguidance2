# Banco de dados (PostgreSQL + pgvector)

Schema principal: **`tcg_judge`**.

## Entidades centrais

| Tabela | Função |
|--------|--------|
| `tenants` | Multi-tenant (organizações / ambientes). |
| `games` | Catálogo dinâmico de TCGs (`slug`, `enabled`, `publisher`). |
| `documents` | Documento oficial versionado por `content_hash` + URL. |
| `document_versions` | Histórico / diff entre versões. |
| `chunks` | Trechos para RAG + coluna `embedding vector(1536)` + metadados JSON. |
| `users` | Contas (OAuth subject + tier). |
| `conversations` / `messages` | Memória de chat + citações serializadas. |
| `ingestion_jobs` | Fila de crawlers / reindexação. |
| `audit_logs` | Auditoria admin. |

## Índice vetorial

O `init.sql` **não** cria índice ANN na carga vazia (evita falhas IVFFlat). Após ingestão inicial:

- Preferir **HNSW** em pgvector recente: menor latência P95.
- Alternativa: **Qdrant** como search engine dedicado; Postgres permanece fonte de verdade.

## Seeds

Dez jogos iniciais inseridos com `ON CONFLICT (tenant_id, slug) DO NOTHING`.

Fonte canônica do DDL: `S:\tcg-judge\infra\db\init.sql`.
