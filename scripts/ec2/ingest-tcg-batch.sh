#!/usr/bin/env bash
# Ingestão batch de PDFs oficiais (pokemon, lorcana, yugioh, onepiece) na EC2.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT"

if [[ ! -f .env.production ]]; then
  echo "Execute: bash scripts/ec2/load_secrets.sh"
  exit 1
fi
set -a
# shellcheck disable=SC1091
source .env.production
set +a

if [[ -z "${OPENAI_API_KEY:-}" ]]; then
  echo "OPENAI_API_KEY obrigatório em .env.production"
  exit 1
fi

pip install -q -e services/ingestion 2>/dev/null || pip install -e services/ingestion
pip install -q -r services/api/requirements.txt 2>/dev/null || true

for GAME in pokemon lorcana yugioh onepiece; do
  echo "========== $GAME =========="
  python scripts/ingest_tcg.py --game "$GAME" --all || {
    echo "AVISO: ingestão $GAME falhou (ver URL/PDF/rede)"
  }
done

echo "Ingestão batch concluída."
