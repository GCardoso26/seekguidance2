# Plano completo sem EC2 — Render + Vercel + Supabase + Upstash

Guia para operar o **Judge TCG** sem pagar EC2/RDS na AWS. O browser fala só com **Vercel**; a API corre no **Render**; dados no **Supabase**; fila/cache no **Upstash**.

```text
Utilizador
   │
   ▼
https://judgetcg.com.br          (Vercel — Next.js runtime_console_v3)
   │
   ├─► páginas /judge, …
   └─► /api/proxy/*  ──►  https://tcg-judge-api.onrender.com  (Render — FastAPI)
                              │
                              ├─► Supabase Postgres (schema tcg_judge, pgvector)
                              └─► Upstash Redis (rediss:// — workers / futuro cache)
```

**Ingestão** (PDFs, embeddings): na **tua máquina** ou **GitHub Actions** — não precisa de EC2.

---

## Custos (ordem de grandeza)

| Serviço | Plano típico MVP | AWS equivalente a desligar |
|---------|------------------|----------------------------|
| Supabase | Free / Pro | RDS |
| Upstash Redis | Free tier | ElastiCache / Redis EC2 |
| Render Web Service | Free ou Starter (~$7/m) | EC2 (API) |
| Vercel | Hobby (domínio próprio OK) | EC2 (Next + Caddy) |
| OpenAI | Pay-as-you-go | — |

Depois de validar tudo: **Stop/Terminate EC2**, **Delete RDS**, libertar **Elastic IP**.

---

## Pré-requisitos

- [x] Dados no Supabase (`tcg_judge`, ~2147 chunks) — já migrado
- Conta [Render](https://render.com)
- Conta [Vercel](https://vercel.com)
- Conta [Upstash](https://console.upstash.com)
- Repositório GitHub: `GCardoso26/seekguidance2`
- Domínio **judgetcg.com.br** (Registro.br)
- `OPENAI_API_KEY` para RAG/judge

---

## Fase 1 — Upstash (Redis)

1. [console.upstash.com](https://console.upstash.com) → **Create Database**
2. Região: **US-East-1** (boa latência com Render `oregon`/`frankfurt` e Supabase `sa-east-1` pooler)
3. Copia **Redis URL** com TLS:

```text
rediss://default:SEU_TOKEN@xxxx.upstash.io:6379
```

> Usa `rediss://` (com duplo s), não `redis://`, para TLS a partir da internet.

4. Guarda num gestor de secrets — vais colar no Render.

**Nota:** O endpoint `/runtime/judge/query` **não usa** Redis no MVP; a variável `REDIS_URL` é obrigatória no arranque da API (`Settings`), mas pode ser Upstash mesmo sem worker activo.

---

## Fase 2 — Supabase (confirmar)

Variáveis que a API no Render precisa:

```env
DATABASE_URL=postgresql+asyncpg://postgres.udtpsgdhknlanyndilyo:SENHA_ENCODED@aws-1-sa-east-1.pooler.supabase.com:5432/postgres
DATABASE_SSL=require
```

Regras:

- User do **pooler**: `postgres.PROJECT_REF` (não só `postgres`)
- Password com `#` → `%23` na URL
- **Sem** `?sslmode=require` na URL (o código trata SSL via `DATABASE_SSL` ou host Supabase)
- Base de dados: `postgres` (schema `tcg_judge` nas queries)

Teste local (opcional):

```bash
curl -s "https://SEU-PROJECT.supabase.co"  # dashboard
psql "postgresql://..." -c "SELECT count(*) FROM tcg_judge.chunks;"
```

Índice HNSW (SQL Editor Supabase, se ainda não existir):

```sql
SET search_path TO tcg_judge, public;
CREATE INDEX IF NOT EXISTS idx_chunks_embedding_hnsw
  ON chunks USING hnsw (embedding vector_cosine_ops);
```

---

## Fase 3 — API no Render

### 3.1 Criar Web Service

1. Render Dashboard → **New +** → **Web Service**
2. Liga o GitHub `seekguidance2` / branch `main`
3. Configuração:

| Campo | Valor |
|-------|--------|
| **Name** | `tcg-judge-api` |
| **Region** | Oregon (US West) ou Frankfurt (EU) |
| **Runtime** | Docker |
| **Root Directory** | *(vazio — raiz do repo)* |
| **Dockerfile Path** | `services/api/Dockerfile.production` |
| **Docker Build Context** | `.` |
| **Instance Type** | Free (testes) ou Starter (produção) |

4. **Health Check Path:** `/v1/health` (ou `/health`)

### 3.2 Variáveis de ambiente (Render → Environment)

| Key | Valor |
|-----|--------|
| `ENVIRONMENT` | `production` |
| `LOG_LEVEL` | `INFO` |
| `DATABASE_URL` | `postgresql+asyncpg://postgres.REF:SENHA%23...@aws-1-sa-east-1.pooler.supabase.com:5432/postgres` |
| `DATABASE_SSL` | `require` |
| `REDIS_URL` | `rediss://default:TOKEN@xxxx.upstash.io:6379` |
| `OPENAI_API_KEY` | `sk-...` |
| `OPENAI_EMBEDDING_MODEL` | `text-embedding-3-large` |
| `OPENAI_EMBEDDING_DIMENSIONS` | `1536` |
| `RUNTIME_AUTH_SECRET` | string longa aleatória (32+ chars) |
| `RUNTIME_DATA_DIR` | `/tmp/runtime` *(Render é efémero; SQLite pilot só para testes)* |

**Não** defines `RUNTIME_DATABASE_URL` a menos que queiras runtime em Postgres.

### 3.3 Deploy e validar

Após o build, anota a URL: `https://tcg-judge-api.onrender.com`

```bash
curl -s "https://tcg-judge-api.onrender.com/v1/health"
curl -s "https://tcg-judge-api.onrender.com/v1/games" | head -c 400

curl -s -X POST "https://tcg-judge-api.onrender.com/runtime/judge/query" \
  -H "Content-Type: application/json" \
  -d '{"tcg":"pokemon","question":"How many prize cards when I knock out a Pokemon?"}' \
  | head -c 600
```

Esperado: `status ok`, lista de jogos, judge com `success: true` e `sources`.

### 3.4 Blueprint (opcional)

O repo inclui `render.yaml`. Podes usar **New → Blueprint** e depois preencher secrets `DATABASE_URL`, `REDIS_URL`, `OPENAI_API_KEY` na dashboard.

### 3.5 Problemas comuns (Render)

| Erro | Solução |
|------|---------|
| Build Docker falha `COPY` | **Docker context** = raiz `.`, não `services/api` |
| Unhealthy | Falta `DATABASE_URL` / Supabase bloqueado → confirma pooler + `DATABASE_SSL` |
| `sslmode` TypeError | URL **sem** `?sslmode=`; usa `DATABASE_SSL=require` |
| `psycopg2` | URL tem de ser `postgresql+asyncpg://` |
| Cold start lento (free) | Normal no plano free; Starter reduz sleep |
| OpenAI timeout | Confirma `OPENAI_API_KEY` e créditos |

---

## Fase 4 — Frontend na Vercel

### 4.1 Importar projeto

1. [vercel.com](https://vercel.com) → **Add New Project** → repo `seekguidance2`
2. Configuração:

| Campo | Valor |
|-------|--------|
| **Root Directory** | `frontend/runtime_console_v3` |
| **Framework Preset** | Next.js |
| **Build Command** | `npm run build` (default) |
| **Output** | automático (Next 14) |

### 4.2 Variáveis de ambiente (Vercel → Settings → Environment)

**Production:**

| Key | Valor |
|-----|--------|
| `API_PROXY_TARGET` | `https://tcg-judge-api.onrender.com` |
| `NEXT_PUBLIC_APP_URL` | `https://judgetcg.com.br` |

**Não** definas `NEXT_PUBLIC_API_URL` em produção — o browser usa `/api/proxy` (mesmo origin, sem CORS).

O ficheiro `src/app/api/proxy/[...path]/route.ts` reencaminha para `API_PROXY_TARGET`.

### 4.3 Deploy de teste

URL Vercel: `https://seekguidance2-xxx.vercel.app`

Testes:

- `https://xxx.vercel.app/judge` — UI
- Abrir DevTools → Network → pedido a `/api/proxy/v1/games` → 200

### 4.4 Domínio judgetcg.com.br

1. Vercel → projeto → **Settings → Domains**
2. Adiciona `judgetcg.com.br` e `www.judgetcg.com.br`
3. Vercel mostra registos DNS (ex.: `A` 76.76.21.21 ou `CNAME` `cname.vercel-dns.com`)

**Registro.br:**

| Tipo | Nome | Valor |
|------|------|--------|
| **A** ou **ALIAS** | `@` | conforme Vercel (apex) |
| **CNAME** | `www` | `cname.vercel-dns.com` |

4. Aguarda SSL automático (Let's Encrypt via Vercel)
5. Confirma:

```bash
dig +short judgetcg.com.br
curl -sI "https://judgetcg.com.br/judge" | head -5
```

### 4.5 Problemas comuns (Vercel)

| Erro | Solução |
|------|---------|
| 502 em `/api/proxy/...` | `API_PROXY_TARGET` errado ou API Render down |
| CORS | Usar proxy (`/api/proxy`), não chamar Render directo do browser |
| Build Next falha | `Root Directory` = `frontend/runtime_console_v3` |
| Domínio não resolve | DNS ainda a propagar; confere Registro.br |

---

## Fase 5 — Ingestão (sem EC2)

Corre no **PC** ou **GitHub Actions** com `DATABASE_URL` Supabase:

```powershell
cd S:\tcg-judge\services\ingestion
pip install -e .
cd S:\tcg-judge

$env:DATABASE_URL = "postgresql+asyncpg://postgres.REF:SENHA%23...@aws-1-sa-east-1.pooler.supabase.com:5432/postgres"
$env:OPENAI_API_KEY = "sk-..."

python scripts/ingest_tcg.py --game pokemon --all
python scripts/ingest_tcg.py --game lorcana --all
# mtg, yugioh, onepiece...
```

Pokémon MTR bloqueado online: PDF em `data/ingest/pokemon/play-pokemon-tcg-tournament-handbook-en.pdf`.

**Worker Render (opcional):** podes criar um **Background Worker** no Render com `services/workers/Dockerfile` e as mesmas env vars — só se precisares de fila `arq` 24/7. Para MVP, ingestão manual basta.

---

## Fase 6 — Desligar AWS

Ordem segura:

1. [ ] Render: `/v1/games` + judge OK
2. [ ] Vercel: `/judge` + proxy OK
3. [ ] Domínio `judgetcg.com.br` → Vercel (não EC2)
4. [ ] Backup final RDS (já tens `tcg_judge_backup.dump`)
5. [ ] **Stop** instância EC2 (teste 1–2 dias)
6. [ ] **Delete** RDS `judge-tcg-db`
7. [ ] Libertar **Elastic IP** se não usada
8. [ ] Remover Security Groups / ALB órfãos (se existirem)
9. [ ] **Terminate** EC2 quando confirmares

**Não** apagues Supabase nem Upstash.

---

## Fase 7 — Checklist final de produção

```bash
# API Render
curl -s "https://tcg-judge-api.onrender.com/v1/health"
curl -s "https://tcg-judge-api.onrender.com/v1/games" | python3 -m json.tool | head

# Site
curl -sI "https://judgetcg.com.br/judge"
curl -s "https://judgetcg.com.br/api/proxy/v1/games" | head -c 300

# Judge via site (proxy)
curl -s -X POST "https://judgetcg.com.br/api/proxy/runtime/judge/query" \
  -H "Content-Type: application/json" \
  -d '{"tcg":"mtg","question":"What is trample?"}' | head -c 500
```

---

## Segurança

- Roda passwords **Supabase**, **Upstash**, `RUNTIME_AUTH_SECRET` após migração
- Não commits `.env.production` / secrets no GitHub
- Supabase: **não** expor schema `tcg_judge` na Data API pública sem RLS
- Render/Vercel: variáveis só em Environment Secrets

---

## Referências no repo

| Ficheiro | Conteúdo |
|----------|----------|
| `render.yaml` | Blueprint Render |
| `services/api/Dockerfile.production` | Imagem API leve |
| `frontend/runtime_console_v3/.env.production.example` | Env Vercel |
| `.env.supabase.example` | Template Supabase + Upstash |
| `docs/SUPABASE_MIGRATION.md` | Migração RDS → Supabase |
| `docs/UPSTASH_EC2.md` | Upstash (se mantiveres EC2 temporariamente) |

---

## Resumo em 6 passos

1. **Upstash** → copia `REDIS_URL` (`rediss://`)
2. **Render** → Docker API + env Supabase + Upstash + OpenAI
3. Testa `https://<api>.onrender.com/v1/games`
4. **Vercel** → `frontend/runtime_console_v3` + `API_PROXY_TARGET` = URL Render
5. **DNS** `judgetcg.com.br` → Vercel
6. **Desliga** EC2 + RDS

Com isto o stack público fica **100% fora da AWS** (exceto domínio .br no Registro.br).
