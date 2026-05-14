# TCG Judge

Monorepo do **TCG Judge** — aplicativo multiplataforma (Android / iOS) com backend **FastAPI**, **PostgreSQL + pgvector**, **Redis**, ingestão modular de regras oficiais e arquitetura **RAG** provider-agnostic.

**Local do projeto:** `S:\tcg-judge`

## Escolha mobile: Expo (React Native) vs Flutter

**Decisão: React Native + Expo SDK 54**

| Critério | Expo / RN | Flutter |
|----------|-----------|---------|
| Ecossistema TCG (web companions, libs JS, tooling) | Forte | Bom |
| Time-to-market MVP + OTA (EAS Update) | Muito forte | Bom |
| Web admin compartilhando tipos (OpenAPI → TS) | Natural | Dart separado |
| Performance gráfica máxima | Muito boa | Ligeira vantagem em shaders |
| Contratação / manutenção | Ampla base RN | Base Dart menor |

Para um produto com **painel admin web**, **OpenAPI**, **event-driven** e equipes web-heavy, **Expo** reduz atrito e acelera iteração. Flutter permanece alternativa documentada em `docs/MOBILE_STRATEGY.md`.

## Estrutura de pastas

```
S:\tcg-judge
├── apps/mobile          # Expo Router, tema escuro + glassmorphism leve
├── services/api         # FastAPI, Clean-ish layers, RAG orchestrator (MVP)
├── services/ingestion   # Contratos de crawlers por TCG (extensível)
├── infra/db             # init.sql (schema tcg_judge + seeds dos 10 jogos)
├── docs/                # Arquitetura, RAG, roadmap, custos, wireframes
├── .github/workflows    # CI (API + mobile typecheck)
└── docker-compose.yml   # Postgres(pgvector) + Redis + API
```

## Quickstart

### 1. Banco e cache (Docker)

```powershell
cd S:\tcg-judge
docker compose up -d postgres redis
```

O Redis do compose usa a porta **6380** no Windows (mapeamento `6380:6379`) para não colidir com outro serviço que já use **6379**. Na API rodando no host, use `REDIS_URL=redis://localhost:6380/0` (já refletido em `.env.example`).

### 2. API (local)

```powershell
cd S:\tcg-judge\services\api
copy .env.example .env
# Ajuste DATABASE_URL se necessário
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

- Docs OpenAPI: http://127.0.0.1:8000/docs  
- Health: `GET /v1/health`  
- Jogos: `GET /v1/games`  
- Chat (stub RAG): `POST /v1/chat/ask` com JSON `{ "game_slug": "mtg", "question": "...", "mode": "player" }`

### 3. Mobile (Expo)

```powershell
cd S:\tcg-judge\apps\mobile
npm install
npx expo start
```

## Aviso legal (produto)

O app deve **sempre** exibir a frase configurável (já prevista na API e nas telas mock):

> Informações obtidas diretamente das regras oficiais publicadas pela publisher.

Ingestão deve respeitar **ToS**, **robots.txt**, **rate limits** e **direitos autorais** — preferir links oficiais, PDFs autorizados e acordos de dados quando existirem.

## Documentação detalhada

| Documento | Conteúdo |
|-----------|----------|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Serviços, eventos, diagramas |
| [docs/DATABASE.md](docs/DATABASE.md) | Esquema Postgres / pgvector |
| [docs/RAG_STRATEGY.md](docs/RAG_STRATEGY.md) | Chunking, híbrido, rerank |
| [docs/INGESTION.md](docs/INGESTION.md) | Crawlers, scheduler, diff |
| [docs/MVP.md](docs/MVP.md) | Plano MVP |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Fases pós-MVP |
| [docs/COSTS.md](docs/COSTS.md) | Estimativa de custos |
| [docs/WIREFRAMES.md](docs/WIREFRAMES.md) | Wireframes ASCII |
| [docs/MOBILE_STRATEGY.md](docs/MOBILE_STRATEGY.md) | Publicação stores, EAS |
| [docs/CI_CD.md](docs/CI_CD.md) | GitHub Actions e releases |

## Licença

Proprietário / a definir pelo time.
