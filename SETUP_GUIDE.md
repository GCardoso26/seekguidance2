# JudgeTCG — Guia de Configuração do Ambiente de Desenvolvimento

Este guia descreve **como configurar** um ambiente. O **estado do que está no ar** (Vercel up, Render fora, health 503) está em [docs/engineering/TEAM_ONBOARDING_ESTADO_ATUAL.md](docs/engineering/TEAM_ONBOARDING_ESTADO_ATUAL.md) — leia esse arquivo primeiro se você é novo no time.


**Repositório:** `seekguidance2` / `S:\tcg-judge`  
**Produção:** https://judgetcg.com.br

---

## 1. Pré-requisitos

| Ferramenta | Versão mínima |
|------------|---------------|
| Node.js | 20+ |
| npm | 10+ |
| Python | 3.11+ |
| PostgreSQL | 15+ (com extensão `pgvector`) |
| Docker (opcional) | Para Postgres/Redis locais |
| Git | 2.40+ |

**Contas externas (dev/staging):**

- [Supabase](https://supabase.com) — Auth + PostgreSQL + Storage
- [Stripe](https://stripe.com) — modo teste (Connect + Checkout)
- [Vercel](https://vercel.com) — frontend Next.js
- [Render](https://render.com) — API FastAPI (ou Docker local)
- [Upstash Redis](https://upstash.com) — opcional (rate limit / cache na Vercel)

---

## 2. Estrutura do monorepo

```
S:\tcg-judge\
├── frontend/runtime_console_v3/   # Next.js 15 + React 19 (UI + BFF)
├── services/api/                  # FastAPI (Judge RAG, catálogo, marketplace, torneios)
├── supabase/migrations/           # Schema PostgreSQL
├── e2e/                           # Playwright (132 testes)
└── tests/                         # Vitest unitários
```

**Arquitetura BFF dual:**

- Seller: `/api/seller/*` → `/runtime/judge/seller/*`
- Store: `/api/marketplace/shop/stores/{storeId}/*` → `/runtime/judge/marketplace/shop/stores/{id}/*`

**Proxy Auth:** `frontend/runtime_console_v3/src/lib/supabase/proxy-auth.ts` propaga `Authorization: Bearer <jwt>` + `X-Judge-User-Id`.

---

## 3. Variáveis de ambiente — Frontend

Copie `frontend/runtime_console_v3/.env.example` para `.env.local`:

```bash
cd frontend/runtime_console_v3
cp .env.example .env.local
```

### Obrigatórias para auth + catálogo

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...   # chave anon (NUNCA service_role no browser)
NEXT_PUBLIC_APP_URL=http://localhost:3000
API_PROXY_TARGET=http://127.0.0.1:8000
```

### Pagamentos (Stripe)

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...              # server-only (rotas BFF)
STRIPE_WEBHOOK_SECRET=whsec_...
PAYMENTS_ENABLED=false                     # true quando checkout estiver pronto
```

### Web Push (Epic 18 — notificações)

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
```

Gerar chaves VAPID:

```bash
npx web-push generate-vapid-keys
```

### Server-only (não expor no bundle)

```env
SUPABASE_SERVICE_ROLE_KEY=...    # E2E, badges, moderação
SUPABASE_JWT_SECRET=...          # validação JWT legada HS256
RUNTIME_AUTH_SECRET=...          # mesmo valor do FastAPI
CRON_SECRET=...                  # crons Vercel
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

### Torneios

```env
TOURNAMENT_API_BASE=http://localhost:8000
```

---

## 4. Variáveis de ambiente — API FastAPI

Copie `services/api/.env.example` para `.env`:

```bash
cd services/api
cp .env.example .env
```

### Essenciais

```env
DATABASE_URL=postgresql+asyncpg://tcgjudge:tcgjudge_dev@localhost:5432/tcg_judge
REDIS_URL=redis://localhost:6380/0
ENVIRONMENT=development

SUPABASE_URL=https://SEU_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_JWT_SECRET=...

STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
MARKETPLACE_APP_URL=http://localhost:3000
```

### Judge RAG (opcional em dev)

```env
OPENAI_API_KEY=sk-...
DEFAULT_CHAT_MODEL=gpt-4o-mini
DEFAULT_EMBEDDING_MODEL=text-embedding-3-large
RAG_ALLOWED_GAME_SLUGS=mtg,pokemon,yugioh,onepiece,digimon,lorcana,riftbound,fab
```

### Catálogo / Meilisearch (opcional)

```env
MEILI_HOST=http://localhost:7700
MEILI_MASTER_KEY=dev-master-key
```

---

## 5. Setup do banco de dados

### Opção A — Supabase CLI (recomendado)

```bash
# Na raiz do repo
supabase start          # Postgres local + Studio
supabase db reset       # aplica todas as migrations + seed
```

### Opção B — Postgres existente

```bash
# Aplicar migrations em ordem
psql "$DATABASE_URL" -f supabase/migrations/20260519000000_init_tcg_judge.sql
# ... demais arquivos em supabase/migrations/ por timestamp
```

### Seed de dados iniciais

- Jogos TCG: migration `20260520120000_add_multi_tcg_games.sql` + `20260624180000_catalog_games_5_new_tcgs.sql`
- Regras Judge: ingestão via admin console ou scripts em `services/api/app/retrieval/`
- Catálogo de cartas: sync via endpoints `/runtime/judge/catalog/sync/*` ou cron

---

## 6. Setup do Frontend

```bash
cd frontend/runtime_console_v3
npm install
npm run dev
```

Abrir http://localhost:3000

### Build de produção

```bash
npm run build
npm run start
```

### Domínios de imagem (`next.config.mjs`)

O Next.js Image Optimization já inclui:

- `cards.scryfall.io`, `images.pokemontcg.io`, `images.ygoprodeck.com`
- `images.judgetcg.com.br`, `**.judgetcg.com.br`
- CDNs TCG (Lorcana, SWU, Sorcery, Vanguard, etc.)

Componente central: `src/components/ui/CardImage.tsx` (lazy load, blur placeholder, `onError`).

---

## 7. Setup da API

```bash
cd services/api
python -m venv venv

# Windows PowerShell
.\venv\Scripts\Activate.ps1

# Linux/macOS
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Health check: http://127.0.0.1:8000/health

---

## 8. Docker Compose (opcional)

```bash
# Na raiz — Postgres + Redis
docker compose up -d postgres redis
```

Redis local exposto em `localhost:6380` (ver `services/api/.env.example`).

---

## 9. Testes

### Unitários (Vitest)

```bash
cd frontend/runtime_console_v3
npm run test:unit
npm run test:coverage
```

### E2E (Playwright — 132 testes)

```bash
cd frontend/runtime_console_v3
# Configure .env.local + SUPABASE_SERVICE_ROLE_KEY para auth setup
npx playwright test
```

Com UI:

```bash
npx playwright test --ui
```

### API Python

```bash
cd services/api
pytest tests/ -q
```

---

## 10. Deploy

| Serviço | Plataforma | Root Directory |
|---------|------------|----------------|
| Frontend | Vercel | `frontend/runtime_console_v3` |
| API | Render | `services/api` |
| DB | Supabase | — |

**Vercel — variáveis críticas:**

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `API_PROXY_TARGET=https://seekguidance.onrender.com` (ou URL da API)
- `SUPABASE_SERVICE_ROLE_KEY` (server)
- Redirect OAuth: `https://judgetcg.com.br/auth/callback**`

**Render — variáveis críticas:**

- `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_JWT_SECRET`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`

Ver também: `docs/DEPLOY_CHECKLIST.md`, `docs/AUTHENTICATION_GUIDE.md`.

---

## 11. Troubleshooting

| Problema | Solução |
|----------|---------|
| Imagens de cartas não carregam | Verificar domínio em `next.config.mjs` → `images.remotePatterns`; usar `CardImage` |
| OAuth volta para home | Verificar redirect URLs no Supabase; `/judge` não deve exigir role judge |
| API 401 no BFF | Token expirado — Supabase refresh automático; conferir `proxy-auth.ts` |
| Catálogo vazio | Rodar sync de catálogo; conferir `DATABASE_URL` e migrations |
| E2E falham auth | `SUPABASE_SERVICE_ROLE_KEY` + `e2e/auth.setup.ts` |

---

## 12. Referências

- Contexto técnico: `docs/PROJECT_CONTEXT_EPIC_18.md`
- ADR painel lojista: `docs/ADR-001` (se existir na pasta docs)
- Epics entregues: 1–18 (marketplace, torneios, wishlist, gamificação, notificações)
