#!/usr/bin/env bash
# Instala Caddy e activa HTTPS para judgetcg.com.br → Next :3000
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
CADDYFILE_SRC="${REPO_ROOT}/infra/caddy/Caddyfile"
DOMAIN="${JUDGETCG_DOMAIN:-judgetcg.com.br}"

if [[ ! -f "$CADDYFILE_SRC" ]]; then
  echo "Caddyfile não encontrado: $CADDYFILE_SRC"
  exit 1
fi

if ! command -v caddy >/dev/null 2>&1; then
  echo "==> Instalar Caddy"
  sudo apt-get update
  sudo apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
  sudo apt-get update
  sudo apt-get install -y caddy
fi

echo "==> Publicar Caddyfile (${DOMAIN})"
sudo mkdir -p /etc/caddy
sudo cp "$CADDYFILE_SRC" /etc/caddy/Caddyfile
sudo caddy validate --config /etc/caddy/Caddyfile

echo "==> Reiniciar Caddy"
sudo systemctl enable caddy
sudo systemctl reload caddy || sudo systemctl restart caddy
sudo systemctl status caddy --no-pager || true

echo ""
echo "OK: Caddy activo."
echo "  - Certificado HTTPS: automático após DNS apontar para este servidor (portas 80/443 abertas)."
echo "  - Site: https://${DOMAIN}/judge"
echo "  - Confirme: curl -sI https://${DOMAIN} | head -5"
