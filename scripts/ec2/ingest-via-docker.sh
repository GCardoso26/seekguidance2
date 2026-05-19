#!/usr/bin/env bash
# Ingestão via container worker (Python 3.12) — evita venv no host.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT"

if [[ ! -f .env.production ]]; then
  echo "Execute: bash scripts/ec2/load_secrets.sh"
  exit 1
fi

COMPOSE="docker compose -f docker-compose.production.yml --env-file .env.production"

echo "==> Build imagem worker (pode demorar na primeira vez)"
$COMPOSE build worker

GAME="${1:-all}"
run_ingest() {
  local g="$1"
  echo "========== $g =========="
  $COMPOSE run --rm \
    -v "${REPO_ROOT}:/repo" \
    -w /repo \
    -e PYTHONPATH=/repo/services/ingestion \
    worker \
    python scripts/ingest_tcg.py --game "$g" --all || echo "AVISO: falhou $g"
}

if [[ "$GAME" == "all" ]]; then
  for g in pokemon lorcana yugioh onepiece; do
    run_ingest "$g"
  done
else
  run_ingest "$GAME"
fi

echo "Ingestão via Docker concluída."
