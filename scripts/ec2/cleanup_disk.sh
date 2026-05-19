#!/usr/bin/env bash
# Libera espaço SEM derrubar API em produção (diferente de free_disk.sh).
set -euo pipefail

echo "Antes:"
df -h /

# Frontend (build na EC2 costuma falhar — libera muito espaço)
rm -rf frontend/runtime_console_v3/node_modules frontend/runtime_console_v3/.next 2>/dev/null || true
rm -rf ~/.npm/_cacache 2>/dev/null || true

docker builder prune -af 2>/dev/null || true
docker image prune -af 2>/dev/null || true

sudo apt-get clean 2>/dev/null || true
sudo rm -rf /var/cache/apt/archives/* 2>/dev/null || true
sudo journalctl --vacuum-size=50M 2>/dev/null || true

echo "Depois:"
df -h /
