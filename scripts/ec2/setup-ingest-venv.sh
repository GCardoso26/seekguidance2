#!/usr/bin/env bash
# Cria venv Python 3.12 para ingestão (3.14 quebra lxml/tiktoken sem wheels).
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT"
VENV="${REPO_ROOT}/.venv-ingest"

if ! command -v python3.12 >/dev/null 2>&1; then
  echo "Python 3.12 é obrigatório (a imagem API usa 3.12; 3.14 falha ao compilar lxml/tiktoken)."
  echo ""
  echo "  sudo apt-get update"
  echo "  sudo apt-get install -y python3.12 python3.12-venv python3.12-dev \\"
  echo "    build-essential libxml2-dev libxslt1-dev zlib1g-dev"
  echo ""
  echo "Alternativa sem venv no host:"
  echo "  bash scripts/ec2/ingest-via-docker.sh"
  exit 1
fi

PYTHON=python3.12
echo "==> Python: $($PYTHON --version)"

if [[ ! -f "${VENV}/bin/activate" ]] || ! "${VENV}/bin/python" -c 'import sys; exit(0 if sys.version_info[:2]==(3,12) else 1)'; then
  if [[ -d "$VENV" ]]; then
    echo "==> Removendo venv antigo (versão errada do Python)"
    rm -rf "$VENV"
  fi
  echo "==> Criando venv em $VENV"
  "$PYTHON" -m venv "$VENV"
fi

# shellcheck disable=SC1091
source "${VENV}/bin/activate"
pip install -U pip wheel
pip install -e services/ingestion

echo ""
echo "OK ($(python --version)). Próximo passo:"
echo "  bash scripts/ec2/load_secrets.sh"
echo "  bash scripts/ec2/ingest-tcg-batch.sh"
