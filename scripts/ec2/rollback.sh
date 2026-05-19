#!/usr/bin/env bash
# Rollback simples: reverter para imagem anterior (requer tag salva manualmente).
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT"

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.production.yml}"
ENV_FILE="${ENV_FILE:-.env.production}"

PREV_IMAGE="${ROLLBACK_API_IMAGE:-}"

if [[ -z "$PREV_IMAGE" ]]; then
  echo "Defina ROLLBACK_API_IMAGE=tcg-judge-production-api:<tag-anterior>"
  echo "Ou: docker compose -f $COMPOSE_FILE down && git checkout <commit> && ./scripts/ec2/deploy_production.sh"
  exit 1
fi

docker tag "$PREV_IMAGE" tcg-judge-production-api:latest
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d api
./scripts/ec2/healthcheck.sh
echo "Rollback aplicado: $PREV_IMAGE"
