# Deploy produção na EC2 (docker-compose.production.yml)

Stack: **API** (runtime pilot + RAG) + **worker** + **Redis** local. **Postgres = RDS** (não sobe container postgres em produção).

## Pré-requisitos na EC2

1. Ubuntu com Docker e plugin Compose v2
2. IAM role na instância com:
   - `secretsmanager:GetSecretValue` no secret `tcg-judge/production/api`
   - `kms:Decrypt` (via Secrets Manager)
3. Security Group:
   - Inbound **22** (SSH) — só o seu IP
   - Inbound **8000** (API) — restringir em produção; ideal: ALB + HTTPS
   - RDS: SG do RDS permite **5432** a partir do SG da EC2
4. Repositório clonado, ex.: `~/seekguidance2`

## Bootstrap (uma vez)

```bash
cd ~/seekguidance2
chmod +x scripts/ec2/*.sh
./scripts/ec2/bootstrap_ec2.sh
# se instalou docker agora: logout/login ou newgrp docker
```

## Secret no AWS Secrets Manager

JSON esperado (mínimo):

```json
{
  "DATABASE_URL": "postgresql+asyncpg://USER:PASS@judge-tcg-db....rds.amazonaws.com:5432/tcg_judge",
  "OPENAI_API_KEY": "sk-...",
  "REDIS_URL": "redis://redis:6379/0",
  "RUNTIME_AUTH_SECRET": "valor-longo-aleatorio"
}
```

Opcional: `RUNTIME_DATABASE_URL` em `postgresql://` (sem `+asyncpg`) para persistência runtime com psycopg.

**Senha com caracteres especiais:** use URL-encoding na password (`@`, `#`, etc.).

## Espaço em disco (EC2 pequena)

Se o build falhar com `no space left on device`:

```bash
./scripts/ec2/free_disk.sh
export SKIP_WORKER_BUILD=1   # só API (menos espaço); worker depois
./scripts/ec2/start-api.sh
```

## Deploy

```bash
cd ~/seekguidance2
git pull origin main   # ou sua branch

./scripts/ec2/start-api.sh
```

Equivalente manual:

```bash
./scripts/ec2/load_secrets.sh          # gera .env.production
./scripts/ec2/deploy_production.sh     # build + up + healthcheck
```

## Verificação

```bash
./scripts/ec2/healthcheck.sh
curl -s http://127.0.0.1:8000/health | jq .
curl -s http://127.0.0.1:8000/runtime/health | jq .
curl -s -X POST http://127.0.0.1:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'

# RAG MTG (rota correta: /v1/chat/ask, não /v1/chat)
curl -s -X POST http://127.0.0.1:8000/v1/chat/ask \
  -H "Content-Type: application/json" \
  -d '{"game_slug":"mtg","question":"How does trample work?","mode":"player"}'
```

## Volumes

| Volume | Uso |
|--------|-----|
| `runtime_data` | SQLite runtime (auth/replay pilot) se `RUNTIME_DATABASE_URL` vazio |
| `redis_data` | Fila/cache worker |

Backup runtime:

```bash
docker run --rm -v tcg-judge-production_runtime_data:/data -v $(pwd):/backup alpine \
  tar czf /backup/runtime_data.tgz -C /data .
```

## Rollback

```bash
git checkout <commit-anterior>
./scripts/ec2/deploy_production.sh
```

Ou com imagem taggeada:

```bash
export ROLLBACK_API_IMAGE=tcg-judge-production-api:20260101-120000
./scripts/ec2/rollback.sh
```

## DNS RDS

O compose define DNS da VPC (`172.31.0.2`, `169.254.169.253`) para resolver o hostname RDS dentro do container.

## Migrar do compose antigo

1. Parar stack antiga: `docker compose down`
2. Copiar `.env` antigo para revisar chaves
3. Garantir `RUNTIME_AUTH_SECRET` no secret ou `.env.production`
4. `./scripts/ec2/start-api.sh`

## Troubleshooting

| Sintoma | Ação |
|---------|------|
| `InvalidPasswordError` | Corrigir password na URL; URL-encode |
| API não resolve RDS | Verificar SG + DNS no compose |
| `/runtime/health` 404 | Imagem antiga; `docker compose build --no-cache api` |
| Secrets KMS denied | IAM role EC2 + política KMS |
| Login 401 | Primeiro deploy cria admin/admin; alterar em produção |
| Console: `Network error — API unreachable` | Browser chamava `127.0.0.1:8000`. Na EC2: `git pull`, apague `.env.local` com URL errada, reinicie `npm run dev` (usa `/api/proxy`). No PC: `NEXT_PUBLIC_API_URL=http://IP_EC2:8000` e SG porta 8000 |

## Runtime Console (frontend na EC2)

```bash
cd ~/seekguidance2/frontend/runtime_console_v3
# Opcional: sem .env.local — o browser usa /api/proxy (Next → API em 127.0.0.1:8000)
npm install
npm run dev -- -H 0.0.0.0 -p 3000
```

Acesso: `http://<IP_PUBLICO>:3000` — credenciais piloto: `admin` / `admin`.

## Arquivos

- `docker-compose.production.yml` — compose principal EC2
- `services/api/Dockerfile.production` — imagem API com curl + runtime
- `scripts/ec2/start-api.sh` — entrada recomendada na EC2
- `.env.production.example` — template local
