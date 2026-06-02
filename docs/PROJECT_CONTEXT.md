# Contexto técnico do projeto — Judge TCG / TCG Judge Platform

Documento de referência para planeamento de novos escopos. Última atualização alinhada ao estado do repositório após commits `9686243`–`3a714c9` (maio 2026).

---

## 1. Visão do produto

### 1.1 O que é

**Judge TCG** (`judgetcg.com.br`) é um assistente de regras para Trading Card Games (TCGs). O utilizador escolhe um jogo, faz uma pergunta em linguagem natural e recebe:

- **Resposta** em português (modo `player`)
- **Veredito** estruturado (Permitido / Não permitido / Depende / Informação, etc.)
- **Fontes** oficiais (título, URL, secção, `rule_path`, número de página quando disponível)
- **Confiança** — score de qualidade do *retrieval*, não probabilidade de “estar certo” juridicamente

O produto público vive na rota **`/judge`** do **Runtime Console v3** (Next.js). A API é FastAPI; o corpus de regras está em **PostgreSQL + pgvector** (Supabase em produção).

### 1.2 O que o monorepo contém além do Judge

O repositório (`seekguidance2/main`, path local típico `S:\tcg-judge`) é um **monorepo grande** com:

| Área | Caminho | Papel |
|------|---------|--------|
| API principal | `services/api/` | FastAPI: RAG, auth, runtime operacional, replay, mobile stubs |
| Ingestão | `services/ingestion/` | PDF → parse → chunk → embeddings |
| Frontend operacional | `frontend/runtime_console_v3/` | Next.js 14 — Judge + dashboard/replay/incidents |
| Apps legados / mobile | `apps/` | HTML consoles, Flutter/RN SDKs, submódulo `apps/mobile` |
| Infra | `infra/` | AWS EKS, Terraform, observabilidade, DR |
| Dados | `data/ingest/` | PDFs locais (ex.: Sorcery) |
| Supabase | `supabase/migrations/` | Schema `tcg_judge` |
| Scripts | `scripts/` | ingestão, EC2, e2e |
| Documentação | `docs/` | Centenas de guias (runtime enterprise + Judge) |

**Distinção importante:** grande parte de `docs/` e `services/api/generated/` descreve uma **plataforma runtime enterprise** (replay, certificação, governance v30+). O **produto em produção focado no utilizador** é o **Judge** + consola operacional mínima; o resto é plataforma interna, stubs ou artefactos de CI local.

### 1.3 Domínios e deploy atual (produção)

| Componente | Plataforma | URL típica |
|------------|------------|------------|
| API | **Render** (Docker) | `https://seekguidance.onrender.com` |
| Frontend | **Vercel** (root `frontend/runtime_console_v3`) | domínio custom → `judgetcg.com.br` |
| Base de dados | **Supabase** (Postgres + pgvector) | pooler `aws-*-sa-east-1` |
| Cache / rate limit | **Redis** (Upstash ou equivalente) | `REDIS_URL` |

Deploy alternativo documentado: **EC2 + Caddy + Docker** (mesmo origin, proxy `/api/proxy` → API local). Ver `docs/DOMAIN_JUDGETCG.md`, `docs/DEPLOY_RENDER_VERCEL.md`.

---

## 2. Linha temporal (evolução relevante)

| Fase | Commits / marco | Entregas |
|------|-----------------|----------|
| Base deploy | `d15a20d` … `e88ff8e` | Guias Render/Vercel, proxy Vercel → API, fix Supabase SSL |
| UI Judge v1 | `e567516`, `34ede94` | Tema TCG+, chips de jogos, respostas pt-BR |
| Multi-TCG ingest | `8916a45` | Catálogo 12+ jogos, `scripts/ingest_tcg.py`, fix DSN `#` na senha |
| UX Judge v2 | `a1a52f3`, `81c6270` | Exemplos, histórico, veredito, **SSE streaming**, threads por jogo, deep links `?game=&q=` |
| API Judge v1 | `1158367` | `GET /runtime/judge/games`, `/health`, rate limit, `rule_path` nas fontes |
| Segurança P0 | `9686243` | Auth global, tenant isolation, BFF cookies HttpOnly, CSP, RBAC |
| Hotfix produção | `1df0145` | `client_key(..., trust_proxy=...)` — corrigiu login 500 |
| Confiança por jogo | `6933b5c` | `confidence_profiles.py`, `top1_fused`, limiar UI por `game_slug` |
| Higiene repo | `3a714c9` | `.gitignore` para `generated/`, `var/`, `*.pem` |

---

## 3. Arquitetura em runtime (produção Vercel + Render)

```text
Browser (judgetcg.com.br)
    │
    ├─ GET/POST /judge                    → Next.js (Vercel)
    │
    ├─ /api/proxy/*                       → rewrite/proxy → Render API (rotas públicas Judge)
    │       └─ /runtime/judge/query
    │       └─ /runtime/judge/query/stream
    │       └─ /runtime/judge/games|health
    │
    └─ /api/bff/*, /api/auth/login|logout → Route Handlers Next (cookies HttpOnly)
            └─ server-side fetch → Render API (/auth/*, rotas operacionais autenticadas)

Render API (FastAPI :8000)
    ├─ PostgreSQL (Supabase) — chunks, embeddings, games, users
    ├─ Redis — rate limit, JWT revocation (jti)
    └─ OpenAI — embeddings + chat (gpt-4o-mini default)
```

### 3.1 Fluxo de uma pergunta Judge

1. `JudgePageClient` → `askJudgeQuestion` ou `askJudgeQuestionStream` (`src/services/judgeApi.ts`)
2. Browser chama `POST /api/proxy/runtime/judge/query` (rota pública)
3. Vercel encaminha para `API_PROXY_TARGET` + path
4. `runtime_judge.py` normaliza `tcg` → `game_slug`, compõe pergunta com `context` (thread)
5. `RagOrchestrator.ask()` — retrieval híbrido + LLM com `verdict_format=True`, `mode="player"`
6. Resposta JSON ou SSE (`token` + `done`)

### 3.2 Autenticação (consola operacional vs Judge público)

| Superfície | Auth | Notas |
|------------|------|-------|
| Judge `/runtime/judge/*` | **Pública** (rate limit IP) | Sem cookie; `publicRoute: true` no client |
| Login consola | `POST /api/auth/login` → cookies | Access + refresh HttpOnly; Zustand só guarda flags, não tokens |
| API operacional | JWT / API key | `tenant_id` só do token; body/query ignorados (`tenant.py`) |
| Produção | `SECURITY_PROTECT_OPERATIONAL_ROUTES=true` | Backup, metrics, replay exigem RBAC |

---

## 4. Estrutura do monorepo (mapa para escopo)

```text
tcg-judge/
├── services/
│   ├── api/                    # FastAPI — núcleo
│   │   ├── app/
│   │   │   ├── api/v1/         # routers HTTP
│   │   │   ├── application/    # RagOrchestrator, casos de uso
│   │   │   ├── retrieval/      # pipeline, confidence, rerank
│   │   │   ├── judge/          # catálogo, registry tcg↔slug
│   │   │   ├── core/           # config, rate_limit, security/
│   │   │   ├── mobile_runtime/ # stubs payloads mobile (muitos módulos)
│   │   │   └── ...
│   │   ├── tests/
│   │   ├── generated/          # artefactos runtime CI (NÃO commitar)
│   │   └── var/                # sqlite replay local (NÃO commitar)
│   └── ingestion/
│       └── tcg_judge_ingestion/
├── frontend/runtime_console_v3/
├── apps/                       # legado HTML + mobile submodule
├── supabase/migrations/
├── scripts/ingest_tcg.py
├── docs/                       # este ficheiro + 400+ guias
└── infra/                      # AWS / EKS / DR
```

---

## 5. Backend — módulos e responsabilidades

### 5.1 Entrypoint e routers (`app/main.py`)

| Router | Prefixo / tags | Função |
|--------|----------------|--------|
| `api_router` | `/v1/*` | Chat, health, auth legado |
| `runtime_judge_router` | `/runtime/judge/*` | **Produto Judge** |
| `runtime_minimal_router` | `/runtime/*` | Replay mínimo, tenant-aware |
| `runtime_operational_router` | operacional | Incidents, pilot, métricas |
| `runtime_deployments_router` | deployments | Releases / hashes |

**Middlewares (ordem relevante):** CORS → HTTPS redirect → safe exceptions → operational guard → security headers → redacted logging → **rate limit** (buckets: `chat`, `judge`, `replay`, `auth_login`).

### 5.2 Configuração (`app/core/config.py`)

Variáveis críticas:

| Variável | Uso |
|----------|-----|
| `DATABASE_URL` | `postgresql+asyncpg://...` (obrigatório) |
| `REDIS_URL` | Rate limit + revogação JWT |
| `OPENAI_API_KEY` | Embeddings + chat |
| `RAG_ALLOWED_GAME_SLUGS` | Lista de jogos com RAG activo |
| `JUDGE_RATE_LIMIT_*` | 24 req/min default |
| `JUDGE_TRUST_PROXY_HEADERS` | `true` atrás Vercel/Render |
| `RUNTIME_AUTH_SECRET` | JWT (≥32 chars em produção) |
| `CORS_ALLOWED_ORIGINS` | Sem `*` em produção |
| `RERANKER_ENABLED` | `false` default — activar melhora confiança |
| `confidence_low_threshold` | 0.42 global; perfis por jogo sobrepõem UI |

### 5.3 RAG (`app/application/rag_orchestrator.py` + `app/retrieval/`)

Pipeline judge-grade (resumo):

1. Resolver `game` em Postgres (`games.slug`)
2. **Retrieval híbrido:** vector (pgvector) + BM25 + RRF opcional
3. Diversificação por capítulo/documento, dedup, expansão por `rule_graph_edges`
4. Reranker opcional (`BAAI/bge-reranker-large`)
5. Montagem de contexto com orçamento de tokens
6. LLM com formato veredito (`verdict`, `rule_applied`, `explanation`, `exceptions`)
7. **Confiança** calculada em `confidence.py` com perfil `get_confidence_profile(game_slug)`

Sinais de confiança recentes: `vec_lex_overlap`, `top1_fused`, `n_rule_sources`, spread, rerank score.

### 5.4 Segurança (`app/core/security/`)

| Módulo | Função |
|--------|--------|
| `middleware.py` | HTTPS, HSTS, CSP, auth em rotas operacionais |
| `tenant.py` | `assert_tenant_access`, extrair tenant do JWT |
| `rbac.py` | Roles: admin, operator, replay, etc. |
| `crypto.py` | bcrypt, AES-GCM at-rest, hash API keys |
| `redaction.py` | Mascarar secrets em logs/respostas |
| `paths.py` | Allowlist restore backup (anti path traversal) |
| `token_revocation.py` | Redis `tcg:revoked:{jti}` |

Validação: `docs/SECURITY_VALIDATION.md`.

### 5.5 API Judge (`app/api/v1/runtime_judge.py`)

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `/runtime/judge/health` | DB, OpenAI, jogos com corpus |
| GET | `/runtime/judge/games` | Catálogo + `chunk_count`, `rag_ready`, limiar confiança |
| POST | `/runtime/judge/query` | Consulta síncrona |
| POST | `/runtime/judge/query/stream` | SSE tokens + payload final |

Body: `{ "tcg": "magic", "question": "...", "context": "..." }`.

Mapeamento TCG: `app/judge/registry.py` (`magic` → `mtg`, etc.). `swu` → coming soon.

---

## 6. Dados — Supabase / Postgres

Schema principal: `supabase/migrations/20260519000000_init_tcg_judge.sql` (schema `tcg_judge`).

| Tabela | Papel |
|--------|--------|
| `tenants` | Multi-tenant |
| `games` | `slug` (mtg, pokemon, …), `enabled` |
| `documents` / `document_versions` | PDFs oficiais versionados |
| `chunks` | Texto, `embedding`, `rule_path`, FTS GIN |
| `rule_graph_edges` | Expansão semântica entre regras |
| `users` | Auth consola (bcrypt) |
| `conversations` / `messages` | Chat persistente (não é o thread Judge local) |
| `ingestion_jobs` | Estado de ingestão |
| `retrieval_feedback` | Loop de avaliação |

Índice HNSW em embeddings: comentado na migration — activar conforme volume.

---

## 7. Ingestão de corpus

- **CLI:** `python scripts/ingest_tcg.py --game <slug> --all`
- **Catálogo fontes:** `services/ingestion/tcg_judge_ingestion/crawler/tcg_official_sources.py`
- **Jogos documentados:** mtg, pokemon, lorcana, yugioh, onepiece, fab, digimon, gundam, dbfw, sorcery (PDF local), vanguard, riftbound, union_arena
- **Env:** `DATABASE_URL` (asyncpg), `OPENAI_API_KEY`; ver `docs/INGEST_TCG_MULTI.md`
- **Pitfall conhecido:** `#` na senha Supabase → URL-encode; DSN normalizado em `storage/dsn.py`

Sem chunks indexados → `rag_ready: false` no catálogo; Judge pode falhar ou usar mock limitado (ex.: trample MTG).

---

## 8. Frontend — Runtime Console v3

### 8.1 Stack

Next.js 14, React 18, TypeScript, Tailwind, Radix, Zustand, TanStack Query, Vitest.

### 8.2 Judge (`src/app/judge/`, `src/components/judge/`)

| Funcionalidade | Implementação |
|----------------|---------------|
| Seleção TCG | `TcgSelector` + catálogo API + cores `tcg-brand.ts` |
| Pergunta | `QuestionInput`, exemplos `judge-examples.ts` |
| Resposta | `ResponseCard` + parse veredito `judge-verdict.ts` |
| Fontes | `SourceCard`, highlight `highlight-excerpt.ts` (HTML escapado) |
| Histórico local | `judge-history.ts` — 10 entradas `localStorage` |
| Thread por jogo | `judge-thread.ts` — contexto enviado no body |
| Deep link | `judge-url.ts` — `?game=&q=` |
| Streaming | `judgeApi.ts` — SSE com fallback para POST síncrono |
| Confiança UI | `judge-confidence.ts` — aviso abaixo do limiar da API |
| Tema por TCG | `theme.ts`, `judge-tcg.css` |
| Partilha | `ShareVerdictButton` |

### 8.3 Proxy e env frontend

| Variável | Ambiente |
|----------|----------|
| `API_PROXY_TARGET` | URL Render (server-side + build) |
| `NEXT_PUBLIC_APP_URL` | Canonical público |

Rotas API Next:

- `src/app/api/auth/login|logout|api-key/route.ts`
- `src/app/api/bff/[...path]/route.ts` — autenticado
- Proxy público: rewrites em `next.config.mjs` / `vercel.json` → `/api/proxy`

### 8.4 Outras páginas (escopo operacional)

`/dashboard`, `/replay`, `/incidents`, `/observability`, `/tenants`, `/login` — consola interna; dependem de auth BFF.

---

## 9. Conceitos de domínio (para novos escopos)

### 9.1 Veredito vs confiança

| Conceito | Origem | Significado |
|----------|--------|-------------|
| **Veredito** | LLM (`verdict`, `rule_applied`, …) | Decisão interpretativa da pergunta |
| **Confiança** | `confidence.py` + perfil por jogo | Qualidade do retrieval (overlap, fused, fontes distintas) |
| **Limiar UI** | `confidence_notice_threshold` | Aviso “baixa confiança” — não bloqueia resposta |

MTG: corpus EN + perguntas PT → overlap baixo comum; perfil `_MTG` reduz peso de overlap e aumenta `top1_fused`.

### 9.2 `tcg` (UI) vs `game_slug` (DB)

Sempre normalizar via `registry.py`. Novos jogos exigem: migration/seed `games`, ingestão, entrada em `TCG_GAME_SLUG`, perfil de confiança opcional, assets frontend `tcg-brand.ts`.

### 9.3 Runtime platform vs Judge product

Commits e pastas `generated/runtime_artifacts/**` reflectem motores de certificação/replay **internos**. Não confundir com roadmap do Judge público unless o escopo for explicitamente “runtime enterprise”.

---

## 10. Estado actual do repositório (maio 2026)

### 10.1 Branch e commits prontos para remoto

```
3a714c9 chore: ignora artefactos runtime locais e chaves PEM
6933b5c feat(judge): confiança calibrada por jogo
1df0145 fix(api): rate limit trust_proxy
9686243 Segurança P0
```

### 10.2 Working tree limpa (após higiene)

- Modificado pendente de decisão: `services/ingestion/.../storage/dsn.py`
- Untracked: dezenas de `docs/*.md` operacionais, consoles HTML `apps/admin_console_v2/`, módulos `executable_real_*_v33/`
- **Nunca commitar:** `*.pem`, chaves SSH, `.env` com secrets

### 10.3 Incidentes produção resolvidos

| Incidente | Causa | Fix |
|-----------|-------|-----|
| Login 500 | `TypeError: client_key(..., trust_proxy)` | `1df0145` |
| Proxy Vercel | DNS/rewrites, `API_PROXY_TARGET` | commits `9efecb7`–`e88ff8e` |

---

## 11. Testes e qualidade

```bash
# API — segurança + judge
cd services/api && pytest tests/core/test_security.py tests/runtime_judge -q

# Frontend
cd frontend/runtime_console_v3 && npm run test && npm run lint
```

Evaluation judge-grade: `services/api/evaluation/judge_grade_datasets_v3|v4/` (datasets, não CI obrigatório no deploy MVP).

---

## 12. Pendências e dívidas técnicas conhecidas

| Item | Prioridade | Notas |
|------|------------|-------|
| `RERANKER_ENABLED=true` em produção | Média | Melhora confiança; custo CPU/GPU |
| Next.js 14 → versão com patches segurança | Média | `npm audit` |
| Rotacionar secrets se vazaram no Git | Alta se aplicável | Supabase, OpenAI |
| Star Wars Unlimited (`swu`) | Produto | `TCG_COMING_SOON` |
| Indexação completa todos os jogos | Dados | Depende ingestão EC2/local |
| Unificar proxy: só `/api/bff` vs `/api/proxy` | Baixa | Judge público vs consola |
| Mobile app (`apps/mobile` submodule) | Escopo separado | SDK + sync offline |
| Runtime enterprise docs vs produto | Gestão | Evitar scope creep |

---

## 13. Matriz de candidatos a novos escopos

Use esta tabela para priorizar PRs/epics. Cada linha é independente.

| Epic | Valor utilizador | Dependências | Complexidade |
|------|------------------|--------------|--------------|
| **P1 — Qualidade RAG MTG/Pokemon** | Alta | Ingestão CR completa, reranker | Média |
| **P1 — Auth Judge (contas, histórico cloud)** | Média | Supabase Auth ou users existentes | Média |
| **P1 — Observabilidade Judge** | Ops | OTEL/Prometheus já parcial | Baixa–Média |
| **P2 — Novo TCG (SWU)** | Média | Fontes oficiais + ingest | Média |
| **P2 — Feedback utilizador (👍/👎)** | Média | `retrieval_feedback` table | Baixa |
| **P2 — Admin ingestão UI** | Ops | `ingestion_jobs` | Alta |
| **P2 — i18n EN** | Baixa–Média | Prompts + UI | Média |
| **P3 — Mobile judge offline** | Alta longo prazo | `apps/mobile`, edge runtime | Muito alta |
| **P3 — Runtime certification CI** | Interno | `generated/`, replay | Muito alta |
| **P3 — EC2-only deploy** | Ops | Caddy scripts | Média (legado) |

---

## 14. Ficheiros-chave (referência rápida)

| Área | Path |
|------|------|
| Judge API | `services/api/app/api/v1/runtime_judge.py` |
| RAG | `services/api/app/application/rag_orchestrator.py` |
| Confiança | `services/api/app/retrieval/confidence.py`, `confidence_profiles.py` |
| TCG registry | `services/api/app/judge/registry.py` |
| Config | `services/api/app/core/config.py` |
| Segurança | `services/api/app/core/security/*` |
| Rate limit | `services/api/app/core/rate_limit.py` |
| Judge UI page | `frontend/runtime_console_v3/src/app/judge/JudgePageClient.tsx` |
| API client | `frontend/runtime_console_v3/src/services/api/client.ts` |
| Judge client | `frontend/runtime_console_v3/src/services/judgeApi.ts` |
| Auth routes | `frontend/runtime_console_v3/src/app/api/auth/*` |
| Ingest CLI | `scripts/ingest_tcg.py` |
| Schema DB | `supabase/migrations/20260519000000_init_tcg_judge.sql` |
| Deploy | `docs/DEPLOY_RENDER_VERCEL.md`, `docs/DOMAIN_JUDGETCG.md` |
| Segurança doc | `docs/SECURITY_VALIDATION.md` |
| UI doc | `docs/JUDGE_FRONTEND_UI.md` |

---

## 15. Variáveis de ambiente — checklist produção

**API (Render):**

```env
ENVIRONMENT=production
DATABASE_URL=postgresql+asyncpg://...
REDIS_URL=redis://...
OPENAI_API_KEY=sk-...
RUNTIME_AUTH_SECRET=<32+ chars>
CORS_ALLOWED_ORIGINS=https://judgetcg.com.br
SECURITY_FORCE_HTTPS=true
SECURITY_PROTECT_OPERATIONAL_ROUTES=true
JUDGE_TRUST_PROXY_HEADERS=true
API_DOCS_ENABLED=false
```

**Frontend (Vercel):**

```env
API_PROXY_TARGET=https://seekguidance.onrender.com
NEXT_PUBLIC_APP_URL=https://judgetcg.com.br
```

---

## 16. Como usar este documento

1. **Definir escopo:** escolher linha(s) da secção 13 e validar dependências (dados, auth, infra).
2. **Evitar:** incluir `generated/` ou `var/` em PRs; misturar runtime enterprise com Judge sem epic separado.
3. **Atualizar:** após cada epic mergeado, acrescentar subsecção em §2 (linha temporal) e ajustar §10–§12.

Documentos relacionados: `docs/JUDGE_FRONTEND_UI.md`, `docs/INGEST_TCG_MULTI.md`, `docs/SECURITY_VALIDATION.md`, `docs/SUPABASE_MIGRATION.md`.
