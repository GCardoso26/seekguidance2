#!/usr/bin/env bash
# Bootstrap inicial na EC2 (Ubuntu): Docker + permissões.
set -euo pipefail

if ! command -v docker >/dev/null 2>&1; then
  sudo apt-get update
  sudo apt-get install -y ca-certificates curl
  curl -fsSL https://get.docker.com | sudo sh
  sudo usermod -aG docker "$USER"
  echo "Re-login necessário para grupo docker"
fi

if ! docker compose version >/dev/null 2>&1; then
  sudo apt-get install -y docker-compose-plugin || true
fi

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
chmod +x "$REPO_ROOT"/scripts/ec2/*.sh 2>/dev/null || true

echo "Bootstrap EC2 OK. Próximo passo:"
echo "  cd $REPO_ROOT && ./scripts/ec2/start-api.sh"
