#!/usr/bin/env bash
# Cria venv local para ingestão (evita PEP 668 no Ubuntu 24+).
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT"
VENV="${REPO_ROOT}/.venv-ingest"

# Python 3.12 tem wheels prontos para lxml; 3.14 costuma compilar do fonte.
if command -v python3.12 >/dev/null 2>&1; then
  PYTHON=python3.12
else
  PYTHON=python3
fi
echo "==> Python: $($PYTHON --version)"

need_apt=0
for pkg in libxml2-dev libxslt1-dev python3-dev build-essential; do
  if ! dpkg -s "$pkg" >/dev/null 2>&1; then
    need_apt=1
    break
  fi
done
if [[ "$need_apt" -eq 1 ]]; then
  echo ""
  echo "Instale dependências de sistema (necessário para lxml/PDF):"
  echo "  sudo apt-get update"
  echo "  sudo apt-get install -y python3-venv python3-full python3-dev build-essential libxml2-dev libxslt1-dev zlib1g-dev"
  echo ""
  if [[ "${SKIP_APT_CHECK:-0}" != "1" ]]; then
    exit 1
  fi
fi

if [[ ! -f "${VENV}/bin/activate" ]]; then
  if [[ -d "$VENV" ]]; then
    echo "==> Removendo venv incompleto: $VENV"
    rm -rf "$VENV"
  fi
  echo "==> Criando venv em $VENV"
  if ! "$PYTHON" -m venv "$VENV"; then
    echo "Falha ao criar venv. Tente: sudo apt-get install -y python3-venv python3.12-venv"
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
