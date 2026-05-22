# Migração AWS → Supabase (judgetcg.com.br)

Sim, **é possível** migrar a parte de dados e boa parte da operação. A Supabase **não substitui tudo** o que tens na EC2 num único produto.

## Mapa: o que vai para onde

| Componente AWS actual | Supabase / alternativa | Notas |
|----------------------|------------------------|--------|
| **RDS Postgres + pgvector** | **Supabase Database** | Extensão `vector` disponível; schema `tcg_judge` igual |
| **Secrets Manager** | Variáveis no host da API + [Supabase Vault](https://supabase.com/docs/guides/database/vault) (opcional) | `DATABASE_URL`, keys OpenAI |
| **EC2 API (Docker)** | **Render**, **Fly.io**, **Railway** ou container mínimo | FastAPI mantém-se; só muda `DATABASE_URL` |
| **EC2 Redis** | **Upstash Redis** (recomendado) ou Redis no mesmo host | Workers `arq` precisam de fila; Judge/RAG **não** exige Redis |
| **EC2 Next + Caddy** | **Vercel** (ou Netlify) + DNS `judgetcg.com.br` | `runtime_console_v3` já é Next 14 |
| **Ingestão (scripts)** | GitHub Actions, máquina local, ou job Render | `DATABASE_URL` → connection string Supabase |
| **S3 / ALB / EKS** | Não necessários para MVP Judge | Podes desligar após migração |

```text
Utilizador
   │
   ▼
https://judgetcg.com.br  (Vercel — Next.js /judge)
   │
   └─► /api/proxy ──► https://api.<render>.com  (FastAPI)
                          │
                          ├─► Supabase Postgres (pgvector, schema tcg_judge)
                          └─► Upstash Redis (opcional — workers)
```

---

## Pré-requisitos

1. Conta [Supabase](https://supabase.com) (projeto novo, região próxima dos utilizadores — ex. `sa-east-1` se disponível ou `us-east-1`).
2. Repositório com `infra/db/init.sql` (schema actual).
3. Backup lógico do RDS **antes** de cortar AWS (pg_dump).

---

## Fase 1 — Projeto Supabase e schema

### 1.1 Criar projeto

Dashboard → **New project** → anota:

- **Project URL** (API Auth — se usares depois) https://udtpsgdhknlanyndilyo.supabase.co
- **Database password** Sirius#huaky93
- **Connection string** (Settings → Database) postgresql://postgres:[Sirius#husky93]@db.udtpsgdhknlanyndilyo.supabase.co:5432/postgres

### 1.2 Extensões

No SQL Editor:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

As migrations do repo usam `gen_random_uuid()` (não `uuid_generate_v4()`), porque no Supabase a extensão `uuid-ossp` vive no schema `extensions` e não está no `search_path` por defeito.

(Confirma que `vector` está activo — Supabase suporta pgvector.)

### 1.3 Aplicar schema `tcg_judge`

Opção A — ficheiro do repo:

```bash
# Com Supabase CLI ligado ao projeto
supabase link --project-ref <PROJECT_REF> udtpsgdhknlanyndilyo
supabase db push
```

Opção B — SQL Editor: colar conteúdo de `infra/db/init.sql` e `supabase/seed/games.sql` (se existir).

Opção C — `psql` com connection string **direct** (não pooler) para DDL:

```bash
psql "postgresql://postgres.[ref]:[PASSWORD]@db.[ref].supabase.co:5432/postgres" \
  -f infra/db/init.sql
```

**RLS:** tabelas em `tcg_judge` **não** devem ser expostas via PostgREST ao browser. A API FastAPI liga com utilizador `postgres` / connection string **service** (servidor), não com `anon` key. Não publiques o schema `tcg_judge` na API Data de Supabase sem políticas RLS rigorosas.

### 1.4 Índice HNSW (após dados)

Quando houver chunks com embeddings:

```sql
SET search_path TO tcg_judge, public;
CREATE INDEX IF NOT EXISTS idx_chunks_embedding_hnsw
  ON chunks USING hnsw (embedding vector_cosine_ops);
```

---

## Fase 2 — Connection string para a API

Supabase oferece várias URLs. Para **FastAPI + asyncpg** (ligações longas, RAG):

| Modo | Uso |
|------|-----|
| **Session pooler** (porta 5432, host `*.pooler.supabase.com`) | API Python, ingestão |
| **Transaction pooler** (porta 6543) | Serverless muito curto — evitar para asyncpg pesado |
| **Direct** (`db.*.supabase.co:5432`) | Migrations, `pg_dump` / restore |

Formato para a app (exemplo):

```env
DATABASE_URL=postgresql+asyncpg://postgres.udtpsgdhknlanyndilyo:Sirius#husky93@aws-0-sa-east-1.pooler.supabase.com:5432/postgres
```

Adiciona SSL se necessário:

```env
# alguns drivers: ?ssl=require no final da URL
```

**Schema:** o código usa `search_path` / schema `tcg_judge` — confirma em `mtg_repository` que as queries qualificam `tcg_judge.*` ou faz:

```sql
ALTER DATABASE postgres SET search_path TO tcg_judge, public;
```

(Testar após migrate.)

---

## Fase 3 — Migrar dados do RDS

### 3.1 Export (RDS)

```bash
pg_dump "postgresql://USER:PASS@rds-host:5432/tcg_judge" \
  --schema=tcg_judge \
  --no-owner --no-acl \
  -Fc -f tcg_judge_backup.dump
```

### 3.2 Import (Supabase)

```bash
pg_restore -d "postgresql://postgres.[ref]:[PASS]@db.[ref].supabase.co:5432/postgres" \
  --schema=tcg_judge --no-owner --no-acl \
  tcg_judge_backup.dump
```

Se preferires **re-ingestão** (sem dump): corre os scripts de ingestão com `DATABASE_URL` Supabase (mais lento, gasta OpenAI de novo).

### 3.3 Runtime pilot (SQLite em EC2)

Volume `runtime_data` (auth admin, replay pilot) **não** está no RDS. Opções:

- Manter `RUNTIME_DATABASE_URL` vazio → SQLite no container API (Render volume persistente), ou
- Migrar tabelas runtime para Postgres Supabase (trabalho extra).

Para **só Judge público**, SQLite no API host ou Supabase Auth no futuro chega.

---

## Fase 4 — API fora da EC2

### Render + Vercel + Upstash (guia completo)

Ver **`docs/DEPLOY_SEM_EC2_RENDER_VERCEL.md`** (plano sem EC2, domínio judgetcg.com.br).

Resumo antigo: `docs/DEPLOY_RENDER_VERCEL.md`.

Variáveis mínimas:

```env
DATABASE_URL=postgresql+asyncpg://...@...pooler.supabase.com:5432/postgres
REDIS_URL=redis://default:xxx@xxx.upstash.io:6379
OPENAI_API_KEY=sk-...
RUNTIME_AUTH_SECRET=...
ENVIRONMENT=production
```

Deploy Docker: `services/api/Dockerfile`, contexto raiz do repo.

Health: `GET https://<api>/health`, `POST /runtime/judge/query`.

### Redis

- Cria projeto [Upstash](https://upstash.com) Redis → copia `REDIS_URL`.
- Sem workers no MVP: ainda precisas de `REDIS_URL` válido se `Settings` exigir — confirma `services/api/app/core/config.py` (pode ser URL dummy só para arranque se workers não correm).

---

## Fase 5 — Frontend + domínio

1. **Vercel** → importar `frontend/runtime_console_v3`.
2. **Environment:**
   - `API_PROXY_TARGET=https://<sua-api-render>.onrender.com`
   - `NEXT_PUBLIC_APP_URL=https://judgetcg.com.br`
3. **DNS Registro.br:**
   - `judgetcg.com.br` → CNAME para `cname.vercel-dns.com` (ou A conforme Vercel indicar)
   - `www` → redirect Vercel
4. Remover dependência de EC2/Caddy para o site público.

O browser continua a usar `/api/proxy` no mesmo domínio Vercel.

---

## Fase 6 — Ingestão TCG

Na tua máquina ou CI (GitHub Actions):

```bash
export DATABASE_URL="postgresql+asyncpg://...supabase..."
export OPENAI_API_KEY="sk-..."
python scripts/ingest_tcg.py --game pokemon --all
# etc.
```

Não é obrigatório correr ingestão na Supabase Edge — mantém Python local/CI.

---

## Fase 7 — Desligar AWS (checklist)

- [ ] Supabase: dados + judge queries OK
- [ ] Vercel: `https://judgetcg.com.br/judge` OK
- [ ] API Render: health + RAG OK
- [ ] DNS aponta para Vercel (não EC2)
- [ ] Snapshot final RDS / export guardado
- [ ] Parar EC2, RDS, Elastic IP (evitar custos)

---

## Limitações / o que a Supabase **não** faz sozinha

| Necessidade | Solução |
|-------------|---------|
| FastAPI + pymupdf ingestão | Compute externo (Render, CI, local) |
| Redis / arq workers | Upstash ou omitir workers no MVP |
| TLS + domínio | Vercel + Registro.br |
| PDF Pokémon local | Storage Supabase (opcional) ou continuar `data/ingest/` no CI |
| Auth admin runtime | Supabase Auth (futuro) ou SQLite no API |

---

## Próximos passos no repo (sugeridos)

1. `supabase/migrations/` — versionar schema (a partir de `init.sql`).
2. `.env.supabase.example` — template de URLs.
3. (Opcional) GitHub Action `ingest-tcg-supabase.yml` com secrets.
4. Ajustar `docker-compose.supabase.yml` — API + env, sem Postgres local.

---

## Resumo

| Pergunta | Resposta |
|----------|----------|
| Migrar Postgres/RAG para Supabase? | **Sim** (pgvector + schema actual) |
| Migrar Judge + domínio? | **Sim**, com Vercel + API Render |
| Migrar tudo só com Supabase? | **Não** — precisas de host para FastAPI e opcional Redis |
| Perdem-se os embeddings actuais? | **Não**, se fizeres `pg_dump`/`pg_restore` ou re-ingestão |

Quando tiveres o **project ref** Supabase e preferência de host API (Render vs Fly), podemos gerar os ficheiros `.env` exactos e o primeiro `supabase/migrations` no repo.
