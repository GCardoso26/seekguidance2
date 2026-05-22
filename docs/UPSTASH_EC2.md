# Redis Upstash na EC2 (reduzir custos AWS)

Com **Postgres no Supabase**, o Redis local na EC2 (`tcg-judge-redis`) só serve **workers arq** (ingestão em fila). O **Judge/RAG** (`/runtime/judge/query`) **não precisa** de Redis.

## Mapa de custos

| Componente | Antes (AWS) | Depois |
|------------|-------------|--------|
| Postgres | RDS | **Supabase** (já feito) |
| Redis | Container EC2 + disco | **Upstash** (free tier generoso) |
| API | EC2 | EC2 (ou Render depois) |
| Site | EC2/Caddy | Vercel (opcional) |

**Podes desligar:** RDS, ElastiCache (se existir), container `tcg-judge-redis` na EC2.

---

## 1. Criar Redis no Upstash

1. [console.upstash.com](https://console.upstash.com) → **Create database**
2. Região: **us-east-1** ou mais próxima da EC2 (`sa-east-1` se disponível)
3. Copia a URL **TLS** (começa por `rediss://`):

```env
REDIS_URL=rediss://default:SEU_TOKEN@xxxx.upstash.io:6379
```

> Usa a URL **com TLS** (`rediss://`), não a sem TLS, para workers a partir da internet.

---

## 2. Atualizar `.env.production` na EC2

```bash
nano ~/seekguidance2/.env.production
```

Garante (exemplo):

```env
DATABASE_URL=postgresql+asyncpg://postgres.PROJECT:PASSWORD@aws-1-sa-east-1.pooler.supabase.com:5432/postgres
DATABASE_SSL=require
REDIS_URL=rediss://default:TOKEN@xxxx.upstash.io:6379
OPENAI_API_KEY=sk-...
RUNTIME_AUTH_SECRET=...
```

**Não** uses `redis://redis:6379/0` (isso aponta para o container local).

---

## 3. Parar Redis local e subir só API (+ worker se precisares)

```bash
cd ~/seekguidance2
git pull   # traz compose sem redis obrigatório + arq rediss://

docker stop tcg-judge-redis 2>/dev/null || true
docker rm tcg-judge-redis 2>/dev/null || true

unset DATABASE_URL RUNTIME_DATABASE_URL REDIS_URL SUPABASE_URL

docker compose -f docker-compose.production.yml --env-file .env.production up -d api --force-recreate

# Opcional: fila de ingestão
docker compose -f docker-compose.production.yml --env-file .env.production up -d worker --force-recreate
```

Confirma:

```bash
docker exec tcg-judge-api printenv REDIS_URL | head -c 40
# rediss://default:...

curl -s "http://localhost:8000/v1/games" | python3 -m json.tool | head -5
```

---

## 4. Testar worker (opcional)

```bash
docker logs tcg-judge-worker --tail 20
```

Se o worker não arrancar com SSL, confirma `rediss://` na URL e faz `git pull` (suporte TLS em `arq_worker.py`).

---

## 5. Desligar custos AWS

| Recurso | Acção |
|---------|--------|
| **RDS** `judge-tcg-db` | Stop ou delete (dados já no Supabase) |
| **EC2** | Manter só se quiseres API aí; senão migrar API → Render e **terminar** instância |
| **Elastic IP** | Libertar se libertares a EC2 |
| **ElastiCache** | Delete se existir |
| **Secrets Manager** | Opcional manter ou apagar |

---

## MVP sem worker na EC2

Se **não** corres ingestão na EC2:

```bash
docker compose -f docker-compose.production.yml --env-file .env.production up -d api
# Sem serviço worker
```

`REDIS_URL` pode ser a URL Upstash (a API só exige a variável no arranque; cache semântico MVP é in-memory).

---

## Migrar API para fora da EC2 (zero EC2)

Ver `docs/SUPABASE_MIGRATION.md` fases 4–5: **Render/Fly** + **Vercel** + Supabase + Upstash → podes **desligar a EC2** por completo.

---

## Troubleshooting

| Sintoma | Solução |
|---------|---------|
| API usa `redis://redis:6379` | Remove `REDIS_URL: ${REDIS_URL}` do compose; só `env_file` |
| Worker não liga | URL `rediss://` + token correcto |
| Shell sobrescreve env | `unset REDIS_URL DATABASE_URL` antes do `docker compose` |
