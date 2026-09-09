# JudgeTCG — Onboarding técnico (estado atual)

**Público:** novos membros de engenharia, produto e ops.  
**Objetivo:** deixar a pessoa operacional **sem** assumir que produção tem API, RAG ou marketplace vivos.  
**Data da evidência operacional:** 2026-09-09 (probes HTTP a partir deste ambiente).  
**Hierarquia de verdade:** [Platform Constitution](../architecture/PLATFORM_CONSTITUTION.md) → ADRs → [North Star R1](../product/NORTH_STAR_RELEASE_1.md) → MVP → sprint → ops → código.

> Este documento descreve **o que existe e o que funciona hoje**. Código no repositório ≠ serviço no ar. Render **não está operacional**. Gargalos de API e de consulta a banco são, em grande parte, **orçamento** (plano gratuito/suspenso, minutos de Actions, tokens LLM, Postgres pago), não falta de desenho.

Leia na ordem: **§1 (15 min) → §2–§4 (1 h) → §5–§10 (primeiro dia)**. Não comece por `infra/aws/` nem por relatórios de “100% architecture”.

---

## 1. Foto do sistema em uma tela

| Superfície | Onde | Estado em 2026-09-09 |
|------------|------|----------------------|
| Site público | https://judgetcg.com.br (Vercel + Cloudflare) | **No ar** (HTML 200, homepage prerenderizada) |
| Health do BFF | `GET https://judgetcg.com.br/api/health` | **503 degraded** |
| API FastAPI (Render) | `https://seekguidance.onrender.com` | **Fora** (`x-render-routing: no-server`, corpo `Not Found`) |
| API FastAPI (outro serviço) | `https://seekguidance2-66dz.onrender.com` | **Suspenso** (`Service Suspended`) |
| API legado | `https://tcg-judge-api.onrender.com` | **404** |
| Redis na Vercel | Upstash (via BFF) | **Online** no health |
| Postgres / catálogo via BFF | Supabase `tcg_judge.card_catalog` + FastAPI `/v1/health` | **Offline / erro** |
| Lista de jogos via BFF | `GET /api/games` | **503** `{ "games": [] }` |
| Judge RAG (BFF) | `POST https://judgetcg.com.br/api/judge/query` | **Vivo**: 400 sem `tcg`; **403** `login_required` sem sessão. Upstream FastAPI **não** é alcançado nesse passo |
| Judge RAG (upstream) | FastAPI `/runtime/judge/query` via `API_PROXY_TARGET` | **Indisponível** (Render). Só falharia após login |
| North Star LPC | [PROJECT_STATUS.md](../../PROJECT_STATUS.md) | **0** (Beta not started) |

Trecho real de `GET /api/health` (2026-09-09T18:24:13Z), deploy web `version: 6adb9fd`:

```json
{
  "status": "degraded",
  "checks": {
    "database": { "status": "error", "error": "database error" },
    "catalog_api": { "status": "error", "error": "HTTP 404" },
    "redis": { "status": "ok" }
  },
  "services": [
    { "name": "API Principal", "status": "offline" },
    { "name": "Banco de Dados", "status": "offline" },
    { "name": "Redis (Upstash)", "status": "online" }
  ]
}
```

**Tradução para o time:** o **front** continua servindo páginas. Tudo que depende de FastAPI (Judge, catálogo sincronizado, checkout server-side, listings, ingestão) **não responde em produção**. Redis Upstash no BFF ainda pinga. Consultas SQL de catálogo via PostgREST falham (schema/tabela/chave ou projeto indisponível). Isso é o estado **atual**, não um bug hipotético.

Rewrite de produção (Next): `/api/proxy/:path*` → `API_PROXY_TARGET/:path*` ([`next.config.mjs`](../../frontend/runtime_console_v3/next.config.mjs)). Em 2026-09-09 `GET /api/proxy/v1/health` devolveu **404** `Not Found` (Render sem servidor), não timeout.

---

## 2. O produto (o que o time deve otimizar)

JudgeTCG (`judgetcg.com.br`, repo `seekguidance2`) é um **marketplace especializado em TCG no Brasil** com um **assistente de regras (Judge RAG)**.

A métrica que importa não é “API saudável” nem “14 jogos no seed”:

- **LPC (Liquidity Proof Count):** evento em que oferta de loja e procura de comprador se encontram **sem intervenção humana**. Ver [NORTH_STAR_RELEASE_1.md](../product/NORTH_STAR_RELEASE_1.md).
- Beachhead comercial: **Disney Lorcana** ([ADR-012](../architecture/adr/ADR-012-lorcana-first-beachhead.md)). A arquitetura é multi-TCG; o Release 1 **não** é “lançar todos os jogos”.
- Liquidez de **oferta de loja CNPJ**, não volume de CPF-seller. Há menção a ADR-018 nas regras internas do Platform Guardian; **o arquivo `ADR-018-*.md` não está neste repositório**. A evidência no código é `identity_platform.domain.cnpj` + tabela `tcg_judge.companies`. Não inventar lookup Receita/BrasilAPI de CNPJ: BrasilAPI no front hoje é **CEP** (`src/app/api/geo/cep/[cep]/route.ts`).

**Beta:** `Not started` no [PROJECT_STATUS.md](../../PROJECT_STATUS.md) (gerado em 2026-07-20 — números de maturidade/TCS **não** substituem LPC).

**R4 / R5:** Evidence Release e Market Learning — [EVIDENCE_RELEASE_R4.md](../operations/EVIDENCE_RELEASE_R4.md), [MARKET_LEARNING_R5.md](../operations/MARKET_LEARNING_R5.md). Prioridade: reduzir incerteza de mercado, não somar features.

---

## 3. Regras de decisão (obrigatórias no primeiro dia)

Você **não** entra como “implementador de features por default”. Você entra como **Platform Guardian**.

Antes de qualquer PR:

1. Constituição.
2. ADRs 001–017 (001–014 **não** se editam in-place para afrouxar).
3. North Star R1.
4. Evidência operacional (telemetria, incidente, este documento).
5. Recusar complexidade que **não** reduz incerteza.

Pergunta-filtro: problema **observado** ou **imaginado**? Imaginado não entra.

[ADR-015](../architecture/adr/ADR-015-architecture-freeze-product-first.md): fundação transversal **congelada**. Épico de negócio autorizado após Checkout: **Orders**. Sem RFC+ADR não se abre Event Store, mesh, K8s “porque é melhor”.

Seeds / simulação **não** contam como liquidez em Beta.

DoD de PR: [DEFINITION_OF_DONE.md](./DEFINITION_OF_DONE.md). Processo: [RFC_PROCESS.md](./RFC_PROCESS.md), [RELEASE_TRAIN.md](./RELEASE_TRAIN.md).

---

## 4. Mapa do monorepo (onde trabalhar vs o que ignorar no dia 1)

O `README.md` da raiz ainda descreve um app mobile-first em `S:\tcg-judge`. O **produto web que está no ar** é outro caminho.

```text
seekguidance2/
├── frontend/runtime_console_v3/   # Next.js 15 — UI + BFF (produçāo Vercel)
├── services/api/                  # FastAPI — Judge, marketplace, catálogo, checkout
├── services/ingestion/            # Contratos de ingestão de regras
├── infra/db/*.sql                 # Schema leve tcg_judge (14 jogos seed) + pgvector
├── supabase/migrations/           # Schema public (marketplace, RLS, auth) — precisa Supabase
├── apps/mobile/                   # Expo — não é o beachhead R1
├── apps/web/                      # Workspace npm legado; não é o site de produção
├── docs/                          # Constituição, ADRs, produto, ops, este onboarding
├── e2e/ e frontend/.../e2e/       # Playwright
├── .github/workflows/             # CI + crons que ainda apontam para Render
├── docker-compose.yml             # Postgres pgvector + Redis 6380 + API opcional
└── testing/                       # Relatórios ops / seeds — não usar como prova de LPC
```

**Não** comece por `infra/aws/`, `infra/k8s/`, `infra/disaster_recovery*` ou dashboards Grafana: são desenhos de plataforma. Não estão o runtime de produção atual.

Há **centenas** de rotas BFF (`frontend/runtime_console_v3/src/app/api/**/route.ts`, ordem de 300+) e **dezenas** de `include_router` em [`services/api/app/main.py`](../../services/api/app/main.py) (~46). Isso é amplitude de código, não amplitude de serviço vivo.

---

## 5. Arquitetura que o código implementa

```text
Browser
  → judgetcg.com.br (Next.js 15, Vercel)
       → rotas /api/*  (BFF no mesmo deploy)
            → API_PROXY_TARGET  (hoje default: https://seekguidance.onrender.com)
                 → FastAPI :8000
                      → Postgres (schema tcg_judge +, em marketplace, public/Supabase)
                      → Redis (cache Judge, rate limit, revoke)
                      → OpenAI (embeddings + chat) se houver chave
                      → Stripe / Melhor Envio / APIs TCG (quando configurados)
       → @supabase/ssr (Auth no browser; páginas /judge /decks /seller gated)
       → Upstash Redis REST (rate limit / cache de busca no BFF) — único check verde em prod
```

Default de proxy: [`frontend/runtime_console_v3/src/lib/api-proxy-base.ts`](../../frontend/runtime_console_v3/src/lib/api-proxy-base.ts).

Gargalo **já modelado no código** (orçamento Vercel Hobby ~10 s de função):

- `API_FETCH_TIMEOUT_MS = 7000`
- `SERVERLESS_BUDGET_MS = 9800`
- retries de 502/503/504 pensados para **cold start Render** — inúteis enquanto o serviço estiver `no-server` / suspenso (o BFF recebe 404 imediato e **não** retenta 404).

Auth FastAPI: JWT Supabase **fail-closed em production** (`services/api/app/core/config.py`). Header `X-Judge-User-Id` + RBAC. Em `development` o Judge query pode ser anônimo.

Worker: `worker_main.py` (jobs). Sem Render, **não há worker em produção**.

---

## 6. Dois bancos (não misturar)

| Banco | Como sobe | Para que | Em produção hoje |
|-------|-----------|----------|------------------|
| Postgres `tcg_judge` (`infra/db/*.sql`) | Docker compose ou cluster local `tcgjudge` / `tcg_judge` | Games, `documents`, `chunks`, pgvector, FTS Judge | API que falaria com ele está **fora** |
| Supabase (`supabase/migrations/`, schema `public` + `auth`) | Projeto Supabase real ou `supabase start` | Auth, listings, stores, RLS, storage | Health do BFF **não** consegue ler `tcg_judge.card_catalog` |

O schema leve **não** substitui as migrations de marketplace. Sem Supabase, páginas de catálogo/marketplace no local tendem a **vazio**, mesmo com API Judge ok.

CNPJ: validação **local** (dígitos), persistência `companies`. CEP: BrasilAPI.

---

## 7. O que funciona vs o que só existe no Git

### 7.1 Funciona em produção (observado)

- DNS + TLS + Cloudflare na frente do Vercel.
- HTML da home e rotas estáticas/prerender (`x-nextjs-prerender: 1` no `/`).
- Funções BFF que **não** precisam da FastAPI: health (parcial), Upstash ping, páginas que degradam para vazio/erro.
- Auth UI **pode** funcionar se `NEXT_PUBLIC_SUPABASE_*` estiver no projeto Vercel (não medido neste probe além do health de `card_catalog`). Sem sessão, `/judge` e painéis seller mostram gate de login — isso é esperado.

### 7.2 Não funciona em produção (observado)

- Qualquer `fetch(API_PROXY_TARGET + …)`: Render sem servidor ou suspenso.
- `GET /v1/health` e demais rotas FastAPI (o BFF de health usa `API_PROXY_TARGET` + `/v1/health` → HTTP 404 do Render).
- `GET /api/games` (tenta `/runtime/judge/catalog/games` e `/runtime/judge/games`; catch devolve 503 e array vazio).
- Judge **depois do login**: `POST /api/judge/query` encaminha a `${API_BASE}/runtime/judge/query` (`src/app/api/judge/query/route.ts`). Sem API, a resposta deixa de ser o 403 de auth e passa a ser falha de upstream.
- Checkout/listings/ingestão/admin que passam pelo FastAPI.
- Crons que batem no Render: [catalog-health-ping.yml](../../.github/workflows/catalog-health-ping.yml), [expire-checkouts.yml](../../.github/workflows/expire-checkouts.yml), [catalog-sync.yml](../../.github/workflows/catalog-sync.yml), [smoke-test.yml](../../.github/workflows/smoke-test.yml). O ping de health **ainda aponta** para `seekguidance.onrender.com`. [render-deploy-hook.yml](../../.github/workflows/render-deploy-hook.yml) dispara deploy que **não tem serviço**.

### 7.3 Funciona no desenvolvimento local (quando a máquina sobe a stack)

Este é o caminho **oficial** para o time enquanto Render estiver morto.

1. Postgres 16 + `pgvector` e Redis.
2. `services/api` no venv (`uvicorn app.main:app --reload --port 8000`).
3. Next `npm run dev --workspace=runtime-console-v3` com `API_PROXY_TARGET=http://127.0.0.1:8000`.

Comportamento esperado **sem** `OPENAI_API_KEY` e **sem** corpus ingerido: Judge responde com mensagem do tipo “Configure OPENAI_API_KEY…” e confiança baixa. **Não é bug.**

Compose: Redis publicado em **6380**. Redis nativo do host costuma ser **6379**. `.env.example` da API usa 6380; ambiente Cloud Agent documentava 6379. **Alinhar `REDIS_URL` ao que realmente escuta.**

Auth local exige `NEXT_PUBLIC_SUPABASE_URL` + `ANON_KEY`. Sem isso, só o núcleo anônimo (games/health/judge em `development`) é útil.

### 7.4 Código amplo que não deve ser “ligado” para parecer progresso

- Torneios, ligas, social, overlay, federation, replay, mobile runtime, sandbox seeder.
- NEXUS / “Content War Machine” **não** está em `main`; não documentar como produto.

---

## 8. Gargalos de orçamento (causa raiz, não “otimizar queries no escuro”)

Estado observado + histórico de ops no próprio repo:

| Recurso | O que acontece | Efeito no time |
|---------|----------------|----------------|
| **Render (API + Postgres gerenciado)** | Serviço suspenso / `no-server` | Produção sem FastAPI; Vercel continua |
| **Vercel Hobby** | ~10 s de CPU por função; retries de wake no BFF | Mesmo com API viva, cold start + pgvector + LLM **estouram** o budget |
| **GitHub Actions (repo privado)** | Crons `*/14` (ping), `*/5` (expire), sync de catálogo, Playwright, Lighthouse, load test | Minutos se esgotam; jobs falham em segundos **sem logs** (`steps: []`) |
| **Expire checkouts** | Chama `/runtime/judge/checkout/expire-stale` | Prefixo mutável autenticado; cron **sem JWT** → 401 mesmo com API up |
| **Product Catalog Sync** | Precisa `PRODUCT_CATALOG_DATABASE_URL` | Nunca “verde” sem secret e DB pagos |
| **OpenAI** | Embeddings (`text-embedding-3-large`) + `gpt-4o-mini` | Sem chave: stub; com chave: custo por pergunta e por ingestão |
| **Consulta SQL Judge** | Híbrido pgvector `<=>` + `to_tsvector` (`sql_retrieval.py`) | Barato em local; caro em Postgres gerenciado + cold start |
| **Meilisearch / segunda DB de catálogo** | Compose e sync jobs | Extra a pagar; não está no health verde de produção |

**O que o novo membro não deve fazer** para “resolver o 503”:

- Ligar todos os crons.
- Subir K8s/`infra/aws` “para ficar profissional”.
- Adicionar cache de mais uma camada sem evidência.
- Tratar seed de 14 jogos como catálogo de marketplace.

**O que é decisão de orçamento (gestão), não de sprint de feature:**

1. Reativar **um** runtime FastAPI (Render pago, Fly, Railway, VM) **ou** aceitar site estático.
2. Apontar `API_PROXY_TARGET` no Vercel para esse runtime.
3. Desligar ou reduzir crons Actions até haver minutos.
4. Postgres único (Supabase **ou** Render Postgres), com schema `tcg_judge` exposto se o health continuar usando PostgREST.
5. OpenAI só quando houver corpus + pergunta de produto (Judge), não para demo.

Enquanto (1) e (2) não existirem, **produção permanecerá 503** por desenho atual do BFF.

---

## 9. Jornadas de código (para quando a API local estiver up)

Mapa de camadas (código): [ARCHITECTURE.md](../ARCHITECTURE.md). Fluxos **desenhados** (muitos marcados ✅ no papel): [SYSTEM_FLOW.md](../architecture/SYSTEM_FLOW.md) — **não** usar como prova de que ingestão/Meilisearch/listings estão no ar.

### 9.1 Judge RAG (S01–S99)

`POST /runtime/judge/query` no FastAPI. No site, o BFF canônico em `main` é `POST /api/judge/query` (campo JSON obrigatório `tcg`; exige login / `resolveRulesAccess`). Não confundir com `/api/proxy/...` (não é o path medido em produção neste deploy).

Fluxo: middlewares → auth/rate limit Redis → `GameConfiguration` → cache semântico → `RagOrchestrator` → `HybridRetriever` (vetor + FTS) → LLM → `JudgeQueryResponse` (answer, confidence, sources, verdict).

### 9.2 Marketplace / LPC

Buyer: home/PDP RSC → BFF listings → Postgres `public` + RLS.  
Seller: acreditação CNPJ (`companies`). CPF-seller não é liquidez.  
Pagamento: Stripe Checkout/Connect, PIX, webhook. Frete: `freight_quote.py` → Melhor Envio.  
LPC só conta loop **sem** a equipe no meio.

### 9.3 Catálogo de produto

Cartas: Scryfall, pokemontcg.io, YGOPRODeck, etc.  
Selados: TCGCSV → CDN TCGplayer (doc de providers; adapters live podem não estar em `main`).  
Acessórios: Shopify/Woo/Shopware/Tray (mesmo aviso).  
Job: Product Catalog Sync + opcional Meilisearch.

### 9.4 Auth

Supabase GoTrue → cookie SSR → BFF encaminha Bearer → FastAPI fail-closed em prod.

---

## 10. Como um membro novo sobe o ambiente (único caminho confiável hoje)

### 10.1 Máquina

- Node 20+, npm 10+, Python 3.11+ (3.12/3.13 ok no CI da API).
- Postgres 16 + extensão `pgvector`, Redis 7.
- Opcional: Docker só para `postgres` + `redis` do `docker-compose.yml`.

### 10.2 API

```bash
cd services/api
cp .env.example .env
# DATABASE_URL local; REDIS_URL na porta que o Redis realmente usa
# OPENAI_API_KEY só se for testar RAG de verdade
python3 -m venv ../../.venv   # ou o venv do repo
source ../../.venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Provas mínimas:

- `GET http://127.0.0.1:8000/health` e `/v1/health`
- `GET http://127.0.0.1:8000/v1/games` (14 slugs do seed `infra/db/init.sql`)
- OpenAPI: `/docs`

Seed SQL (se o volume estiver vazio):

```bash
PGPASSWORD=tcgjudge_dev psql -h localhost -U tcgjudge -d tcg_judge -f infra/db/init.sql
# depois 02_* … 06_*.sql na mesma ordem do compose
```

### 10.3 Web

```bash
cp frontend/runtime_console_v3/.env.example frontend/runtime_console_v3/.env.local
# API_PROXY_TARGET=http://127.0.0.1:8000
# NEXT_PUBLIC_APP_URL=http://localhost:3000
# NEXT_PUBLIC_SUPABASE_* se for testar login
npm ci
npm run dev --workspace=runtime-console-v3
```

### 10.4 Testes (o que esperar)

Na raiz do frontend:

- `npm run lint --workspace=runtime-console-v3`
- `npm run type-check --workspace=runtime-console-v3`
- `npm run test --workspace=runtime-console-v3` (Vitest)

Na API, **não** rode `pytest` na raiz de `tests/` sem filtro: a suíte completa já abortou coleta por dois `test_intelligence.py` sem `__init__.py` (`tests/analytics/` e `tests/catalog/`). Use path:

```bash
cd services/api
pytest -q -m "not integration and not e2e and not smoke" tests/payments
```

`ruff check` e CI em `main` podem estar vermelhos **independentemente** do seu PR. Não use CI vermelho legado como prova de que seu diff quebrou o mundo — mas também não ignore falhas **no seu path**.

Playwright/e2e de marketplace precisam Supabase + API. Sem Render e sem secrets, **não** são o primeiro teste do onboarding.

---

## 11. Variáveis que importam (sem copiar secrets)

### BFF / Vercel (produção)

| Variável | Papel hoje |
|----------|------------|
| `API_PROXY_TARGET` | **Ainda default Render.** Enquanto for `seekguidance.onrender.com`, catalog_api = 404 |
| `NEXT_PUBLIC_SUPABASE_URL` / `ANON_KEY` | Auth e client |
| `SUPABASE_SERVICE_ROLE_KEY` | Health `card_catalog`, seeds e2e — **nunca** no browser |
| `UPSTASH_REDIS_REST_URL` / `TOKEN` | Único check verde no health |
| `NEXT_PUBLIC_CNPJ` / legal | Trust footer; não é liquidez |
| Stripe keys | Checkout morto sem API |

### FastAPI

| Variável | Papel |
|----------|--------|
| `DATABASE_URL` | `postgresql+asyncpg://…` |
| `REDIS_URL` | Rate limit + cache Judge |
| `ENVIRONMENT` | `production` = JWT obrigatório |
| `OPENAI_API_KEY` | RAG real |
| `PRODUCT_CATALOG_DATABASE_URL` | Sync de catálogo (job) |

Guia mais antigo ainda cita Render como destino: [SETUP_GUIDE.md](../../SETUP_GUIDE.md), [DEPLOY_RENDER_VERCEL.md](../DEPLOY_RENDER_VERCEL.md). **Trate-os como histórico de deploy, não como status.** Este arquivo vence quando houver conflito sobre “o que está no ar”.

---

## 12. Primeira semana (roteiro)

**Dia 1**

- Ler Constituição + ADR-012 + ADR-015 + North Star + **este** documento.
- Abrir https://judgetcg.com.br e ` /api/health` — confirmar 503 com os próprios olhos.
- Subir API + Redis + Postgres **local** e bater `/v1/games`.

**Dia 2**

- Seguir uma pergunta Judge no código: `runtime_judge` → orchestrator → `sql_retrieval.py` → `llm_openai.py`.
- Entender o BFF `api-proxy-base.ts` (timeouts).

**Dia 3**

- Caminhar PDP/home no código (RSC) e ver onde o fetch quebra sem API.
- Não “corrigir” produção com mock de LPC.

**Dia 4–5**

- Um bug **observado** no local (tipo, lint no seu módulo) **ou** documentação de incidente. Sem RFC, sem novo bounded context.

**Não no primeiro mês sem evidência + orçamento:** novo TCG LIVE, social, IA editorial, reabrir foundation, religar todos os crons.

---

## 13. Glossário curto

| Termo | Significado aqui |
|-------|------------------|
| BFF | Rotas `frontend/.../src/app/api/*` no Next, não a FastAPI |
| Judge | Assistente RAG de regras, não o marketplace |
| LPC | Prova de liquidez; hoje 0 |
| Beachhead | Lorcana R1, não “todos os TCGs do seed” |
| Overlay | [ADR-003](../architecture/adr/ADR-003-marketplace-overlay.md) — listing sobre carta canônica |
| Fail-closed | Produção recusa request sem JWT válido |
| Cold start | Demora do free Render ao acordar — **irrelevante** enquanto o serviço estiver suspenso |
| Platform freeze | Não congelar Checkout/Orders; congelar infra transversal |

---

## 14. Índice de leitura (depois deste arquivo)

| Quando | Documento |
|--------|-----------|
| Sempre | [PLATFORM_CONSTITUTION.md](../architecture/PLATFORM_CONSTITUTION.md) |
| Métrica | [NORTH_STAR_RELEASE_1.md](../product/NORTH_STAR_RELEASE_1.md) |
| Status gerado (desatualizado em datas) | [PROJECT_STATUS.md](../../PROJECT_STATUS.md) |
| ADRs | [adr/README.md](../architecture/adr/README.md) |
| Camadas de código | [ARCHITECTURE.md](../ARCHITECTURE.md) |
| Fluxos desenhados (não confundir com produção) | [SYSTEM_FLOW.md](../architecture/SYSTEM_FLOW.md) |
| Banco Judge | [DATABASE.md](../DATABASE.md) |
| DoD | [DEFINITION_OF_DONE.md](./DEFINITION_OF_DONE.md) |
| R4 | [EVIDENCE_RELEASE_R4.md](../operations/EVIDENCE_RELEASE_R4.md) |

---

## 15. Como atualizar este documento

Quando Render voltar **ou** o proxy mudar:

1. Repetir os curls da §1 (health, `/api/games`, `/v1/health` no upstream real).
2. Atualizar a tabela e o JSON.
3. Não apagar a seção de orçamento: os timeouts Vercel e o híbrido SQL continuam sendo o teto mesmo com API paga.

Não use métricas de `testing/reports/*` de julho/2026 como se fossem o estado de hoje.

---

## 16. Fluxograma Visio das consultas

Para transpor **todas** as consultas deste documento no Microsoft Visio:

| Arquivo | Caminho |
|---------|---------|
| Visio | [`docs/architecture/visio/JudgeTCG_Onboarding_Consultas.vsdx`](../architecture/visio/JudgeTCG_Onboarding_Consultas.vsdx) |
| Excel (Visualizador de Dados) | [`docs/architecture/visio/JudgeTCG_Onboarding_Consultas.xlsx`](../architecture/visio/JudgeTCG_Onboarding_Consultas.xlsx) |
| Como importar | aba `Como_importar_Visio` no Excel; guia [`visio/README.md`](../architecture/visio/README.md) |

Abas Visio: Legenda, Foto produção, Health BFF, Proxy Render, Games, Judge BFF, Judge RAG, Dois bancos, Auth, Marketplace, Catálogo, Stack local, Crons orçamento, Inventário.

