#!/usr/bin/env bash
# Ingerir PDFs Pokémon colocados em data/ingest/pokemon/ (contorna Incapsula).
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT"

DIR="${REPO_ROOT}/data/ingest/pokemon"
if [[ ! -d "$DIR" ]]; then
  mkdir -p "$DIR"
fi

if [[ ! -f .env.production ]]; then
  echo "Execute: bash scripts/ec2/load_secrets.sh"
  exit 1
fi

shopt -s nullglob
files=("$DIR"/*.pdf)
if [[ ${#files[@]} -eq 0 ]]; then
  echo "Nenhum PDF em $DIR"
  echo "Veja: data/ingest/pokemon/README.md"
  exit 1
fi

COMPOSE="docker compose -f docker-compose.production.yml --env-file .env.production"

echo "==> PDFs encontrados:"
ls -la "$DIR"/*.pdf

echo "==> Re-ingestão pokemon (catálogo + ficheiros locais)"
$COMPOSE run --rm \
  -v "${REPO_ROOT}:/repo" \
  -w /repo \
  worker \
  python scripts/ingest_tcg.py --game pokemon --all

echo "OK: ingestão pokemon concluída."
