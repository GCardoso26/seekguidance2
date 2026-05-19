#!/usr/bin/env bash
# ATENÇÃO: derruba todos os containers. Preferir: bash scripts/ec2/cleanup_disk.sh
set -euo pipefail

echo "Antes:"
df -h / /var/lib/docker 2>/dev/null || df -h /

docker compose -f docker-compose.production.yml down 2>/dev/null || true
docker compose -f docker-compose.yml down 2>/dev/null || true
docker system prune -af
docker builder prune -af
docker volume prune -f

sudo apt-get clean 2>/dev/null || true
sudo rm -rf /var/cache/apt/archives/* 2>/dev/null || true

echo "Depois:"
df -h / /var/lib/docker 2>/dev/null || df -h /
