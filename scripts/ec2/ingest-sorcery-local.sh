#!/usr/bin/env bash
# Ingestão Sorcery com PDF local em data/ingest/sorcery/
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT"
VENV="${REPO_ROOT}/.venv-ingest"
SORCERY_DIR="${REPO_ROOT}/data/ingest/sorcery"

if [[ ! -f .env.production ]]; then
  echo "Execute: bash scripts/ec2/load_secrets.sh"
  exit 1
fi

if [[ ! -x "${VENV}/bin/python" ]]; then
  echo "Rode: bash scripts/ec2/setup-ingest-venv.sh"
  exit 1
fi

found=0
for name in \
  Sorcery-Contested-Realm-Rulebook-October-2024.pdf \
  Sorcery-Contested-Realm-Rulebook.pdf \
  Sorcery-Rulebook.pdf \
  sorcery-rulebook.pdf
do
  if [[ -f "${SORCERY_DIR}/${name}" ]]; then
    echo "PDF encontrado: ${SORCERY_DIR}/${name}"
    found=1
    break
  fi
done

if [[ "$found" -eq 0 ]]; then
  echo "Nenhum PDF em ${SORCERY_DIR}/"
  echo "Baixe o rulebook em https://sorcerytcg.com/how-to-play e coloque na pasta."
  echo "Ver: data/ingest/sorcery/README.md"
  exit 1
fi

set -a
# shellcheck disable=SC1091
source .env.production
set +a

export PYTHONPATH="${REPO_ROOT}/services/ingestion"
"${VENV}/bin/python" scripts/ingest_tcg.py --game sorcery --all
echo "Sorcery ingestão concluída."
