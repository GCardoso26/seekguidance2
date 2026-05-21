#!/usr/bin/env bash
# Instala systemd para o console Next em produção (após primeiro build manual opcional).
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
UNIT_SRC="${REPO_ROOT}/infra/systemd/judgetcg-console.service"
UNIT_DST="/etc/systemd/system/judgetcg-console.service"

if [[ ! -f "$UNIT_SRC" ]]; then
  echo "Service template não encontrado"
  exit 1
fi

sudo sed "s|REPO_ROOT_PLACEHOLDER|${REPO_ROOT}|g" "$UNIT_SRC" | sudo tee "$UNIT_DST" >/dev/null
sudo systemctl daemon-reload
sudo systemctl enable judgetcg-console.service
echo "OK: judgetcg-console.service instalado."
echo "  sudo systemctl start judgetcg-console"
echo "  sudo journalctl -u judgetcg-console -f"
