#!/usr/bin/env bash
# Ingestão batch de PDFs oficiais (pokemon, lorcana, yugioh, onepiece) na EC2.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT"
VENV="${REPO_ROOT}/.venv-ingest"

if [[ ! -f .env.production ]]; then
  echo "Execute: bash scripts/ec2/load_secrets.sh"
  exit 1
fi

if [[ ! -x "${VENV}/bin/python" ]]; then
  echo "Venv de ingestão não encontrado. Rode:"
  echo "  bash scripts/ec2/setup-ingest-venv.sh"
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

PY="${VENV}/bin/python"

for GAME in pokemon lorcana yugioh onepiece fab digimon gundam dbfw sorcery vanguard riftbound union_arena; do
  echo "========== $GAME =========="
  "$PY" scripts/ingest_tcg.py --game "$GAME" --all || {
    echo "AVISO: ingestão $GAME falhou (ver URL/PDF/rede)"
  }
done

echo "Ingestão batch concluída."
