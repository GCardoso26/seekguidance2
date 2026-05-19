#!/usr/bin/env bash
# Cria venv local para ingestão (evita PEP 668 no Ubuntu 24+).
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT"
VENV="${REPO_ROOT}/.venv-ingest"

if [[ ! -f "${VENV}/bin/activate" ]]; then
  if [[ -d "$VENV" ]]; then
    echo "==> Removendo venv incompleto: $VENV"
    rm -rf "$VENV"
  fi
  echo "==> Criando venv em $VENV"
  if ! python3 -m venv "$VENV"; then
    echo ""
    echo "Falha ao criar venv. Instale o módulo venv:"
    echo "  sudo apt-get update"
    echo "  sudo apt-get install -y python3-venv python3-full"
    exit 1
  fi
fi

# shellcheck disable=SC1091
source "${VENV}/bin/activate"
pip install -U pip wheel
pip install -e services/ingestion

echo ""
echo "OK. Próximo passo:"
echo "  bash scripts/ec2/load_secrets.sh"
echo "  bash scripts/ec2/ingest-tcg-batch.sh"
