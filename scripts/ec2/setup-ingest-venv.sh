#!/usr/bin/env bash
# Cria venv local para ingestão (evita PEP 668 no Ubuntu 24+).
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT"
VENV="${REPO_ROOT}/.venv-ingest"

if [[ ! -d "$VENV" ]]; then
  echo "==> Criando venv em $VENV"
  python3 -m venv "$VENV"
fi

# shellcheck disable=SC1091
source "$VENV/bin/activate"
pip install -U pip wheel
pip install -e services/ingestion

echo "OK: use  source ${VENV}/bin/activate  antes de ingest_tcg.py"
echo "    ou:  bash scripts/ec2/ingest-tcg-batch.sh"
