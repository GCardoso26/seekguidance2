# Deploy: backend Render + front Vercel

Este monorepo tem a **API FastAPI** em `services/api/` (Dockerfile com contexto na **raiz** do repo) e HTML estático em `apps/`.

## 1. Pré-requisitos

- Conta [Render](https://render.com) e [Vercel](https://vercel.com).
- **PostgreSQL** e **Redis** acessíveis pela API (Render Postgres/Redis, ou Neon/Upstash, etc.).
- A API exige `DATABASE_URL` e `REDIS_URL` (ver `services/api/app/core/config.py` e `.env.example`).

## 2. Backend (Render)

### Opção A — Blueprint (`render.yaml`)

1. No Render: **New + Blueprint**, liga o repositório.
2. Confirma que o serviço web usa:
   - **Dockerfile**: `services/api/Dockerfile`
   - **Docker build context**: `.` (raiz do repositório)
3. Na dashboard do serviço, define as variáveis (mínimo):
   - `DATABASE_URL` — URL async Postgres compatível com `asyncpg` (ex.: `postgresql+asyncpg://...`).
   - `REDIS_URL` — ex.: `redis://red-xxxxx:6379/0`
4. Opcional: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, etc., conforme `.env.example`.
5. Garante **região** e **plano** adequados ao tráfego; o blueprint usa `frankfurt` e `starter` como exemplo (ajusta se precisares).

### Opção B — Web Service manual

1. **New + Web Service**, repositório Git, ambiente **Docker**.
2. **Root directory**: vazio (raiz) ou raiz do monorepo.
3. **Dockerfile path**: `services/api/Dockerfile`
4. **Docker build context**: `.` (importante: o Dockerfile faz `COPY services/ingestion` e `COPY services/api/...`).
5. **Port**: `8000` (igual ao `EXPOSE` do Dockerfile).
6. Adiciona as mesmas variáveis de ambiente.

### URL pública

Após o deploy, anota a URL (ex.: `https://tcg-judge-api.onrender.com`). Usa-a na Vercel (CORS já permite `*` no MVP; em produção podes restringir origens no código).

## 3. Front (Vercel)

1. Na Vercel: **Add New Project** → importa o **mesmo** repositório.
2. **Root Directory**: `apps`
3. **Framework Preset**: Other (ou “Other” sem framework).
4. **Build Command**: deixa vazio ou o valor em `apps/vercel.json` (`echo 'static html'`).
5. **Output Directory**: `.` (ponto), alinhado com `vercel.json`.
6. Deploy: os HTML ficam servidos em caminhos como `/judge_replay/replay.html`, `/judge_console/index.html`, etc.

### Ligar o front à API

Os HTML atuais são maioritariamente stubs sem cliente JS configurado por variável. Quando integrares chamadas `fetch`:

- Define na Vercel uma variável pública, por exemplo `NEXT_PUBLIC_API_BASE_URL` ou `VITE_API_BASE_URL`, **consoante** o bundler que usares; ou injeta URL no build.
- Usa sempre **HTTPS** e o domínio Render da API.

## 4. Ordem recomendada

1. Criar Postgres + Redis e obter URLs.
2. Deploy da API no Render com `DATABASE_URL` e `REDIS_URL`.
3. Verificar `GET https://<api>/` e `GET https://<api>/docs`.
4. Deploy do diretório `apps` na Vercel.
5. (Opcional) Restringir CORS no FastAPI a `https://<teu-projeto>.vercel.app`.

## 5. Problemas comuns

- **Build Docker falha**: contexto não é a raiz do monorepo → o `COPY services/...` falha.
- **API a sair unhealthy**: falta `DATABASE_URL`/`REDIS_URL` ou base inacessível a partir do Render.
- **502 na Vercel**: Root Directory errado (tem de ser `apps`, não a raiz do monorepo, para este layout).
