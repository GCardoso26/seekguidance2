#!/usr/bin/env bash
# Ponto de entrada na EC2 (substitui ~/seekguidance2/start-api.sh).
# 1) Carrega Secrets Manager  2) Deploy compose production
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT"

export AWS_SECRET_ID="${AWS_SECRET_ID:-tcg-judge/production/api}"
export AWS_REGION="${AWS_REGION:-us-east-1}"

echo "==> start-api: $REPO_ROOT"

if command -v aws >/dev/null 2>&1; then
  bash scripts/ec2/load_secrets.sh
else
  echo "aws CLI indisponível; usando .env.production existente"
fi

exec bash scripts/ec2/deploy_production.sh
