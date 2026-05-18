#!/usr/bin/env bash
# Deploy produção EC2 — docker compose production + healthcheck.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT"

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.production.yml}"
ENV_FILE="${ENV_FILE:-.env.production}"

echo "==> TCG Judge production deploy"
echo "    compose: $COMPOSE_FILE"
echo "    env:     $ENV_FILE"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Arquivo $ENV_FILE não encontrado."
  echo "Execute: ./scripts/ec2/load_secrets.sh"
  echo "Ou copie: cp .env.production.example .env.production"
  exit 1
fi

if ! grep -q '^RUNTIME_AUTH_SECRET=.' "$ENV_FILE" 2>/dev/null; then
  echo "RUNTIME_AUTH_SECRET obrigatório em $ENV_FILE" >&2
  exit 1
fi

if ! grep -q '^DATABASE_URL=.' "$ENV_FILE" 2>/dev/null; then
  echo "DATABASE_URL obrigatório (RDS) em $ENV_FILE" >&2
  exit 1
fi

TAG="${DEPLOY_TAG:-$(date +%Y%m%d-%H%M%S)}"
echo "$TAG" > .deploy-last-tag
echo "Tag deploy: $TAG"

echo "==> Liberar espaço em disco (Docker)"
docker system prune -f >/dev/null 2>&1 || true
docker builder prune -f >/dev/null 2>&1 || true
df -h / /var/lib/docker 2>/dev/null || df -h /

echo "==> Build imagens"
if [[ "${SKIP_WORKER_BUILD:-0}" == "1" ]]; then
  docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build api
  docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d api redis
else
  docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build api worker
  docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d
fi

echo "==> Aguardar health"
sleep 8
./scripts/ec2/healthcheck.sh

echo "==> Deploy concluído ($TAG)"
docker compose -f "$COMPOSE_FILE" ps
